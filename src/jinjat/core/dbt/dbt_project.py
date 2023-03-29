import sys

import dbt.adapters.factory
from dbt.exceptions import CompilationError
from pydantic import BaseModel

from jinjat.core.exceptions import ExecuteSqlFailure

# This is critical because `get_adapter` is all over dbt-core
# as they expect a singleton adapter instance per plugin,
# so dbt-niceDatabase will have one adapter instance named niceDatabase.
# This makes sense in dbt-land where we have a single Project/Profile
# combination executed in process from start to finish or a single tenant RPC
# This doesn't fit our paradigm of one adapter per DbtProject in a multitenant server,
# so we create an adapter instance **independent** of the FACTORY cache
# and attach it directly to our RuntimeConfig which is passed through
# anywhere dbt-core needs config including in all `get_adapter` calls
dbt.adapters.factory.get_adapter = lambda config: config.adapter

from jinjat.core.dbt.config import ConfigInterface, YamlHandler, JINJAT_MACRO_NAME, RAW_CODE, COMPILED_CODE, \
    has_jinja, T
from jinjat.core.models import DbtQueryRequestContext, DbtAdapterExecutionResult, DbtAdapterCompilationResult
import os
import threading
import time
import uuid
from collections import OrderedDict
from copy import copy
from functools import lru_cache
from functools import partial
from typing import (
    Any,
    Callable,
    Tuple,
)
from typing import (
    Dict,
    List,
    Optional,
)

import agate
from dbt.adapters.base import BaseRelation
from dbt.adapters.factory import Adapter, get_adapter_class_by_name
from dbt.config.runtime import RuntimeConfig
from dbt.context.providers import generate_runtime_model_context
from dbt.contracts.connection import AdapterResponse
from dbt.contracts.graph.manifest import ManifestNode, MaybeNonSource, MaybeParsedSource
from dbt.flags import set_from_args
from dbt.node_types import NodeType
from dbt.parser.manifest import ManifestLoader, process_node
from dbt.parser.sql import SqlBlockParser, SqlMacroParser
from dbt.task.parse import MANIFEST_FILE_NAME
from dbt.task.sql import SqlCompileRunner, SqlExecuteRunner

from jinjat.core.log_controller import logger


