import asyncio
import functools
import os

import yaml
from deepmerge import always_merger
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.routing import Mount
from starlette.staticfiles import StaticFiles

from jinjat.core.dbt.dbt_project import DbtProjectContainer, DbtProject, DbtTarget
from jinjat.core.log_controller import logger
from jinjat.core.models import JinjatProjectConfig
from jinjat.core.routes.admin import app as admin_app
from jinjat.core.routes.analysis import create_analysis_apps
from jinjat.core.util.api import register_jsonapi_exception_handlers, rapidoc_html, CustomButton, DBT_PROJECT_HEADER, \
    DBT_PROJECT_NAME
from jinjat.core.util.filesystem import get_project_root

SERVER_OPT = "SERVER_OPT"

app = FastAPI(redoc_url=None, docs_url=None)

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


"""Register default project, ugly (using envs?) but works. This will parse the project on disk and load it into memory"""
if SERVER_OPT in os.environ:
    dbt_target = DbtTarget.parse_raw(os.environ[SERVER_OPT])
    logger().info("Registering project: {}".format(dbt_target.json()))
    project = app.state.dbt_project_container.add_project(dbt_target)

    config = get_jinjat_project_config(project.project_root)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            config.cors.allowed_origins
        ],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=[DBT_PROJECT_HEADER, DBT_PROJECT_NAME]
    )


    def custom_openapi():
        if app.openapi_schema:
            return app.openapi_schema

        openapi_schema = get_openapi(title=project.project_name, version=project.config.version, routes=app.routes)
        app.openapi_schema = openapi_schema
        if config.openapi is not None:
            always_merger.merge(app.openapi_schema.get('info'), config.openapi.get("info", {}))
        return app.openapi_schema


    register_jsonapi_exception_handlers(app)

    app.openapi = custom_openapi

    analysis_app = create_analysis_apps(config, project)

    logger().info("{} analysis found with `jinjat` config\n".format(len(analysis_app.routes)))

    admin_app.router.add_route("/docs",
                               functools.partial(rapidoc_html,
                                                 CustomButton("Analysis APIs", f"/{project.config.version}/docs")),
                               include_in_schema=False)
    admin_app.version = project.config.version
    app.mount("/admin", admin_app)

    if len(analysis_app.routes) > 0:
        unmount_app(analysis_app)
        app.mount(f"/{project.config.version}", analysis_app)
        app.mount(f"/current", analysis_app)

    default_refine_project = os.path.join(get_project_root(), *["src", "jinjat", "jinjat-refine"])
    project_static_files = os.path.join(project.project_root, "static")

    static_files = main_directory = None
    if os.path.exists(project_static_files) and dbt_target.refine:
        static_files = StaticFiles(directory=project_static_files, html=True)
        static_files.all_directories = [project_static_files, default_refine_project]
        main_directory = default_refine_project
    else:
        if os.path.exists(project_static_files):
            main_directory = project_static_files
        elif dbt_target.refine:
            main_directory = default_refine_project

        if main_directory is not None:
            static_files = StaticFiles(directory=main_directory, html=True)

    if static_files is not None:
        app.mount("/", static_files, name="static")

    if main_directory is None or not os.path.exists(os.path.join(main_directory, "index.html")):
        app.router.add_route("/", lambda request: JSONResponse({
            "analysis_api_docs": f"{request.base_url}{project.config.version}/docs" if len(
                analysis_app.routes) > 0 else None,
            "admin_api_docs": f"{request.base_url}admin/docs",
            "magic": "https://jin.jat",
            "options": dbt_target.dict()
        }))


# We use ambient reinitialization based on TTL now
# loop = asyncio.get_running_loop()
# project.heartbeat = loop.create_task(_adapter_heartbeat(project))
async def _adapter_heartbeat(runner: DbtProject):
    """Equivalent of a keepalive for adapters such as Snowflake"""
    await asyncio.sleep(60 * 30)
    while runner.adapter_probe():
        await asyncio.sleep(60 * 30)
