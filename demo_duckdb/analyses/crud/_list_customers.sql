{%- set request = request({"query": {"sorting": [{"field": "1", "asc": true}]}}) %}

{%- set query = request.query %}

SELECT
    {{ generate_select(
        query.select
    ) }}
FROM
{{ ref('customers') }}

{% if query.filter is defined %}
WHERE
    {{ generate_where(filter) }}
{% endif %}

{% if query.sorting is defined %}
ORDER BY
    {% for sorting in query.sorting %}
            {{ quote_identifier(
                sorting.field
            ) }}

            {% if sorting.asc %}
                ASC
            {% else %}
                DESC
            {% endif %}
    {% endfor %}
{% endif %}
