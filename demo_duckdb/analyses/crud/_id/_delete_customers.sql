{%- set request = request() %}
DELETE FROM
    {{ ref('raw_customers') }}
WHERE
    {{ generate_where({ "field": get_jinjat_config('ref', 'customers').crud.primary_key, "operator": "equals", "value": request.params.id }) }}
--LIMIT
--    1
