import os
from pathlib import Path

from starlette.requests import Request
from starlette.responses import JSONResponse

from jinjat.core.dbt.dbt_project import DbtProject
from jinjat.core.models import JinjatProjectConfig
from jinjat.core.util.api import JinjatErrorContainer, JinjatError, JinjatErrorCode


async def lookup_notebook_by_id(jinjat_project_config: JinjatProjectConfig, project: DbtProject,
                                request: Request):
    notebook_id = request.path_params.get('id')
    try:
        [package_name, analysis] = notebook_id.split('.', 2)
    except ValueError as e:
        raise JinjatErrorContainer(404, [
            JinjatError(code=JinjatErrorCode.ResourceNotFound, message="can't find the notebook")])

    current_project = project.config.dependencies[package_name]
    # TODO: process all analysis_paths
    directory = os.path.join(current_project.project_root, "pages")
    path = Path(directory).rglob(f'{analysis}.md')
    found_files = list(path)
    if len(found_files) == 0:
        raise JinjatErrorContainer(404, [
            JinjatError(code=JinjatErrorCode.ResourceNotFound, message="can't find the notebook")])
    if len(found_files) > 1:
        raise JinjatErrorContainer(400, [
            JinjatError(code=JinjatErrorCode.AmbiguousResource, message="found multiple notebooks given name.")])

    found_file = found_files[0]
    file_content = found_file.open('r').read()
    result = file_content
    # result = project.compile_sql(file_content,
    #                              await generate_dbt_context_from_request(request)).compiled_sql
    return JSONResponse({
        "file_path": found_file.name,
        "content": result
    })
