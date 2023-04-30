from typing import (
    Optional, TypeVar,
)
from dbt.flags import DEFAULT_PROFILES_DIR
from dbt.tracking import disable_tracking
from dbt.version import __version__ as dbt_version
from ruamel.yaml import YAML

CACHE = {}
CACHE_VERSION = 1
JINJAT_REQUEST_VAR_NAME = "jinjat_request"

DBT_MAJOR_VER, DBT_MINOR_VER, DBT_PATCH_VER = (int(v) for v in dbt_version.split("."))
RAW_CODE = "raw_code" if DBT_MAJOR_VER >= 1 and DBT_MINOR_VER >= 3 else "raw_sql"
COMPILED_CODE = "compiled_code" if DBT_MAJOR_VER >= 1 and DBT_MINOR_VER >= 3 else "compiled_sql"

JINJA_CONTROL_SEQS = ["{{", "}}", "{%", "%}", "{#", "#}"]
T = TypeVar("T")


def has_jinja(query: str) -> bool:
    """Utility to check for jinja prior to certain compilation procedures"""
    return any(seq in query for seq in JINJA_CONTROL_SEQS)


disable_tracking()
fire_event = lambda e: None


class ConfigInterface:
    """This mimic dbt-core args based interface for dbt-core
    class instantiation"""

    def __init__(
            self,
            threads: Optional[int] = 1,
            target: Optional[str] = None,
            profiles_dir: Optional[str] = None,
            project_dir: Optional[str] = None,
            vars: Optional[str] = "{}",
            profile: Optional[str] = None,
    ):
        self.threads = threads
        self.target = target
        self.profiles_dir = profiles_dir or DEFAULT_PROFILES_DIR
        self.project_dir = project_dir
        self.vars = vars  # json.dumps str
        self.dependencies = []
        self.single_threaded = threads == 1
        self.quiet = True
        self.profile = profile

    @classmethod
    def from_str(cls, arguments: str) -> "ConfigInterface":
        import argparse
        import shlex

        parser = argparse.ArgumentParser()
        args = parser.parse_args(shlex.split(arguments))
        return cls(
            threads=args.threads,
            target=args.target,
            profiles_dir=args.profiles_dir,
            project_dir=args.project_dir,
        )


class YamlHandler(YAML):
    """A `ruamel.yaml` wrapper to handle dbt YAML files with sane defaults"""

    def __init__(self, **kwargs) -> None:
        super().__init__(**kwargs)
        self.indent(mapping=2, sequence=4, offset=2)
        self.width = 800
        self.preserve_quotes = True
        self.default_flow_style = False
