import functools
import itertools
import json
import re
from copy import deepcopy
from pathlib import Path
from typing import List, Optional, Callable, Mapping

import jmespath
import jsonref
from dbt.node_types import NodeType
from deepmerge import always_merger
from fastapi import FastAPI
from fastapi.openapi.models import Schema, Response as APIResponse, Operation, RequestBody, MediaType
from fastapi.openapi.utils import get_openapi
from openapi_schema_pydantic import Parameter
from pydantic import ValidationError
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from starlette.routing import Route

from jinjat.core.dbt.dbt_project import DbtProject
from jinjat.core.exceptions import InvalidJinjaConfig
from jinjat.core.models import generate_dbt_context_from_request, JinjatExecutionResult, JinjatAnalysisConfig, \
    JinjatProjectConfig, JSON_COLUMNS_QUERY_PARAM, RequestSchema, ResponseSchema
from jinjat.core.routes.admin import _execute_jinjat_query
from jinjat.core.util.api import get_human_readable_error, rapidoc_html, register_jsonapi_exception_handlers, \
    CustomButton, register_openapi_validators, unregister_openapi_validators
from jinjat.core.util.jmespath import extract_jmespath

ANALYSIS_FILE_PATH_REGEX = re.compile(r"^analysis\/(.*)\.sql$")


async def handle_analysis_api(project: DbtProject,
                              sql: str,
                              openapi: dict,
                              transform_request: Callable[[dict], dict],
                              transform_response: Callable[[dict], dict],
                              fetch: bool,
                              jinjat_project: JinjatProjectConfig,
                              request: Request,
                              response: Response):
    context = await generate_dbt_context_from_request(request, openapi, transform_request)
    limit = request.query_params.get('_limit')
    end = request.query_params.get('_end')
    start = request.query_params.get('_start')
    if limit is None and (start is not None and end is not None):
        limit = int(end) - int(start)
    query_result = await _execute_jinjat_query(project, project.execute_sql, sql, context,
                                               limit, fetch, include_total=end is not None)
    json_cols = json.loads(request.query_params.get(JSON_COLUMNS_QUERY_PARAM) or '[]')
    jinjat_result = JinjatExecutionResult.from_dbt(context, query_result, transform_response, json_cols)
    if query_result.total_rows is not None:
        response.headers['x-total-count'] = str(query_result.total_rows)

    if context.is_debug_enabled():
        return jinjat_result
    else:
        return jinjat_result.data


def create_components_from_nodes(project: DbtProject):
    schema_nodes = filter(
        lambda node: node.resource_type in ['model', 'seed', 'source', 'analysis'] and (
                'jinjat' in node.meta or 'jinjat' in node.config),
        project.dbt.nodes.values())

    components = {}
    for node in schema_nodes:
        jinjat = node.config.meta.get('jinjat')
        if jinjat is not None and 'schema' in jinjat:
            schema = Schema.parse_obj(jinjat.get('schema'))
        else:
            schema = Schema(type='object')
        schema.properties = {}
        for column in node.columns.values():
            openapi = column.meta.get('jinjat', {}).get('schema')
            if openapi is None:
                col_schema = Schema()
            else:
                col_schema = Schema.parse_obj(openapi)
            col_schema.description = col_schema.description or column.description
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


def compile_transform(jmespath_exp: Optional[str]):
    if jmespath_exp is None or len(jmespath_exp) == 0:
        return lambda body: body

    compiled_transforms = jmespath.compile(jmespath_exp)
    return compiled_transforms.search


def get_final_response(transform: Optional[str], request_body_model: Optional[Schema]) -> Optional[Schema]:
    if request_body_model is None:
        return None

    if transform == "[0]":
        return request_body_model
    else:
        return Schema.parse_obj({"type": "array", "items": request_body_model})


async def custom_openapi(project, jinjat_project_config, api, package_name, req: Request) -> JSONResponse:
    extract_path = req.query_params.get("jmespath")
    scheme = req.headers.get('x-forwarded-proto')
    url = str(req.base_url.replace(scheme=scheme or req.url.scheme))
    servers = [{"url": url}]

    if api.openapi_schema:
        api.openapi_schema['servers'] = servers
        return JSONResponse(extract_jmespath(extract_path, api.openapi_schema, project))

    openapi_schema = get_openapi(title=project.project_name,
                                 version=project.config.version,
                                 routes=api.routes,
                                 servers=servers)

    component_schemas = create_components_from_nodes(project)
    components = openapi_schema.setdefault('components', {})
    existing_schemas = components.setdefault('schemas', {})
    components['schemas'] = {**existing_schemas, **component_schemas}
    openapi_schema["x-jinjat"] = {"refine": jinjat_project_config.refine}

    if jinjat_project_config.openapi is not None:
        always_merger.merge(openapi_schema, jinjat_project_config.openapi)
    if extract_path:
        openapi_schema = jsonref.replace_refs(deepcopy(openapi_schema), base_uri="", proxies=False, lazy_load=False)

    api.openapi_schema = openapi_schema

    return JSONResponse(extract_jmespath(extract_path, openapi_schema, project))


