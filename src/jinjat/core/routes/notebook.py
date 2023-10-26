import os
from pathlib import Path

from fastapi import FastAPI

from starlette.requests import Request
from starlette.responses import JSONResponse, Response, FileResponse, PlainTextResponse

from jinjat.core.dbt.dbt_project import DbtProject
from jinjat.core.models import JinjatProjectConfig, generate_dbt_context_from_request


async def lookup_notebook_by_id(jinjat_project_config: JinjatProjectConfig, project: DbtProject,
                                request: Request):
    notebook_id = request.path_params.get('id')
    [package_name, analysis] = notebook_id.split('.', 2)

    current_project = project.config.dependencies[package_name]
    # TODO: process all analysis_paths
    directory = os.path.join(current_project.project_root, current_project.analysis_paths[0])
    path = Path(directory).rglob(f'{analysis}.mdx')
    found_file = next(path)
    file_content = found_file.open('r').read()
    result = file_content
    # result = project.compile_sql(file_content,
    #                              await generate_dbt_context_from_request(request)).compiled_sql
    return JSONResponse({
        "file_path": found_file.name,
        "content": result
    })