class DbtProject:
    """Container for a dbt project. The dbt attribute is the primary interface for
    dbt-core. The adapter attribute is the primary interface for the dbt adapter"""

    ADAPTER_TTL = 3600

    def __init__(
            self,
            target: Optional[str] = None,
            profiles_dir: Optional[str] = None,
            project_dir: Optional[str] = None,
            threads: Optional[int] = 1,
            vars: Optional[str] = "{}",
            profile: Optional[str] = None,
    ):
        self.args = ConfigInterface(
            threads=threads,
            target=target,
            profiles_dir=profiles_dir,
            project_dir=project_dir,
            vars=vars,
            profile=profile
        )

        self.parse_project(init=True)

        # Utilities
        self._yaml_handler: Optional[YamlHandler] = None
        self._sql_parser: Optional[SqlBlockParser] = None
        self._macro_parser: Optional[SqlMacroParser] = None
        self._sql_runner: Optional[SqlExecuteRunner] = None
        self._sql_compiler: Optional[SqlCompileRunner] = None

        # Tracks internal state version
        self._version: int = 1
        self.mutex = threading.Lock()
        # atexit.register(lambda dbt_project: dbt_project.adapter.connections.cleanup_all, self)

    def get_adapter(self):
        """This inits a new Adapter which is fundamentally different than
        the singleton approach in the core lib"""
        adapter_name = self.config.credentials.type
        return get_adapter_class_by_name(adapter_name)(self.config)

    def init_adapter(self):
        """Initialize a dbt adapter."""
        if hasattr(self, "_adapter"):
            self._adapter.connections.cleanup_all()
        # The setter verifies connection, resets TTL, and updates adapter ref on config
        self.adapter = self.get_adapter()

    @property
    def adapter(self):
        """dbt-core adapter with TTL and automatic reinstantiation"""
        if time.time() - self._adapter_ttl > self.ADAPTER_TTL:
            logger().info("TTL expired, reinitializing adapter!")
            self.init_adapter()
        return self._adapter

    @adapter.setter
    def adapter(self, adapter: Adapter):
        """Verify connection and reset TTL on adapter set, update adapter prop ref on config"""
        self._adapter = self._verify_connection(adapter)
        self._adapter_ttl = time.time()
        self.config.adapter = self.adapter

    def parse_project(self, init: bool = False) -> None:
        """Parses project on disk from `ConfigInterface` in args attribute, verifies connection
        to adapters database, mutates config, adapter, and dbt attributes"""
        if init:
            set_from_args(self.args, self.args)
            self.config = RuntimeConfig.from_args(self.args)
            self.init_adapter()

        project_parser = ManifestLoader(
            self.config, self.config.load_dependencies(), self.adapter.connections.set_query_header
        )
        # endpatched (https://github.com/dbt-labs/dbt-core/blob/main/core/dbt/parser/manifest.py#L545)
        try:
            self.dbt = project_parser.load()
        except CompilationError as e:
            logger().error(f"Encountered an error loading dbt module:\n{e}")
            sys.exit(1)
        self.dbt.build_flat_graph()
        project_parser.save_macros_to_adapter(self.adapter)
        self._sql_parser = None
        self._macro_parser = None
        self._sql_compiler = None
        self._sql_runner = None

    @property
    def yaml_handler(self) -> YamlHandler:
        """A YAML handler for loading and dumping yaml files on disk"""
        if self._yaml_handler is None:
            self._yaml_handler = YamlHandler()
        return self._yaml_handler

    @property
    def sql_parser(self) -> SqlBlockParser:
        """A dbt-core SQL parser capable of parsing and adding nodes to the manifest via `parse_remote` which will
        also return the added node to the caller. Note that post-parsing this still typically requires calls to
        `_process_nodes_for_ref` and `_process_sources_for_ref` from `dbt.parser.manifest`"""
        if self._sql_parser is None:
            self._sql_parser = SqlBlockParser(self.config, self.dbt, self.config)
        return self._sql_parser

    @property
    def macro_parser(self) -> SqlMacroParser:
        """A dbt-core macro parser"""
        if self._macro_parser is None:
            self._macro_parser = SqlMacroParser(self.config, self.dbt)
        return self._macro_parser

    @property
    def sql_runner(self) -> SqlExecuteRunner:
        """A runner which is used internally by the `execute_sql` function of `dbt.lib`.
        The runners `node` attribute can be updated before calling `compile` or `compile_and_execute`."""
        if self._sql_runner is None:
            self._sql_runner = SqlExecuteRunner(
                self.config, self.adapter, node=None, node_index=1, num_nodes=1
            )
        return self._sql_runner

    @property
    def sql_compiler(self) -> SqlCompileRunner:
        """A runner which is used internally by the `compile_sql` function of `dbt.lib`.
        The runners `node` attribute can be updated before calling `compile` or `compile_and_execute`."""
        if self._sql_compiler is None:
            self._sql_compiler = SqlCompileRunner(
                self.config, self.adapter, node=None, node_index=1, num_nodes=1
            )
        return self._sql_compiler

    def _verify_connection(self, adapter: Adapter) -> Adapter:
        """Verification for adapter + profile. Used as a passthrough,
        ie: `self.adapter = _verify_connection(get_adapter(...))`
        This also seeds the master connection"""
        try:
            adapter.connections.set_connection_name()
            adapter.debug_query()
        except Exception as query_exc:
            raise Exception(f"Could not connect to Database: {query_exc}") from query_exc
        else:
            return adapter

    def adapter_probe(self) -> bool:
        """Check adapter connection, useful for long running processes such as the server or playground"""
        if not hasattr(self, "adapter") or self.adapter is None:
            return False
        try:
            with self.adapter.connection_named("jinjat-heartbeat"):
                self.adapter.debug_query()
        except Exception:
            # TODO: we can decide to reinit the Adapter here
            return False
        logger().info("Heartbeat received for %s", self.project_name)
        return True

    def fn_threaded_conn(self, fn: Callable[..., T], *args, **kwargs) -> Callable[..., T]:
        """Used for jobs which are intended to be submitted to a thread pool,
        the 'master' thread should always have an available connection for the duration of
        typical program runtime by virtue of the `_verify_connection` method.
        Threads however require singleton seeding"""

        def _with_conn() -> T:
            self.adapter.connections.set_connection_name()
            return fn(*args, **kwargs)

        return _with_conn

    def generate_runtime_model_context(self, node: ManifestNode):
        """Wraps dbt context provider"""
        return generate_runtime_model_context(node, self.config, self.dbt)

    @property
    def project_name(self) -> str:
        """dbt project name"""
        return self.config.project_name

    @property
    def project_root(self) -> str:
        """dbt project root"""
        return self.config.project_root

    def safe_parse_project(self, reinit: bool = False) -> None:
        """This is used to reseed the DbtProject safely post-init. This is
        intended for use by the jinjat server"""
        if reinit:
            self.clear_caches()
        _config_pointer = copy(self.config)
        try:
            self.parse_project(init=reinit)
        except Exception as parse_error:
            self.config = _config_pointer
            raise parse_error
        self.write_manifest_artifact()

    def write_manifest_artifact(self) -> None:
        """Write a manifest.json to disk"""
        artifact_path = os.path.join(
            self.config.project_root, self.config.target_path, MANIFEST_FILE_NAME
        )
        self.dbt.write(artifact_path)

    def clear_caches(self) -> None:
        """Clear least recently used caches and reinstantiable container objects"""
        self.get_ref_node.cache_clear()
        self.get_source_node.cache_clear()
        self.get_macro_function.cache_clear()
        self.get_columns.cache_clear()
        self.compile_sql.cache_clear()

    @lru_cache(maxsize=10)
    def get_ref_node(self, target_model_name: str) -> MaybeNonSource:
        """Get a `ManifestNode` from a dbt project model name"""
        return self.dbt.resolve_ref(
            target_model_name=target_model_name,
            target_model_package=None,
            current_project=self.config.project_name,
            node_package=self.config.project_name,
        )

    @lru_cache(maxsize=10)
    def get_source_node(self, target_source_name: str, target_table_name: str) -> MaybeParsedSource:
        """Get a `ManifestNode` from a dbt project source name and table name"""
        return self.dbt.resolve_source(
            target_source_name=target_source_name,
            target_table_name=target_table_name,
            current_project=self.config.project_name,
            node_package=self.config.project_name,
        )

    def get_server_node(self, sql: str, node_name="name"):
        """Get a node for SQL execution against adapter"""
        self._clear_node(node_name)
        sql_node = self.sql_parser.parse_remote(sql, node_name)
        process_node(self.config, self.dbt, sql_node)
        return sql_node

    @lru_cache(maxsize=10)
    def get_node_by_path(self, path: str):
        """Find an existing node given relative file path."""
        for node in self.dbt.nodes.values():
            if node.original_file_path == path:
                return node
        return None

    @lru_cache(maxsize=100)
    def get_macro_function(self, macro_name: str) -> Callable[[Dict[str, Any]], Any]:
        """Get macro as a function which takes a dict via argument named `kwargs`,
        ie: `kwargs={"relation": ...}`

        make_schema_fn = get_macro_function('make_schema')\n
        make_schema_fn({'name': '__test_schema_1'})\n
        make_schema_fn({'name': '__test_schema_2'})"""
        return partial(self.adapter.execute_macro, macro_name=macro_name, manifest=self.dbt)

    def adapter_execute(
            self, sql: str, auto_begin: bool = False, fetch: bool = False
    ) -> Tuple[AdapterResponse, agate.Table]:
        """Wraps adapter.execute. Execute SQL against database"""
        return self.adapter.execute(sql, auto_begin, fetch)

    def execute_macro(
            self,
            macro: str,
            kwargs: Optional[Dict[str, Any]] = None,
    ) -> Any:
        """Wraps adapter execute_macro. Execute a macro like a function."""
        return self.get_macro_function(macro)(kwargs=kwargs)

    def execute_sql(self, raw_sql: str, ctx: DbtQueryRequestContext, fetch: bool = True) -> DbtAdapterExecutionResult:
        """Execute dbt SQL statement against database"""
        # if no jinja chars then these are synonymous
        compiled_sql = raw_sql
        if has_jinja(raw_sql):
            # jinja found, compile it
            try:
                compiled_node = self.compile_sql(raw_sql, ctx)
                compiled_sql = compiled_node.compiled_sql
            except Exception as e:
                raise ExecuteSqlFailure(raw_sql, None, e)
        try:
            table = self.adapter_execute(compiled_sql, fetch=fetch)
        except Exception as e:
            raise ExecuteSqlFailure(raw_sql, compiled_sql, e)

        return DbtAdapterExecutionResult(
            *table,
            raw_sql,
            compiled_sql,
        )

    def compile_sql(self, raw_sql: str, ctx: DbtQueryRequestContext, retry: int = 3) -> DbtAdapterCompilationResult:
        """Creates a node with `get_server_node` method. Compile generated node.
        Has a retry built in because even uuidv4 cannot gaurantee uniqueness at the speed
        in which we can call this function concurrently. A retry significantly increases the stability"""
        temp_node_id = str(uuid.uuid4())
        try:
            node = self.compile_node(self.get_server_node(raw_sql, temp_node_id), ctx)
        except Exception as exc:
            if retry > 0:
                return self.compile_sql(raw_sql, ctx, retry - 1)
            raise exc
        else:
            return node
        finally:
            self._clear_node(temp_node_id)

    def compile_node(self, node: ManifestNode, ctx: DbtQueryRequestContext) -> DbtAdapterCompilationResult:
        """Compiles existing node."""
        self.sql_compiler.node = node
        compiler = self.adapter.get_compiler()
        compiled_node = compiler.compile_node(self.sql_compiler.node,
                                              self.dbt,
                                              {JINJAT_MACRO_NAME: lambda _=None: ctx},
                                              write=False)
        return DbtAdapterCompilationResult(
            getattr(compiled_node, RAW_CODE),
            getattr(compiled_node, COMPILED_CODE),
            compiled_node,
        )

    def _clear_node(self, name="name"):
        """Removes the statically named node created by `execute_sql` and `compile_sql` in `dbt.lib`"""
        self.dbt.nodes.pop(f"{NodeType.SqlOperation}.{self.project_name}.{name}", None)

    def get_relation(self, database: str, schema: str, name: str) -> Optional[BaseRelation]:
        """Wrapper for `adapter.get_relation`"""
        return self.adapter.get_relation(database, schema, name)

    def create_relation(self, database: str, schema: str, name: str) -> BaseRelation:
        """Wrapper for `adapter.Relation.create`"""
        return self.adapter.Relation.create(database, schema, name)

    def create_relation_from_node(self, node: ManifestNode) -> BaseRelation:
        """Wrapper for `adapter.Relation.create_from`"""
        return self.adapter.Relation.create_from(self.config, node)

    def get_columns_in_relation(self, node: ManifestNode) -> List[str]:
        """Wrapper for `adapter.get_columns_in_relation`"""
        return self.adapter.get_columns_in_relation(self.create_relation_from_node(node))

    def get_or_create_relation(
            self, database: str, schema: str, name: str
    ) -> Tuple[BaseRelation, bool]:
        """Get relation or create if not exists. Returns tuple of relation and
        boolean result of whether it existed ie: (relation, did_exist)"""
        ref = self.get_relation(database, schema, name)
        return (ref, True) if ref else (self.create_relation(database, schema, name), False)

    def create_schema(self, node: ManifestNode):
        """Create a schema in the database"""
        return self.execute_macro(
            "create_schema",
            kwargs={"relation": self.create_relation_from_node(node)},
        )

    def materialize(
            self, node: ManifestNode, temporary: bool = True
    ) -> Tuple[AdapterResponse, None]:
        """Materialize a table in the database"""
        return self.adapter_execute(
            # Returns CTAS string so send to adapter.execute
            self.execute_macro(
                "create_table_as",
                kwargs={
                    "sql": getattr(node, COMPILED_CODE),
                    "relation": self.create_relation_from_node(node),
                    "temporary": temporary,
                },
            ),
            auto_begin=True,
        )

    @classmethod
    def from_args(cls, args: ConfigInterface) -> "DbtProject":
        """Instatiate the DbtProject directly from a ConfigInterface instance"""
        return cls(
            target=args.target,
            profiles_dir=args.profiles_dir,
            project_dir=args.project_dir,
            threads=args.threads,
        )


