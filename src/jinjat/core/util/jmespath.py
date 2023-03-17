from typing import Optional, List

import jmespath
from jmespath.exceptions import ParseError, JMESPathError
from starlette import status

from jinjat.core.util.api import JinjatErrorContainer, JinjatError, JinjatErrorCode


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


def extract_jmespath(queries: Optional[List[str]], data: dict):
    current_data = data
    for query in queries:
        if query is None or query == '' or query == '*':
            continue

        try:
            jmespath_compile = jmespath.compile(query)
            current_data = jmespath_compile.search(current_data, jmespath.Options(custom_functions=CustomFunctions()))
        except JMESPathError as e:
            raise JinjatErrorContainer(
                status_code=status.HTTP_400_BAD_REQUEST,
                error=JinjatError(code=JinjatErrorCode.JmesPathParseError, error=f"{e}"))
    return current_data
