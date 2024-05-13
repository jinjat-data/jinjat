# Jinjat

## Develop data applications with dbt, SQL, and OpenAPI

[Jinj.at](https://jinj.at)

### Installation

```commandline
pip install jinjat
```

```commandline
poetry env use python3.9
poetry install 

poetry add dbt-duckdb==1.5.0
poetry run dbt deps --project-dir ../dbt_project_dir/
poetry run jinjat serve --host 127.0.0.1 --project-dir ../dbt_project_dir/
```

### Create your first API

Create an [analysis]() in `analysis/my_first_api.sql`:
```sql
{%- set query = request().query %}

select '{{query.example}}' as col1
```

And create a YML file in `analysis/schema.yml`:

```yml
version: 2

analyses:
  - name: my_first_api
    config:
      jinjat:
        method: get
        openapi:
          parameters:
            - in: query
              name: example
              schema:
                type: number
```

Start Jinjat as follows:

```commandline
jinjat serve --project-dir [YOUR_DBT_PROJECT_DIRECTORY]
```

And then run the following CURL command to test the API:

```commandline
curl -XGET 'http://127.0.0.1:8581?example=value'
```

It should return the following response:

```json
[
  "col1": "3"
]
```

Jinjat uses OpenAPI to validate the requests and create an API documentation automatically for your API.
