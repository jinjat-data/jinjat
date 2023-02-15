# Jinjat

## Create REST APIs from your dbt project

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

Jinjat uses OpenAPI to validate the request body & response and create API documentation automatically for your API.

## Integrations

### Playground

#### Installation

```commandline
pip install jinjat[playground]
```

Jinjat Playground is a Streamlit app that lets you develop APIs in your browser.
Once you write the template, you can save it to your dbt project as an analysis and expose the API.

### [Refine](https://refine.dev) (User Interface)

#### Installation

```commandline
pip install jinjat[refine]
```

Jinjat Refine integration creates a Refine app from your OpenAPI spec. You can customize the app either via the OpenAPI spec in your dbt project or Typescript depending on your choice.

## TODO:
[] Hot reload
[] dbt-metrics Integration
