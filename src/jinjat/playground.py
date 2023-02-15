import argparse
import json
import os
import sys
from collections import OrderedDict
from pathlib import Path
from typing import Optional

import dbt.config.profile as dbt_profile
import pandas as pd
# import pandas_profiling
import streamlit as st
from dbt.exceptions import CompilationException, DatabaseException
from streamlit_ace import st_ace
# from streamlit_pandas_profiling import st_profile_report

from jinjat.core.dbt.config import DEFAULT_PROFILES_DIR
from jinjat.core.dbt.dbt_project import DbtProject
from jinjat.core.models import DbtQueryRequestContext

st.set_page_config(page_title="Jinjat Playground", page_icon="🌊", layout="wide")
state = st.session_state

try:
    parser = argparse.ArgumentParser(description="Jinjat playground")
    parser.add_argument("--profiles-dir", help="dbt profile directory")
    parser.add_argument("--project-dir", help="dbt project directory")
    args = vars(parser.parse_args(sys.argv[1:]))
except:
    args = {}

root_path = Path(__file__).parent
demo_dir = root_path / "demo"

# GLOBAL STATE VARS
DBT = "DBT"
"""DbtProject object"""
PROJ_DIR = "PROJ_DIR"
"""dbt project directory"""
PROF_DIR = "PROF_DIR"
"""dbt profile directory"""

_proj_dir = args.get("project_dir")
state.setdefault(PROJ_DIR, _proj_dir or os.getenv("DBT_PROJECT_DIR", str(Path.cwd())))
_prof_dir = args.get("profiles_dir")
state.setdefault(PROF_DIR, _prof_dir or os.getenv("DBT_PROFILES_DIR", DEFAULT_PROFILES_DIR))

RAW_PROFILES = "RAW_PROFILES"
"""All profiles as parsed from raw profiles yaml"""
state.setdefault(RAW_PROFILES, dbt_profile.read_profile(state[PROF_DIR] or DEFAULT_PROFILES_DIR))

# SQL PLAYGROUND VARS
SQL_RESULT = "SQL_RESULT"
"""SQL result as a pandas dataframe"""
SQL_ADAPTER_RESP = "SQL_ADAPTER_RESP"
"""Adapter response from dbt"""
SQL_QUERY_STATE = "SQL_QUERY_STATE"
"""SQL query state tracking if it is successful or failed"""

state.setdefault(SQL_RESULT, pd.DataFrame())
state.setdefault(SQL_ADAPTER_RESP, None)
state.setdefault(SQL_QUERY_STATE, "test")

# PRIMARY SQL CONTAINERS
COMPILED_SQL = "COMPILED_SQL"
"""Compiled sql container"""
state.setdefault(COMPILED_SQL, "")

RAW_SQL = "RAW_SQL"
"""Raw sql container"""

state.setdefault(
    RAW_SQL,
    """
{{
    config(
        jinjat={
            "method": "POST"
        }
    )
}}


{% set payment_methods = ['credit_card', 'coupon', 'bank_transfer', 'gift_card'] %}    
{%- set payload = request().body %}

select '{{ payment_methods[payload.payment_method_index] }}'
""".strip(),
)

FLIGHT_REQUEST = "REQUEST_BODY"
"""Request json"""

state.setdefault(FLIGHT_REQUEST, """{
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "payment_method_index": 0
  },
  "query": {
  },
  "params": {
  }
}""")

# COMPONENT KEYS
PROFILE_SELECTOR = "PROFILE_SELECTOR"
"""Selected profile"""
DIALECT_PICKER = "DIALECT_PICKER"
"""Selected SQL dialect for playground"""
QUERY_LIMITER = "QUERY_LIMITER"
"""Limit results returned in SQL runner"""
BASIC_PROFILE_OPT = "BASIC_PROFILE_OPT"
"""Use basic profiling for pandas-profiling"""
PROFILE_DOWNLOADER = "PROFILE_DOWNLOADER"
"""Controller for downloading HTML results of pandas-profiler"""
DYNAMIC_COMPILATION = "DYNAMIC_COMPILATION"
"""Toggle to compile on-type or compile on control+enter"""

