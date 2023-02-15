{% macro quote_identifier(column_name) %}
    {% set col_name = adapter.dispatch('quote_identifier')(column_name) %}
    {{ return(col_name) }}
{% endmacro %}

{% macro default__quote_identifier(column_name) %}
    {% set quoted_col_name = '"' + column_name + '"' %}
    {{ return(quoted_col_name) }}
{% endmacro %}

{% macro quote_literal_value(value) %}
    {% set literal_value = adapter.dispatch('quote_literal_value')(value) %}
    {{ return(literal_value) }}
{% endmacro %}

{% macro default__quote_literal_value(value) %}
    {% if value is not defined %}
        {{ return('NULL') }}
    {% else %}
        {% set value_native = value | as_native %}
        {% if value_native == True or value_native == False %}
            {{ return(value_native) }}
        {% else %}
            {% set value_str = value ~ ''  %}
            {% if modules.re.match('^\d+$', value_str) %}
                {{ return(value) }}
            {% else %}
                {% set quoted_value = "'" + modules.re.sub(
                    "\'",
                    "''",
                    value_str
                ) + "'" %}
                {{ return(quoted_value) }}
            {% endif %}
        {% endif %}
    {% endif %}
{% endmacro %}
