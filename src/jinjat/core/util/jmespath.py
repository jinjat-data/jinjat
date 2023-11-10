from typing import Optional, List

import jmespath
from dbt.exceptions import CompilationError
from jmespath.exceptions import ParseError, JMESPathError
from starlette import status

from jinjat.core.dbt.dbt_project import DbtProject
from jinjat.core.util.api import JinjatErrorContainer, JinjatError, JinjatErrorCode, JSONAPIException


class CustomFunctions(jmespath.functions.Functions):

    @jmespath.functions.signature(
        {'types': ['string'], "variadic": True})
    def _func_projection(self, picked_keys: str, *values):
        picked = [key.strip() for key in picked_keys.split(',')]
        ret = {}
        for i, key in enumerate(picked):
            ret[key] = values[i]
        return ret


def json_query(data, expr):
    '''Query data using jmespath query language ( http://jmespath.org ). Example:
    - debug: msg="{{ instance | json_query(tagged_instances[*].block_device_mapping.*.volume_id') }}"
    '''

    options = jmespath.Options(custom_functions=CustomFunctions())

    return jmespath.search(expr, data, options=options)


class FilterModule(object):
    ''' Query filter '''

    def filters(self):
        return {
            'json_query': json_query
        }


def extract_jmespath(query: Optional[str], data: dict, dbt : DbtProject):
    current_data = data
    if query is None or query == '' or query == '*':
        return current_data

    try:
        compiled_expression = dbt.compile_sql(query)
    except CompilationError as e:
        raise JinjatErrorContainer(
            status_code=status.HTTP_400_BAD_REQUEST,
            errors=[JinjatError(code=JinjatErrorCode.JmesPathParseError, message=f"{e}")])

    try:
        jmespath_compile = jmespath.compile(compiled_expression.compiled_sql)
        current_data = jmespath_compile.search(current_data, jmespath.Options(custom_functions=CustomFunctions()))
    except JMESPathError as e:
        raise JinjatErrorContainer(
            status_code=status.HTTP_400_BAD_REQUEST,
            errors=[JinjatError(code=JinjatErrorCode.JmesPathParseError, message=f"{e}")])
    return current_data
