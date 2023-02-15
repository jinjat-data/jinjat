import time

from jinjat.core.dbt.dbt_project import DbtProject
from jinjat.core.models import DbtQueryRequestContext

dbt = DbtProject(
            project_dir="/Users/bkabak/Code/jinjat/jinjat/demo_duckdb",
            profiles_dir="/Users/bkabak/Code/jinjat/jinjat/demo_duckdb"
        )

context = DbtQueryRequestContext(method="POST", body={"test": 1}, headers={}, query={}, params={})

for i in range(10):
    sql = dbt.execute_sql("select {{request().body.test}}", context)

start = time.time()
for i in range(1000):
    sql = dbt.execute_sql("select {{request().body.test}}", context)
    if i % 100 == 0:
        print(str(i)+" "+str(time.time() - start))
        start = time.time()

end = time.time()
print(end-start)