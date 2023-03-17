import asyncio
import functools
import os

import yaml
from deepmerge import always_merger
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from starlette.middleware.cors import CORSMiddleware
from starlette.routing import Mount

from jinjat.core.dbt.dbt_project import DbtProjectContainer, DbtProject
from jinjat.core.log_controller import logger
from jinjat.core.models import JinjatProjectConfig
from jinjat.core.routes.analysis import create_analysis_apps
from jinjat.core.routes.project import router as project_router
from jinjat.core.util.api import register_jsonapi_exception_handlers, rapidoc_html, CustomButton, DBT_PROJECT_HEADER
from jinjat.core.util.dbt import DbtTarget

SERVER_OPT = "SERVER_OPT"

app = FastAPI(redoc_url=None, docs_url=None)

origins = [
    "http://localhost:3000",
    "https://jinjat-refine.pages.dev"
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=[DBT_PROJECT_HEADER]
)

app.state.dbt_project_container = DbtProjectContainer()


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
    project = app.state.dbt_project_container.add_project(project_dir=dbt_target.project_dir,
                                                          profiles_dir=dbt_target.profiles_dir,
                                                          target=dbt_target.target, )

    config = get_jinjat_project_config(project.project_root)


    def custom_openapi():
        if app.openapi_schema:
            return app.openapi_schema

        openapi_schema = get_openapi(title=project.project_name, version=project.config.version, routes=app.routes)
        app.openapi_schema = openapi_schema
        always_merger.merge(app.openapi_schema.get('info'), config.openapi.get("info", {}))
        return app.openapi_schema


    analysis_path = "/{}".format(project.config.version)

    register_jsonapi_exception_handlers(app)
    app.add_route("/",
                  functools.partial(rapidoc_html, CustomButton("Analysis APIs", analysis_path)),
                  include_in_schema=False)

    app.openapi = custom_openapi

    app.include_router(project_router)

    logger().info("Registering analysis routes")

    analysis_app = create_analysis_apps(config, project)

    logger().info("{} analysis found with `jinjat` config\n".format(len(analysis_app.routes)))

    if len(analysis_app.routes) > 0:
        unmount_app(analysis_app)
        app.mount(analysis_path, analysis_app)


# We use ambient reinitialization based on TTL now
# loop = asyncio.get_running_loop()
# project.heartbeat = loop.create_task(_adapter_heartbeat(project))
async def _adapter_heartbeat(runner: DbtProject):
    """Equivalent of a keepalive for adapters such as Snowflake"""
    await asyncio.sleep(60 * 30)
    while runner.adapter_probe():
        await asyncio.sleep(60 * 30)