# ACE COMPONENT OPTIONS
DBT_ADAPTER_ACE_DIALECT_MAP = {
    "postgres": "pgsql",
    "mysql": "mysql",
    "sqlserver": "sqlserver"
}
DEFAULT_ACE_DIALECT = "sql"

# TRIGGERS
DBT_DO_RELOAD = "DBT_DO_RELOAD"
"""This triggers dbt to reparse the project"""
PIVOT_LAYOUT = "PIVOT_LAYOUT"
"""Pivot the editor layout from side-by-side to top-bottom"""

state.setdefault(PIVOT_LAYOUT, False)

TARGET_PROFILE = "TARGET_PROFILE"
"""Target profile for dbt to execute against"""


def inject_dbt(change_target: Optional[str] = None):
    """Parse dbt project and load context var"""
    if DBT not in state or change_target:
        dbt_ctx = DbtProject(
            project_dir=state[PROJ_DIR],
            profiles_dir=state[PROF_DIR],
            target=change_target,
        )
    else:
        dbt_ctx: DbtProject = state[DBT]
        dbt_ctx.rebuild_dbt_manifest(reset=True)
    state[DBT] = dbt_ctx
    return True


if DBT not in state:
    inject_dbt()
ctx: DbtProject = state[DBT]

state.setdefault(TARGET_PROFILE, ctx.config.target_name)


def toggle_viewer() -> None:
    state[PIVOT_LAYOUT] = not state[PIVOT_LAYOUT]


# @st.cache
def compile_sql(sql: str, _request_context: DbtQueryRequestContext) -> str:
    try:
        return ctx.compile_sql(sql, _request_context).compiled_sql
    except CompilationException:
        return None


def run_query(sql: str, limit: int = 2000) -> None:
    try:
        result = ctx.execute_sql(f"select * from ({sql}) as __all_data limit {limit}")
    except DatabaseException as error:
        state[SQL_QUERY_STATE] = "error"
        state[SQL_ADAPTER_RESP] = str(error)
    else:
        output = [OrderedDict(zip(result.table.column_names, row)) for row in result.table.rows]
        state[SQL_RESULT] = pd.DataFrame(output)
        state[SQL_ADAPTER_RESP] = result.adapter_response
        state[SQL_QUERY_STATE] = "success"

st.sidebar.title("Jinjat")

st.sidebar.button("Switch {} layout".format("horizontal" if state[PIVOT_LAYOUT] else "vertical"),
                  on_click=toggle_viewer)

st.sidebar.header("Profiles")
state[TARGET_PROFILE] = st.sidebar.radio(
    f"Loaded profiles from {ctx.config.profile_name}",
    [target for target in state[RAW_PROFILES][ctx.config.profile_name].get("outputs", [])],
    key=PROFILE_SELECTOR,
)
# st.sidebar.button("Reload dbt project", key=DBT_DO_RELOAD)
st.sidebar.caption(
    "Refresh the page to reparse dbt. This is useful if any updated models or macros in your physical project \
    on disk have changed and are not yet reflected in the playground as refable or updated."
)

# IDE LAYOUT
notificationContainer = st.empty()
descriptionContainer = st.container()
compileOptionContainer = st.container()
ideContainer = st.container()

descriptionContainer.markdown("")

if not state[PIVOT_LAYOUT]:
    idePart1, idePart2 = ideContainer.columns(2)
else:
    idePart1 = ideContainer.container()
    idePart2 = ideContainer.container()

compileOptionContainer.write("")
auto_update = compileOptionContainer.checkbox("Dynamic Compilation", key=DYNAMIC_COMPILATION, value=True)
if auto_update:
    compileOptionContainer.caption("👉 Compiling SQL on change")
else:
    compileOptionContainer.caption("👉 Compiling SQL with control + enter")

