import functools
import json
import typing
from collections import OrderedDict
from typing import (
    Any,
    List,
    Optional,
    Mapping,
)

import agate
from dbt.contracts.connection import AdapterResponse
from dbt.contracts.graph.manifest import ManifestNode
from jsonschema import validate
from openapi_schema_pydantic import Operation
from pydantic import BaseModel, validator
from starlette.requests import Request

from openapi_schema_pydantic import OpenAPI

LIMIT_QUERY_PARAM = '_limit'
JSON_COLUMNS_QUERY_PARAM = '_json_columns'


class JinjatProjectConfig(BaseModel):
    max_limit: Optional[int] = 50000
    default_limit: Optional[int] = 500
    refine: Optional[dict]
    openapi: Optional[dict]

    @validator('openapi')
    def validate_openapi(cls, openapi):
        info = openapi.get("info", {})
        if "title" in info is not None or "version" in info is not None:
            raise ValueError(
                "`openapi.info.title` and `openapi.info.version` must not be set as the values are derived from dbt_project.yml")

        openapi['info']['title'] = openapi['info']['version'] = ""
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


class Transform(BaseModel):
    jmespath: str


class JinjatAnalysisConfig(BaseModel):
    cors: Optional[bool]
    openapi: Optional[Operation] = Operation()
    method: Optional[str]
    body: Optional[dict]
    headers: Optional[dict]
    fetch: Optional[bool] = True
    request_model : Optional[str]

    transform_response: Optional[List[Transform]]
    transform_request: Optional[List[Transform]]


async def generate_dbt_context_from_request(request: Request, openapi: dict,
                                            transform_request: typing.Callable[[dict], dict]):
    if request.method in ['PATCH', 'PUT', 'POST']:
        body = transform_request(await request.json())
        validate(instance=body, schema=openapi)
    else:
        body = None
    return DbtQueryRequestContext(method=request.method, body=body,
                                  headers=request.headers,
                                  params=request.path_params, query=request.query_params)


class DbtAdapterExecutionResult:
    """Interface for execution results, this keeps us 1 layer removed from dbt interfaces which may change"""

    def __init__(
            self, adapter_response: AdapterResponse, table: agate.Table, raw_sql: str, compiled_sql: str
    ) -> None:
        self.adapter_response = adapter_response
        self.table = table
        self.raw_sql = raw_sql
        self.compiled_sql = compiled_sql

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
    adapter_response: JinjatAdapterResponse
    columns: List[JinjatColumn]
    data: Any
    raw_sql: str
    compiled_sql: str

    @staticmethod
    def from_dbt(ctx: DbtQueryRequestContext, result: DbtAdapterExecutionResult,
                 transform_response: typing.Callable[[dict], dict] = None,
                 json_columns: List[str] = []) -> 'JinjatExecutionResult':
        columns = [JinjatColumn(name=column.name, type=column.data_type.__class__.__name__) for column in
                   result.table.columns]
        adapter_response = JinjatAdapterResponse(message=result.adapter_response._message,
                                                 code=result.adapter_response.code,
                                                 rows_affected=result.adapter_response.rows_affected)
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
