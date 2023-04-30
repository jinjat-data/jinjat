import asyncio
import functools
import json
from datetime import datetime
from typing import Optional, Union

from fastapi import FastAPI
from pydantic import BaseModel, Field
from starlette import status
from starlette.background import BackgroundTasks
from starlette.requests import Request
from starlette.responses import Response

from jinjat.core.dbt.dbt_project import DbtProjectContainer, DbtProject
from jinjat.core.exceptions import ExecuteSqlFailure
from jinjat.core.models import JinjatExecutionResult, DbtAdapterExecutionResult, generate_dbt_context_from_request, \
    DbtQueryRequestContext, JSON_COLUMNS_QUERY_PARAM
from jinjat.core.util.api import JinjatErrorContainer, JinjatError, JinjatErrorCode, DBT_PROJECT_HEADER, \
    DBT_PROJECT_NAME
from jinjat.core.util.jmespath import extract_jmespath

app = FastAPI(redoc_url=None, docs_url=None, title="Admin API", version="0.1")

class JinjatCompileResult(BaseModel):
    result: str


class JinjatRefreshProjectResult(BaseModel):
    result: str


def jinjat_project_not_found_error():
    return JinjatErrorContainer(
        status_code=status.HTTP_400_BAD_REQUEST,
        error=JinjatError(code=JinjatErrorCode.ProjectNotFound, error="Project could not be found"))


class DbtAdhocQueryRequest(BaseModel):
    sql: str = Field(examples=["select 1"])
    request: DbtQueryRequestContext
    limit: Optional[int]


@app.get(
    "/manifest.json"
)
async def execute_manifest_query(
        request: Request,
        response: Response,
        jmespath: Optional[str] = None,
        # x_dbt_project: Optional[str] = Header(default=None),
) -> any:
    """Execute dbt SQL against a registered project as determined by X-dbt-Project header"""
    dbt_container: DbtProjectContainer = request.app.state.dbt_project_container
    project = dbt_container.get_project(None)

    if project is None:
        raise jinjat_project_not_found_error()


    manifest_file = project.dbt.writable_manifest().to_dict()
    result = extract_jmespath(jmespath, manifest_file, project)
    response.headers[DBT_PROJECT_HEADER] = project.config.version
    response.headers[DBT_PROJECT_NAME] = project.config.project_name
    return result


@app.post(
    "/execute",
    response_model=JinjatExecutionResult
)
async def execute_sql(
        request: Request,
        body: DbtAdhocQueryRequest,
        # x_dbt_project: Optional[str] = Header(default=None),
) -> JinjatExecutionResult:
    """Execute dbt SQL against a registered project as determined by X-dbt-Project header"""
    dbt: DbtProjectContainer = request.app.state.dbt_project_container
    project = dbt.get_project(None)

    if project is None:
        raise jinjat_project_not_found_error()

    dbt_result = await _execute_jinjat_query(project, project.execute_sql, body.sql, body.request, body.limit)
    json_cols = json.loads(request.query_params.get(JSON_COLUMNS_QUERY_PARAM) or '[]')

    return JinjatExecutionResult.from_dbt(body.request, dbt_result, json_columns=json_cols)


async def _execute_jinjat_query(project: DbtProject, execute_function, query: str, ctx: DbtQueryRequestContext,
                                limit: Optional[int], fetch: bool = True) -> DbtAdapterExecutionResult:
    if limit is not None:
        query = project.execute_macro('limit_query', {"sql": query, "limit": limit})

    try:
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(
            None, project.fn_threaded_conn(execute_function, query, ctx, fetch)
        )
    except ExecuteSqlFailure as execution_err:
        raise JinjatErrorContainer(
            status_code=status.HTTP_400_BAD_REQUEST,
            error=JinjatError(
                code=JinjatErrorCode.ExecuteSqlFailure,
                error=execution_err.to_model()
            )
        )

    return result