class DbtTarget(BaseModel):
    target: Optional[str] = None
    profiles_dir: Optional[str] = None
    project_dir: Optional[str] = None
    static_dir: Optional[str] = None
    refine: Optional[bool] = False
    threads: Optional[int] = 1
    vars: Optional[str] = "{}"


class DbtProjectContainer:
    """This class manages multiple DbtProjects which each correspond
    to a single dbt project on disk. This is mostly for jinjat server use"""

    def __init__(self):
        self._projects: Dict[str, DbtProject] = OrderedDict()
        self._default_project: Optional[str] = None

    def get_project(self, project_name: str = None) -> Optional[DbtProject]:
        """Primary interface to get a project and execute code"""
        if project_name is None:
            return self.get_default_project()
        else:
            return self._projects.get(project_name)

    @lru_cache(maxsize=10)
    def get_project_by_root_dir(self, root_dir: str) -> Optional[DbtProject]:
        """Get a project by its root directory."""
        root_dir = os.path.abspath(os.path.normpath(root_dir))
        for project in self._projects.values():
            if os.path.abspath(project.project_root) == root_dir:
                return project
        return None

    def get_default_project(self) -> Optional[DbtProject]:
        """Gets the default project which at any given time is the
        earliest project inserted into the container"""
        return self._projects.get(self._default_project)

    def add_project(
            self,
            dbt_target: DbtTarget,
            name_override: Optional[str] = None
    ) -> DbtProject:
        """Add a DbtProject with arguments"""
        project = DbtProject(dbt_target.target, dbt_target.profiles_dir, dbt_target.project_dir, dbt_target.threads,
                             dbt_target.vars)
        project_name = name_override or project.config.project_name
        if self._default_project is None:
            self._default_project = project_name
        self._projects[project_name] = project
        return project

    def add_parsed_project(self, project: DbtProject) -> DbtProject:
        """Add an already instantiated DbtProject"""
        self._projects.setdefault(project.config.project_name, project)
        return project

    def add_project_from_args(self, args: ConfigInterface) -> DbtProject:
        """Add a DbtProject from a ConfigInterface"""
        project = DbtProject.from_args(args)
        self._projects.setdefault(project.config.project_name, project)
        return project

    def drop_project(self, project_name: str) -> None:
        """Drop a DbtProject"""
        project = self.get_project(project_name)
        if project is None:
            return
        project.clear_caches()
        project.adapter.connections.cleanup_all()
        self._projects.pop(project_name)
        if self._default_project == project_name:
            if len(self) > 0:
                self._default_project = self._projects.keys()[0]
            else:
                self._default_project = None

    def drop_all_projects(self) -> None:
        """Drop all DbtProjectContainers"""
        self._default_project = None
        for project in self._projects:
            self.drop_project(project)

    def reparse_all_projects(self) -> None:
        """Reparse all projects"""
        for project in self:
            project.safe_parse_project()

    def registered_projects(self) -> List[str]:
        """Convenience to grab all registered project names"""
        return list(self._projects.keys())

    def __len__(self):
        """Allows len(DbtProjectContainer)"""
        return len(self._projects)

    def __getitem__(self, project: str):
        """Allows DbtProjectContainer['jaffle_shop']"""
        maybe_project = self.get_project(project)
        if maybe_project is None:
            raise KeyError(project)
        return maybe_project

    def __delitem__(self, project: str):
        """Allows del DbtProjectContainer['jaffle_shop']"""
        self.drop_project(project)

    def __iter__(self):
        """Allows project for project in DbtProjectContainer"""
        for project in self._projects:
            yield self.get_project(project)

    def __contains__(self, project):
        """Allows 'jaffle_shop' in DbtProjectContainer"""
        return project in self._projects

    def __repr__(self):
        """Canonical string representation of DbtProjectContainer instance"""
        return "\n".join(
            f"Project: {project.project_name}, Dir: {project.project_root}" for project in self
        )

    def __call__(self) -> "DbtProjectContainer":
        """This allows the object to be used as a callable, primarily for FastAPI dependency injection
        ```python
        dbt_project_container = DbtProjectContainer()
        def register(x_dbt_project: str = Header(default=None)):
            dbt_project_container.add_project(...)
        def compile(x_dbt_project: str = Header(default=None), dbt = Depends(dbt_project_container), request: fastapi.Request):
            query = request.body()
            dbt.get_project(x_dbt_project).compile(query)
        ```
        """
        return self
