{% macro get_jinjat_config(type, package_name_or_identifier, identifier=None) %}
 {% if execute %}
    {% if type == 'ref' %}
        {% set dbt_types = ['model', 'seed'] %}
    {% elif type == 'source' %}
        {% set dbt_types = ['source'] %}
    {% else %}
        {{ exceptions.raise_compiler_error(this.identifier ~ ": Invalid type `" ~ type ~ "`") }}
    {% endif %}

    {% set name = identifier if identifier else package_name_or_identifier %}

    {% set node = graph.nodes.values() | selectattr('resource_type', 'in', dbt_types) | selectattr('name', '==', name) | first %}

    {{return(node.config.meta.jinjat)}}
 {% endif %}
{% endmacro %}