def enrich_openapi_schema(project: DbtProject, openapi: Operation, request: RequestSchema, response: ResponseSchema):
    if request.body is not None:
        openapi.requestBody = RequestBody(content={"application/json": MediaType(schema=request.body)})
    if response is not None:
        response_body_schema = get_final_response(response.transform, response.content)
        openapi.responses = {response.status: APIResponse(description=response.description,
                                                          content={"application/json": MediaType(
                                                              schema=response_body_schema)})}

    openapi.parameters = (openapi.parameters or []) + (request.parameters or [])


def create_analysis_apps(jinjat_project_config: JinjatProjectConfig, project: DbtProject) -> FastAPI:
    analysis_nodes = filter(lambda
                                node: node.resource_type == NodeType.Analysis.value
                                      and node.language == 'sql'
                                      and 'jinjat' in node.config.extra,
                            project.dbt.nodes.values())
    nodes_by_packages = dict((k, list(map(lambda x: x, values))) for k, values in
                             itertools.groupby(sorted(analysis_nodes, key=lambda node: node.package_name),
                                               lambda node: node.package_name))

    api = FastAPI(redoc_url=None, docs_url=None, openapi_url=None)
    register_jsonapi_exception_handlers(api)
    register_openapi_validators(project)
    analysis_lookup = {}

    async def lookup_by_id(request: Request, response: Response):
        analysis_func = analysis_lookup["analysis."+request.path_params.get('id')]
        if analysis_func is None:
            return None
        else:
            return await analysis_func(request, response)

    api.add_api_route("/_id/{id}", endpoint=lookup_by_id)

    for package_name, analyses in nodes_by_packages.items():
        sub_app = FastAPI(redoc_url=None, docs_url=None, openapi_url=None)

        sub_app.add_route(f"/{package_name}/docs",
                          functools.partial(rapidoc_html, CustomButton("Admin APIs", "/admin/docs"), package_name),
                          include_in_schema=False)
        # sub_app.add_route("/elements", functools.partial(elements_html, CustomButton("Admin APIs", "/")),
        #               include_in_schema=False)
        sub_app.add_route(f"/{package_name}/openapi.json",
                          functools.partial(custom_openapi, project, jinjat_project_config, sub_app, package_name),
                          include_in_schema=True)

        for node in analyses:
            if 'jinjat' not in node.config.extra:
                jinjat_config = JinjatAnalysisConfig()
            else:
                try:
                    jinjat_config = JinjatAnalysisConfig.parse_obj(node.config.extra['jinjat'])
                except ValidationError as e:
                    raise InvalidJinjaConfig(node.patch_path, node.original_file_path, get_human_readable_error(e))

            methods = [jinjat_config.method] if jinjat_config.method is not None else None
            openapi = jinjat_config.openapi
            fetch_enabled = jinjat_config.fetch

            if not jinjat_config.fetch:
                if jinjat_config.response.content is not None or openapi.responses is not None:
                    raise Exception(
                        "{}: If `fetch` is false, the jinjat.openapi.responses and jinjat.response must not set".format(
                            node.unique_id))
                openapi.responses = {204: APIResponse(description="Success")}

            api_path, param_list = parse_param(node.path)

            for param in param_list:
                if openapi.parameters is None:
                    openapi.parameters = []
                openapi.parameters.append(Parameter(param_in='path', name=param, required=True,
                                                    schema=Schema(type='string').dict(by_alias=True,
                                                                                      exclude_none=True)))

            enrich_openapi_schema(project, openapi, jinjat_config.request, jinjat_config.response)

            # ctx = generate_parser_model_context(node, project.config, project.dbt,
            #                                     ContextConfig(project.config, node.fqn, node.resource_type,
            #                                                   project.project_name, ))
            # environment = get_environment(node=node, capture_macros=True)
            # inferred_schema = infer_from_ast(environment.from_string(sql, globals=ctx), ignore_constants=True)
            # inferred_schema_json = to_json_schema(inferred_schema)
            # if openapi.requestBody.content.get('application/json').schema()

            openapi_dict = openapi.dict(by_alias=True, exclude_none=True, exclude_unset=True)
            try:
                transform_request = compile_transform(jinjat_config.request.transform)
            except Exception as e:
                raise InvalidJinjaConfig(node.original_file_path, None,
                                         f"Unable to parse `transform_request` jmespath expression {jinjat_config.request.transform}: {e}")

            try:
                transform_response = compile_transform(jinjat_config.response.transform)
            except Exception as e:
                raise InvalidJinjaConfig(node.original_file_path, None,
                                         f"Unable to parse `transform_response` jmespath expression {jinjat_config.response.transform}: {e}")

            endpoint = functools.partial(handle_analysis_api, project, node.raw_code, openapi_dict, transform_request,
                                         transform_response, fetch_enabled, jinjat_project_config)
            analysis_lookup[node.unique_id] = endpoint
            sub_app.add_api_route(f'/{package_name}/{project.config.dependencies[package_name].version}/{api_path}',
                                  endpoint=endpoint,
                                  tags=node.tags,
                                  description=node.description if node.description else None,
                                  summary=node.name,
                                  methods=methods,
                                  operation_id=re.sub(r"\W", "_", node.name),
                                  name=node.alias,
                                  openapi_extra=openapi_dict)
        api.mount(f"/", sub_app)
    unregister_openapi_validators()

    return api
