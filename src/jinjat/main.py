import functools
import multiprocessing
import os
import subprocess
import sys
from pathlib import Path
from typing import Callable, Optional

import click
import uvicorn

from jinjat.core.dbt.config import DEFAULT_PROFILES_DIR
from jinjat.core.log_controller import logger
from jinjat.core.server import DbtTarget, SERVER_OPT, app

CONTEXT = {"max_content_width": 800}


@click.group()
@click.version_option()
def cli():
    pass

def shared_server_opts(func: Callable) -> Callable:
    @click.option(
        "--host",
        type=click.STRING,
        help="The host to serve the server on",
        default="localhost",
    )
    @click.option(
        "--port",
        type=click.INT,
        help="The port to serve the server on",
        default=8581,
    )
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    return wrapper


def shared_single_project_opts(func: Callable) -> Callable:
    @click.option(
        "--project-dir",
        type=click.Path(exists=True, dir_okay=True, file_okay=False),
        default=str(Path.cwd()),
        help="Which directory to look in for the dbt_project.yml file. Default is the current working directory and its parents.",
    )
    @click.option(
        "--profiles-dir",
        type=click.Path(exists=True, dir_okay=True, file_okay=False),
        default=DEFAULT_PROFILES_DIR,
        help="Which directory to look in for the profiles.yml file. Defaults to ~/.dbt",
    )
    @click.option(
        "-t",
        "--target",
        type=click.STRING,
        help="Which profile to load. Overrides setting in dbt_project.yml.",
    )
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    return wrapper


def run_server(host="localhost", port=8581):
    app.state.test = 1
    uvicorn.run(
        "jinjat.core.server:app",
        host=host,
        port=port,
        log_level="info",
        reload=False,
        workers=1,
    )


@cli.command(context_settings=CONTEXT)
@shared_single_project_opts
@shared_server_opts
def generate_crud(
        project_dir: str,
        profiles_dir: str,
        target: Optional[str],
        host: str,
        port: int,
):
    logger().info(":water_wave: Executing jinjat in single-tenant mode")


@cli.command(context_settings=CONTEXT)
@shared_single_project_opts
@shared_server_opts
def serve(
        project_dir: str,
        profiles_dir: str,
        target: Optional[str],
        host: str,
        port: int,
):
    logger().info(":water_wave: Executing jinjat in single-tenant mode")

    dbt_target = DbtTarget(project_dir=project_dir, profiles_dir=profiles_dir, target=target)
    os.environ[SERVER_OPT] = dbt_target.json()

    server = multiprocessing.Process(target=run_server, args=(host, port))
    server.start()

    import atexit

    atexit.register(lambda: server.terminate())

    server.join()
    sys.exit(server.exitcode)


@cli.command(
    context_settings=dict(
        ignore_unknown_options=True,
        allow_extra_args=True,
    )
)
@shared_single_project_opts
@shared_server_opts
@click.pass_context
def streamlit(
        ctx,
        project_dir: str,
        profiles_dir: str,
        target: str,
        host: str,
        port: int,
):
    """Start the jinjat playground
    \f
    Pass the --options command to see streamlit specific options that can be passed to the app,
    pass --config to see the output of streamlit config show
    """

    logger().info(":water_wave: Executing Jinjat Playground\n")

    if "--options" in ctx.args:
        subprocess.run(["streamlit", "run", "--help"])
        ctx.exit()

    import os

    if "--config" in ctx.args:
        subprocess.run(
            ["streamlit", "config", "show"],
            env=os.environ,
            cwd=Path.cwd(),
        )
        ctx.exit()

    script_args = ["--"]
    if project_dir:
        script_args.append("--project-dir")
        script_args.append(project_dir)
    if profiles_dir:
        script_args.append("--profiles-dir")
        script_args.append(profiles_dir)
    if target:
        script_args.append("--target")
        script_args.append(target)

    streamlit_command = ["streamlit", "run", "--runner.magicEnabled=false",
                     Path(__file__).parent / "playground.py", ] + ctx.args + script_args
    print(streamlit_command)
    subprocess.run(
        streamlit_command,
        env=os.environ,
        cwd=Path.cwd(),
    )


if __name__ == "__main__":
    cli()
