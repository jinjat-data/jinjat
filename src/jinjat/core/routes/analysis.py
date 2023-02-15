import functools
import os
import re
from pathlib import Path
from typing import List, Optional, Callable

import yaml
from dbt.contracts.graph.parsed import ParsedAnalysisNode
from deepmerge import always_merger
from fastapi import FastAPI
from fastapi.openapi.models import Schema, Response as APIResponse
from fastapi.openapi.utils import get_openapi
from openapi_schema_pydantic import Parameter, Info
from pydantic import ValidationError, BaseModel
import jmespath
from starlette.requests import Request

from jinjat.core.dbt.dbt_project import DbtProject
from jinjat.core.exceptions import InvalidJinjaConfig
from jinjat.core.models import generate_dbt_context_from_request, JinjatExecutionResult, JinjatConfig, Transform, \
    JinjatProjectConfig
from jinjat.core.routes.project import _execute_jinjat_query
from jinjat.core.util import get_human_readable_error, rapidoc_html, register_jsonapi_exception_handlers, CustomButton

ANALYSIS_FILE_PATH_REGEX = re.compile(r"^analysis\/(.*)\.sql$")


async def handle_analysis_api(project: DbtProject,
                              sql: str,
                              openapi: dict,
                              transform_request: Callable[[dict], dict],
                              transform_response: Callable[[dict], dict],
                              fetch: bool,
                              jinjat_project: JinjatProjectConfig,
                              request: Request):
    context = await generate_dbt_context_from_request(request, openapi, transform_request)
    query_result = await _execute_jinjat_query(project, project.execute_sql, sql, context,
                                               request.query_params.get('_limit'), fetch)
    jinjat_result = JinjatExecutionResult.from_dbt(context, query_result, transform_response)

    if context.is_debug_enabled():
        return jinjat_result
    else:
        return jinjat_result.data


def create_components_from_nodes(project: DbtProject):
    schema_nodes = filter(
        lambda node: node.resource_type in ['model', 'seed', 'source'] and 'jinjat' in node.meta,
        project.dbt.nodes.values())

    components = {}
    for node in schema_nodes:
        jinjat = node.config.extra.get('jinjat')
        if 'openapi' in jinjat:
            schema = Schema.parse_obj(jinjat.get('openapi'))
        else:
            schema = Schema(type='object')
            schema.properties = {}
            for column in node.columns.values():
                openapi = column.meta.get('jinjat', {}).get('schema')
                if openapi is None:
                    col_schema = Schema()
                else:
                    col_schema = Schema.parse_obj(openapi)
                schema.properties[column.name] = col_schema
        components[node.unique_id] = schema.dict(exclude_unset=True)
    return components





def parse_param(path: str) -> (str, List[str]):
    paths = list(Path(ANALYSIS_FILE_PATH_REGEX.findall(path)[0]).parts)
    if paths[-1].startswith('_'):
        paths.pop()
    param_list = []
    for idx, path in enumerate(paths):
        if path.startswith('_'):
            path_name = path[1:]
            paths[idx] = f'{{{path_name}}}'
            param_list.append(path_name)
    return '/'.join(paths), param_list


def compile_transform(transform: Optional[List[Transform]]):
    if transform is None or len(transform) == 0:
        return lambda body: body

    compiled_transforms = [jmespath.compile(item.jmespath) for item in transform]

    def transform_data(body: dict):
        for transform in compiled_transforms:
            body = transform.search(body)
        return body

    return transform_data


def create_analysis_apps(jinjat_project_config: JinjatProjectConfig, project: DbtProject) -> FastAPI:
    analysis_nodes = filter(lambda node: isinstance(node, ParsedAnalysisNode) and node.language == 'sql',
                            project.dbt.nodes.values())
    api = FastAPI(redoc_url=None, docs_url=None)
    register_jsonapi_exception_handlers(api)
    api.add_route("/", functools.partial(rapidoc_html, CustomButton("Admin APIs", "/")), include_in_schema=False)

    def custom_openapi():
        if api.openapi_schema:
            return api.openapi_schema

        openapi_schema = get_openapi(title=project.project_name, version=project.config.version, routes=api.routes, )
        api.openapi_schema = openapi_schema

        component_schemas = create_components_from_nodes(project)
        components = api.openapi_schema.setdefault('components', {})
        existing_schemas = components.setdefault('schemas', {})
        components['schemas'] = {**existing_schemas, **component_schemas}

        if jinjat_project_config.openapi is not None:
            always_merger.merge(api.openapi_schema, jinjat_project_config.openapi)

        return api.openapi_schema

    api.openapi = custom_openapi

    for node in analysis_nodes:
        try:
            jinjat_config = JinjatConfig.parse_obj(node.config.extra['jinjat'])
        except ValidationError as e:
            raise InvalidJinjaConfig(node.patch_path, node.original_file_path, get_human_readable_error(e))
        sql = node.raw_code

        methods = [jinjat_config.method] if jinjat_config.method is not None else None
        openapi = jinjat_config.openapi
        fetch_enabled = jinjat_config.fetch

        if not jinjat_config.fetch:
            if openapi.responses is not None:
                raise Exception(
                    "{}: If `fetch` is false, the jinjat.openapi.responses must not set".format(node.unique_id))
            openapi.responses = {204: APIResponse(description="Success")}

        api_path, param_list = parse_param(node.path)

        for param in param_list:
            if openapi.parameters is None:
                openapi.parameters = []
            openapi.parameters.append(Parameter(param_in='path', name=param, required=True,
                                                schema=Schema(type='string').dict(by_alias=True,
                                                                                  exclude_none=True)))

        api_path = f'/{node.package_name}/{api_path}'
        openapi_dict = openapi.dict(by_alias=True, exclude_none=True, exclude_unset=True)
        api.add_api_route(api_path,
                          endpoint=functools.partial(handle_analysis_api, project, sql, openapi_dict,
                                                     compile_transform(jinjat_config.transform_request),
                                                     compile_transform(jinjat_config.transform_response),
                                                     fetch_enabled,
                                                     jinjat_project_config),
                          tags=node.tags,
                          description=node.description,
                          summary=node.name,
                          methods=methods,
                          operation_id=node.unique_id,
                          name=node.alias,
                          openapi_extra=openapi_dict)
    return api
