import asyncio
import functools
import multiprocessing
import subprocess
from pathlib import Path
from typing import Callable, Optional

import click
import uvicorn
import yaml
from dbt.cli.option_types import YAML

from jinjat.core.generator import compile_macro
from jinjat.core.log_controller import logger
from jinjat.core.server import DbtTarget, get_multi_tenant_app

CONTEXT = {"max_content_width": 800}


@click.group()
@click.version_option()
def cli():
    # asyncio.run(record(sys.argv[1], {"args": ' '.join(sys.argv[2:])}))
    pass


def shared_server_opts(func: Callable) -> Callable:
    @click.option(
        "--host",
        type=click.STRING,
        help="The host to serve the server on",
        envvar="JINJAT_HOST",
        default="localhost",
    )
    @click.option(
        "--port",
        type=click.INT,
        envvar="JINJAT_PORT",
        help="The port to serve the server on",
        default=8581,
    )
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    return wrapper


def serve_project_opts(func: Callable) -> Callable:
    @click.option(
        "--refine",
        is_flag=True,
        help="Enable Refine UI",
        default=False
    )
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    return wrapper


def shared_single_project_opts(func: Callable) -> Callable:
    @click.option(
        "--project-dir",
        type=click.Path(exists=True, dir_okay=True, file_okay=False),
        envvar="DBT_PROJECT_DIR",
        default=str(Path.cwd()),
        help="Which directory to look in for the dbt_project.yml file. Default is the current working directory and its parents.",
    )
    @click.option(
        "--profiles-dir",
        envvar="DBT_PROFILES_DIR",
        type=click.Path(exists=True, dir_okay=True, file_okay=False),
        help="Which directory to look in for the profiles.yml file. If not set, dbt will look in the current working directory first, then HOME/.dbt/",
    )
    @click.option(
        "-t",
        "--target",
        type=click.STRING,
        help="Which profile to load. Overrides setting in dbt_project.yml.",
    )
    @click.option(
        "--vars",
        envvar=None,
        default='{}',
        help="Supply variables to the project. This argument overrides variables defined in your dbt_project.yml file. This argument should be a YAML string, eg. '{my_variable: my_value}'",
    )
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    return wrapper


@cli.command(context_settings=CONTEXT)
@shared_single_project_opts
@click.argument(
    "macro",
    type=click.STRING,
)
@click.option(
    "--args",
    type=YAML(),
    default="{}",
    help="""Supply arguments to the macro. This dictionary will be mapped to the
            keyword arguments defined in the selected macro. This argument should
            be a YAML string, eg. '{my_variable: my_value}'
            """,
)
@click.option(
    "--dry-run",
    is_flag=True
)
def generate(
        macro: str,
        args: dict,
        dry_run: bool,
        project_dir: str,
        profiles_dir: Optional[str],
        target: Optional[str],
        vars: str
):
    dbt_target = DbtTarget(project_dir=project_dir, profiles_dir=profiles_dir, target=target,
                           vars=yaml.load(vars, Loader=yaml.Loader))
    compile_macro(dbt_target, macro, args, dry_run)


@serve_project_opts
@cli.command(context_settings=CONTEXT)
@shared_single_project_opts
@shared_server_opts
def serve(
        project_dir: str,
        profiles_dir: Optional[str],
        target: Optional[str],
        host: str,
        port: int,
        vars: str,
        refine: Optional[bool] = False,
) -> object:
    logger().info(f":water_wave: Executing jinjat for dbt project in {project_dir}")

    dbt_target = DbtTarget(project_dir=project_dir, profiles_dir=profiles_dir, target=target,
                           vars=yaml.load(vars, Loader=yaml.Loader), refine=refine)
    run_server(host, port, dbt_target)


def run_server(host="localhost", port=8581, target=DbtTarget):
    uvicorn.run(
        lambda: get_multi_tenant_app(target),
        host=host,
        port=port,
        log_level="info",
        reload=False,
        workers=1,
        factory=True
    )


if __name__ == "__main__":
    cli()
