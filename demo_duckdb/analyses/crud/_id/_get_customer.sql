{%- set request = request() %}
SELECT
    {{ generate_select(
        request.query.select
    ) }}
FROM
    {{ ref('customers') }}
WHERE
    {{ generate_where({ "field": get_jinjat_config('ref', 'customers').schema['x-pk'], "operator": "equals", "value": request.params.id }) }}
LIMIT
    1
