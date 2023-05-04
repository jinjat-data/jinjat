from fal_serverless import isolated, sync_dir

project_dir = "/Users/bkabak/Code/jinjat/jaffle_shop_metrics"
profiles_dir = None
target = None
refine = None
dbt_vars = '{}'

if profiles_dir is not None:
    sync_dir(profiles_dir, "/data/profiles")
sync_dir(project_dir, "/data/project")


@isolated(requirements=["dbt-core==1.4.5", "pydantic>=1.9.1", "fastapi>=0.85.0",
                        "openapi-schema-pydantic>=1.2.4", "deepmerge>=1.1.0",
                        "jsonschema>=3.0", "jsonref>=1.1.0", "jmespath>=1.0.1", "jinjat==0.4"],
          exposed_port=5656, keep_alive=600)
def fal_wrapper():
    import os
    from jinjat.core.dbt.dbt_project import DbtTarget
    from jinjat.main import run_server
    from jinjat.core.server import SERVER_OPT

    dbt_target = DbtTarget(project_dir='/data/sync/project', profiles_dir='/data/sync/profiles', target=target,
                           vars=dbt_vars, refine=refine)
    os.environ[SERVER_OPT] = dbt_target.json()
    run_server("0.0.0.0", 5656)