with idePart1:
    state[RAW_SQL] = st_ace(
        value=state[RAW_SQL],
        theme="dracula",  # clouds for white
        language=DBT_ADAPTER_ACE_DIALECT_MAP.get(dbt_profile.Credentials.type, DEFAULT_ACE_DIALECT),
        auto_update=auto_update,
        key="sql",
        max_lines=35,
        min_lines=20,
        height=500,
    )

    st.caption("Request")

    state[FLIGHT_REQUEST] = st_ace(
        value=state[FLIGHT_REQUEST],
        theme="dracula",  # clouds for white
        language="json",
        auto_update=auto_update,
        key="body",
        max_lines=35,
        min_lines=20,
        height=200,
    )

with idePart2:
    with st.expander("📝 Compiled SQL", expanded=True):
        st.code(
            state[COMPILED_SQL]
            if state[COMPILED_SQL]
            else " --> Invalid Jinja, awaiting model to become valid",
            language="sql",
        )


def get_dbt_request_context() -> DbtQueryRequestContext:
    return DbtQueryRequestContext(**json.loads(state[FLIGHT_REQUEST]))


request_context = get_dbt_request_context()
raw_sql_compiled = compile_sql(state[RAW_SQL], request_context)
if raw_sql_compiled != state[COMPILED_SQL]:
    state[COMPILED_SQL, request_context] = raw_sql_compiled
    st.experimental_rerun()  # This eager re-run speeds up the app

if ctx.config.target_name != state[TARGET_PROFILE]:  # or state[DBT_DO_RELOAD]:
    print("Reloading dbt project...")
    with notificationContainer:
        ctx.config.target_name = state[TARGET_PROFILE]
        ctx.config.target_name = state[TARGET_PROFILE]
        with st.spinner("Reloading dbt... ⚙️"):
            inject_dbt(state[TARGET_PROFILE])
            state[COMPILED_SQL] = compile_sql(state[RAW_SQL], get_dbt_request_context())
    st.experimental_rerun()

# TEST LAYOUT
testHeaderContainer = st.container()
test_column_1, _, test_column_2 = st.columns([1, 2, 1])
testContainer = st.container()
testContainerViewer = testContainer.expander("Result Viewer 🔎", expanded=True)
test_view_1, _, test_view_2 = testContainerViewer.columns([1, 2, 1])

downloadBtnContainer, profileBtnContainer = st.columns([1, 1])
profilerContainer = st.container()

with testHeaderContainer:
    st.subheader("🔬 Query Result Inspector")

query_limit = test_column_2.number_input(
    "Limit Results", min_value=1, max_value=50_000, value=2_000, step=1000, key=QUERY_LIMITER,
    help="Limit the number of results returned by the query, the maximum value is 50,000"
)

test_column_1.button(
    "Execute Compiled Query",
    on_click=run_query,
    kwargs={"sql": state[COMPILED_SQL], "limit": query_limit},
)

with testContainerViewer:
    st.write("\n\n\n\n\n")

    if state[SQL_QUERY_STATE] == "success":
        test_view_1.write("#### Compiled SQL query results")
    elif state[SQL_QUERY_STATE] == "error":
        test_view_1.warning(f"SQL query error: {state[SQL_ADAPTER_RESP]}")
    if not state[SQL_RESULT].empty:
        test_view_2.info(f"Adapter Response: {state[SQL_ADAPTER_RESP]}")
        st.dataframe(state[SQL_RESULT])
    else:
        st.write("")
        st.markdown(
            "> The results of your playground query will show up here. Click `Execute Compiled Query` to see the results. "
        )
        st.write("")
    st.write("")

if state[SQL_QUERY_STATE] == "success":
    with downloadBtnContainer:
        st.download_button(
            label="Download data as CSV",
            data=state[SQL_RESULT].to_csv().encode("utf-8"),
            file_name=f"jinjat_playground.csv",
            mime="text/csv",
        )
