import json
import pprint
import time
from copy import deepcopy

import jsonref

from jinjat.core.dbt.dbt_project import DbtProject
from jinjat.core.models import DbtQueryRequestContext

import collections


def _replace_jsonref_proxies(obj):
    """
    Replace jsonref proxies in the given json obj with the proxy target.
    Updates are made in place. This removes compatibility problems with 3rd
    party libraries that can't handle jsonref proxy objects.
    :param obj: json like object
    :type obj: int, bool, string, float, list, dict, etc
    """

    objects = set()
    # TODO: consider upstreaming in the jsonref library as a util method
    def descend(fragment):
        if isinstance(fragment, collections.MutableMapping):
            for k, v in fragment.items():
                if v in objects:
                    pass
                if type(v) not in [str, int, bool, dict, list]:
                    fragment[k] = v.__subject__
                objects.add(v)
                descend(fragment[k])
        if isinstance(fragment, collections.MutableSequence):
            for i, element in enumerate(fragment):
                if type(element) not in [str, int, bool, dict, list]:
                    fragment[i] = element.__subject__
                if v in objects:
                    pass
                objects.add(v)
                descend(element)

    return descend(obj)


def openapi_resolve_refs():
    openapi = json.loads(open('test_openapi.json').read())
    openapi_schema = jsonref.replace_refs(openapi, base_uri="", proxies=False, lazy_load=False)
    dumps = deepcopy(openapi_schema)
    pprint.pprint(dumps)
    print(json.dumps(dumps))


def execute_query_perf():
    dbt = DbtProject(
        project_dir="/demo_duckdb",
        profiles_dir="/demo_duckdb"
    )
    context = DbtQueryRequestContext(method="POST", body={"test": 1}, headers={}, query={}, params={})

    for i in range(10):
        sql = dbt.execute_sql("select {{request().body.test}}", context)

    start = time.time()
    for i in range(1000):
        sql = dbt.execute_sql("select {{request().body.test}}", context)
        if i % 100 == 0:
            print(str(i) + " " + str(time.time() - start))
            start = time.time()

    end = time.time()
    print(end - start)


openapi_resolve_refs()
