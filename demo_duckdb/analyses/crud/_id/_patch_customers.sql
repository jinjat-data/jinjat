{%- set request = request() %}
UPDATE
    {{ ref('customers') }}
    set {% for key, value in request.body.items() %}
        {{ quote_identifier(key) }} = {{ quote_literal_value(value) }}

        {% if not loop.last %},
        {% endif %}
    {% endfor %}
WHERE
    {{ get_jinjat_config(
        'ref',
        'customers'
    ).schema['x-pk'] }} = {{ quote_literal_value(
        request.params.id
    ) }}
