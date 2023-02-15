{% macro limit_query(sql, limit) -%}
    {{ return(adapter.dispatch('limit_query')(sql, limit)) }}
{%- endmacro %}


{% macro default__limit_query(sql, limit) -%}
    select * from ({{sql}}) as __all_data LIMIT {{limit}}
{%- endmacro %}


{% macro oracle__concat(sql, limit) %}
    select * from ({{sql}}) OFFSET 0 ROWS FETCH NEXT {{limit}} ROWS ONLY;
{%- endmacro %}


-----


{% macro generate_select(selects) -%}
    {% if selects is defined %}
    {% for select in selects %}
        {{quote_identifier(select)}}
    {% endfor %}
   {% else %}
    *
   {% endif %}
{%- endmacro %}



-----

{% macro generate_where(filter) -%}
    {{ return(adapter.dispatch('generate_where')(filter)) }}
{%- endmacro %}

{% macro default__generate_where(filter) -%}
        {% if not filter %}
            {{return('TRUE')}}
        {% else %}
            {% if 'and' in filter and 'or' in filter %}
                {{ exceptions.raise_compiler_error("There can only be one of `and` or `or` in the filter: " ~ filter) }}
            {% elif 'and' in filter %}
                {% for subfilter in filter.and.items() %}
                    {{generate_where(subfilter)}}
                    {% if not loop.last %} AND {% endif %}
                {% endfor %}
            {% elif 'or' in filter %}
                {% for subfilter in filter.and.items() %}
                    {{generate_where(subfilter)}}
                    {% if not loop.last %} OR {% endif %}
                {% endfor %}
            {% elif 'field' in filter %}
                {{ generate_single_filter(filter.field, filter.operator, filter.value) }}
            {% else %}
                {{ exceptions.raise_compiler_error("Unable to render filter, can't find any of `and`, `or`, `field` properties: " ~ filter) }}
            {% endif %}
        {% endif %}
{%- endmacro %}


{% macro generate_single_filter(field, operator, value) -%}
    {%- set operator_map = {"equals": "=", "not_equals": "!="} %}

    {{field}} {{operator_map[operator]}} {{value}}
{%- endmacro %}