@app.post(
    "/compile",
    response_model=JinjatCompileResult
)
async def compile_sql(
        request: Request,
        body: DbtAdhocQueryRequest,
        # x_dbt_project: str = Header(),
) -> JinjatCompileResult:
    """Compile dbt SQL against a registered project as determined by X-dbt-Project header"""
    dbt: DbtProjectContainer = request.app.state.dbt_project_container

    project = dbt.get_project(None)
    if project is None:
        raise jinjat_project_not_found_error()

    # Query Compilation

    try:
        loop = asyncio.get_running_loop()

        if body.limit is not None:
            query = project.execute_macro('limit_query', {"sql": body.sql, "limit": body.limit})
        else:
            query = body.sql

        context = generate_dbt_context_from_request(request) if body.request is None else body.request
        compiled_query = (
            await loop.run_in_executor(
                None,
                project.fn_threaded_conn(project.compile_sql, query, context)
            )
        ).compiled_sql
    except Exception as compile_err:
        raise JinjatErrorContainer(
            status_code=status.HTTP_400_BAD_REQUEST,
            error=JinjatError(
                code=JinjatErrorCode.CompileSqlFailure,
                error=str(compile_err),
            )
        )

    return JinjatCompileResult(result=compiled_query)


@app.get(
    "/refresh",
)
async def refresh(
        background_tasks: BackgroundTasks,
        request: Request,
        response: Response,
        reset: bool = False,
        target: Optional[str] = None,
        # x_dbt_project: str = Header(),
) -> JinjatRefreshProjectResult:
    """Reparse a registered project on disk as determined by X-dbt-Project header writing
    manifest.json to target directory"""
    dbt: DbtProjectContainer = request.app.state.dbt_project_container
    project = dbt.get_project(None)
    if project is None:
        raise jinjat_project_not_found_error()

    # Get targets
    old_target = getattr(project.args, "target", project.config.target_name)
    new_target = target or old_target

    if not reset and old_target == new_target:
        # Async (target same)
        if project.mutex.acquire(blocking=False):
            background_tasks.add_task(_reset, project, reset, old_target, new_target)
            return JinjatRefreshProjectResult(result="Initializing project parsing")
        else:
            return JinjatRefreshProjectResult(result="Currently re-parsing project")
    else:
        # Sync (target changed or reset is true)
        if project.mutex.acquire(blocking=old_target != new_target):
            rv = _reset(project, reset, old_target, new_target)
            if isinstance(rv, JinjatErrorContainer):
                response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            return rv
        else:
            return JinjatRefreshProjectResult(result="Currently re-parsing project")


def _reset(
        project: DbtProject, reset: bool, old_target: str, new_target: str
) -> Union[JinjatRefreshProjectResult, JinjatErrorContainer]:
    """Use a mutex to ensure only a single reset can be running for any
    given project at any given time synchronously or asynchronously"""
    target_did_change = old_target != new_target
    try:
        project.args.target = new_target
        project.safe_parse_project(reinit=reset or target_did_change)
    except Exception as reparse_err:
        project.args.target = old_target
        rv = JinjatErrorContainer(
            status_code=status.HTTP_400_BAD_REQUEST,
            error=JinjatError(
                code=JinjatErrorCode.ProjectParseFailure,
                error=str(reparse_err),
            )
        )
    else:
        project._version += 1
        rv = JinjatRefreshProjectResult(
            result=(
                f"Profile target changed from {old_target} to {new_target}!"
                if target_did_change
                else f"Reparsed project with profile {old_target}!"
            )
        )
    finally:
        project.mutex.release()
    return rv


@app.get("/health")
async def health_check(
        request: Request,
        # x_dbt_project: str = Header(),
) -> dict:
    """Checks if the server is running and accepting requests"""
    dbt: DbtProjectContainer = request.app.state.dbt_project_container
    project = dbt.get_project(None)

    return {
        "result": {
            "status": "ready",
            **(
                {
                    "project_name": project.config.project_name,
                    "target_name": project.config.target_name,
                    "profile_name": project.config.profile_name,
                    "logs": project.config.log_path,
                    "runner_parse_iteration": project._version,
                    "adapter_ready": project.adapter_probe(),
                }
                if project is not None
                else {}
            ),
            "timestamp": datetime.utcnow(),
            "error": None,
        },
        "jinjat": __name__,
    }
