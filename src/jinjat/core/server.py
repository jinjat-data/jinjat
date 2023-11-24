import asyncio
import functools
import os
import sys
import time
from typing import Optional

import yaml
from dbt.exceptions import DbtRuntimeError
from deepmerge import always_merger
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.routing import Mount
from starlette.staticfiles import StaticFiles
from watchdog.events import FileSystemEvent

from jinjat.core.dbt.dbt_project import DbtProjectContainer, DbtProject, DbtTarget
from jinjat.core.exceptions import InvalidJinjaConfig
from jinjat.core.log_controller import logger
from jinjat.core.models import JinjatProjectConfig
from jinjat.core.routes.admin import app as admin_app
from jinjat.core.routes.analysis import create_analysis_apps
from jinjat.core.routes.notebook import lookup_notebook_by_id
from jinjat.core.util import filesystem
from jinjat.core.util.api import register_jsonapi_exception_handlers, rapidoc_html, CustomButton, DBT_PROJECT_HEADER, \
    DBT_PROJECT_NAME, StaticFilesWithFallbackIndex, extract_host
from jinjat.core.util.filesystem import get_project_root

app = FastAPI(redoc_url=None, docs_url=None, openapi_url=None)

dbt_container = DbtProjectContainer()
app.state.dbt_project_container = dbt_container
admin_app.state.dbt_project_container = dbt_container


@app.middleware("http")
async def add_cookie_header_for_cors(request: Request, call_next):
    # HACK FOR CorsMiddleware TO BE TRIGGERED
    if request.headers.get('cookie') is None:
        request.headers.__dict__["_list"].append(
            (
                "cookie".encode(),
                f"".encode(),
            )
        )
    response = await call_next(request)
    return response


def get_jinjat_project_config(project_root: str) -> JinjatProjectConfig:
    jinjat_config_file_path = os.path.join(project_root, 'jinjat_project.yml')
    if os.path.exists(jinjat_config_file_path):
        with open(jinjat_config_file_path, 'r') as file_handler:
            jinjat_config_file = file_handler.read()
            try:
                return JinjatProjectConfig.parse_obj(yaml.load(jinjat_config_file, Loader=yaml.Loader))
            except yaml.parser.ParserError:
                raise Exception(f"String '{jinjat_config_file}' is not valid YAML")
    return JinjatProjectConfig()


def unmount_app(new_app: FastAPI):
    existing_apps = next(filter(lambda r: isinstance(r, Mount) and r.name == new_app.root_path, app.routes), None)
    if existing_apps is not None:
        app.routes.remove(existing_apps)


def custom_openapi(project, config):
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(title=project.project_name, version=project.config.version, routes=app.routes)
    app.openapi_schema = openapi_schema
    if config.openapi is not None:
        always_merger.merge(app.openapi_schema.get('info'), config.openapi.get("info", {}))
    return app.openapi_schema


def generate_app(config: JinjatProjectConfig, project: DbtProject) -> FastAPI:
    analysis_app = create_analysis_apps(config, project)

    num_analyses = sum([len(sub_app.routes) for sub_app in analysis_app.routes[1:]])

    if len(analysis_app.routes) == 0:
        logger().warning("Could not find any analysis found with `jinjat` config")
    else:
        logger().info(f"Serving {num_analyses} analyses that have `jinjat` config")

    return analysis_app


def homepage_without_ui(host, project: DbtProject, dbt_target: DbtTarget) -> dict:
    return {
        "analysis_api_docs": f"{host}{project.config.project_name}/docs" if len(app.routes) > 2 else None,
        "dependencies": [route.path for route in app.routes[3].routes[2:]],
        "admin_api_docs": f"{host}admin/docs",
        "magic": "https://jinj.at",
        "options": dbt_target.dict()
    }


def mount_app(app: FastAPI, project: DbtProject, dbt_target: DbtTarget):
    config = get_jinjat_project_config(project.project_root)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=config.cors.allowed_origins,
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=[DBT_PROJECT_HEADER, DBT_PROJECT_NAME]
    )
    register_jsonapi_exception_handlers(app)
    app.openapi = lambda: custom_openapi(project, config)

    current_app = generate_app(config, project)

    def watch(event: FileSystemEvent):
        logger().info(f"Reloading project, file changed: {event.src_path}")
        try:
            project.safe_parse_project(reinit=True)
            project.parse_project()
        except DbtRuntimeError as e:
            logger().error(e)
            return

        try:
            new_app = generate_app(config, project)
        except InvalidJinjaConfig as e:
            logger.error(e)
            return
        current_app.router.routes = new_app.router.routes

    filesystem.watch(project.project_root, watch)

    admin_app.router.add_route("/docs",
                               functools.partial(rapidoc_html,
                                                 CustomButton("Analysis APIs", f"/{project.project_name}/docs"),
                                                 project.project_name),
                               include_in_schema=False)
    admin_app.version = project.config.version
    app.mount("/admin", admin_app)
    app.add_api_route("/_notebook/{id}", endpoint=functools.partial(lookup_notebook_by_id, config, project, ))

    default_refine_project = os.path.join(get_project_root(), *["src", "jinjat", "jinjat-refine"])
    project_static_files = os.path.join(project.project_root, "static")

    static_files = main_directory = None
    if os.path.exists(project_static_files) and dbt_target.refine:
        static_files = StaticFiles(directory=project_static_files, html=True)
        static_files.all_directories = [project_static_files, default_refine_project]
    else:
        if os.path.exists(project_static_files):
            main_directory = project_static_files
        elif dbt_target.refine:
            main_directory = default_refine_project

        if main_directory is not None:
            static_files = StaticFilesWithFallbackIndex(
                fallback_home_page_response=lambda scope: homepage_without_ui(extract_host(scope), project, dbt_target),
                directory=main_directory, html=True, enable_nextjs_route=dbt_target.refine is True)
    if static_files is not None:
        app.mount("/", static_files, name="static")
    else:
        app.add_route("/",
                      lambda request: JSONResponse(homepage_without_ui(str(request.base_url), project, dbt_target)))

    app.mount(f"/", current_app)


def get_multi_tenant_app(target: DbtTarget):
    project = app.state.dbt_project_container.add_project(target)
    try:
        mount_app(app, project, target)
    except Exception as e:
        logger().error("Unable to start the server", exc_info=e)
        sys.exit(1)
    return app


# We use ambient reinitialization based on TTL now
# loop = asyncio.get_running_loop()
# project.heartbeat = loop.create_task(_adapter_heartbeat(project))
async def _adapter_heartbeat(runner: DbtProject):
    """Equivalent of a keepalive for adapters such as Snowflake"""
    await asyncio.sleep(60 * 30)
    while runner.adapter_probe():
        await asyncio.sleep(60 * 30)
