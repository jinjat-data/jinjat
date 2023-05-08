# Jinjat

## Develop data applications with dbt, SQL, and OpenAPI

### Installation

```commandline
pip install jinjat
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

## Integrations

poetry install --extras "duckdb"

### Playground

poetry install --extras "playground"


#### Installation

```commandline
pip install jinjat[playground]
```

Jinjat Playground is a Streamlit app that lets you develop APIs in your browser.
Once you write the template, you can save it to your dbt project as an analysis and expose the API.