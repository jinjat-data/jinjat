{%- set request = request() %}
SELECT
    {{ generate_select(
        request.query.select
    ) }}
FROM
    {{ ref('customers') }}
WHERE
    {{ generate_where({ "field": get_jinjat_config('ref', 'customers').crud.primary_key, "operator": "equals", "value": request.params.id }) }}
LIMIT
    1
