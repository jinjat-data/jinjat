import json
import typing
from collections import OrderedDict
from copy import deepcopy
from typing import (
    Any,
    List,
    Optional,
    Mapping,
)

import agate
import jsonref
from dbt.contracts.connection import AdapterResponse
from dbt.contracts.graph.manifest import ManifestNode
from fastapi.openapi.models import Parameter, Schema
from jsonschema import validate
from openapi_schema_pydantic import OpenAPI
from openapi_schema_pydantic import Operation
from pydantic import BaseModel, validator
from starlette.requests import Request

LIMIT_QUERY_PARAM = '_limit'


class CORS(BaseModel):
    allowed_origins: Optional[List[str]]


class JinjatProjectConfig(BaseModel):
    cors: Optional[CORS] = CORS(allowed_origins=["*"])
    max_limit: Optional[int] = 50000
    default_limit: Optional[int] = 500
    refine: Optional[dict]
    openapi: Optional[dict]

    @validator('openapi')
    def validate_openapi(cls, openapi):
        if "info" not in openapi:
            openapi['info'] = {}
        info = openapi.get("info")
        if "title" in info is not None or "version" in info is not None:
            raise ValueError(
                "`openapi.info.title` and `openapi.info.version` must not be set as the values are derived from dbt_project.yml")

        info['title'] = info.get('title', '')
        info['version'] = info.get('version', '')
        OpenAPI.parse_obj(openapi)
        return openapi


class DbtQueryRequestContext(BaseModel):
    method: str
    body: Optional[dict]
    headers: Mapping[str, str] = {}
    params: Mapping[str, Any] = {}
    query: Mapping[str, str] = {}

    def is_debug_enabled(self) -> bool:
        return self.query.get('_debug') is not None


class RequestSchema(BaseModel):
    parameters: Optional[List[Parameter]]
    body: Optional[Schema]
    transform: Optional[str]


class ResponseSchema(BaseModel):
    content: Optional[Schema]
    status: Optional[int] = 200
    description: Optional[str] = "Success"
    transform: Optional[str]


class JinjatAnalysisConfig(BaseModel):
    cors: Optional[bool]
    openapi: Optional[Operation] = Operation()
    method: Optional[typing.Union[str, list[str]]]
    fetch: Optional[bool] = True

    request: Optional[RequestSchema] = RequestSchema()
    response: Optional[ResponseSchema] = ResponseSchema()


async def generate_dbt_context_from_request(request: Request, openapi: dict = None,
                                            transform_request: typing.Callable[[dict], dict] = None):
    if request.method in ['PATCH', 'PUT', 'POST']:
        body = transform_request(await request.json())
        validate(instance=body, schema=openapi)
    else:
        body = None
    return DbtQueryRequestContext(method=request.method, body=body,
                                  headers=dict(request.headers.items()),
                                  params=request.path_params, query=request.query_params)


class DbtAdapterExecutionResult:
    """Interface for execution results, this keeps us 1 layer removed from dbt interfaces which may change"""

    def __init__(
            self, adapter_response: AdapterResponse, table: agate.Table, raw_sql: str, compiled_sql: str,
            total_rows: Optional[int] = None,
    ) -> None:
        self.adapter_response = adapter_response
        self.table = table
        self.raw_sql = raw_sql
        self.compiled_sql = compiled_sql
        self.total_rows = total_rows


def _convert_table_to_dict(table: agate.Table, json_columns: List[str]):
    output = []
    json_funcs = [(lambda x: json.loads(col.jsonify(x))) if table.column_names[i] in json_columns else col.jsonify
                  for i, col in enumerate(table.column_types)]
    for row in table.rows:
        values = tuple(json_funcs[i](d) for i, d in enumerate(row))
        output.append(OrderedDict(zip(row.keys(), values)))
    return output


class JinjatAdapterResponse(BaseModel):
    message: str
    code: Optional[str] = None
    rows_affected: Optional[int] = None


class JinjatColumn(BaseModel):
    name: str
    type: str


class JinjatExecutionResult(BaseModel):
    """Interface for execution results, this keeps us 1 layer removed from dbt interfaces which may change"""
    request: DbtQueryRequestContext
    adapter_response: Optional[JinjatAdapterResponse]
    columns: Optional[List[JinjatColumn]]
    data: Optional[Any]
    raw_sql: str
    compiled_sql: Optional[str]
    error: Optional[str]

    @staticmethod
    def from_dbt(ctx: DbtQueryRequestContext, result: DbtAdapterExecutionResult,
                 transform_response: typing.Callable[[dict], dict] = None,
                 response_schema: dict = None) -> 'JinjatExecutionResult':
        columns = [JinjatColumn(name=column.name, type=column.data_type.__class__.__name__) for column in
                   result.table.columns]
        adapter_response = JinjatAdapterResponse(message=result.adapter_response._message,
                                                 code=result.adapter_response.code,
                                                 rows_affected=result.adapter_response.rows_affected)
        if response_schema is not None and response_schema.get('type') == 'object':
            json_columns = [key for (key, value) in response_schema.get('properties', {}).items()
                            if value.get('type') in ['array', 'object']]
        else:
            json_columns = []

        result_dict = _convert_table_to_dict(result.table, json_columns)
        if transform_response is not None:
            result_dict = transform_response(result_dict)
        return JinjatExecutionResult(request=ctx, adapter_response=adapter_response, columns=columns,
                                     data=result_dict, raw_sql=result.raw_sql,
                                     compiled_sql=result.compiled_sql)


class DbtAdapterCompilationResult:
    """Interface for compilation results, this keeps us 1 layer removed from dbt interfaces which may change"""

    def __init__(
            self,
            raw_sql: str,
            compiled_sql: str,
            node: ManifestNode,
            injected_sql: Optional[str] = None,
    ) -> None:
        self.raw_sql = raw_sql
        self.compiled_sql = compiled_sql
        self.node = node
        self.injected_sql = injected_sql
