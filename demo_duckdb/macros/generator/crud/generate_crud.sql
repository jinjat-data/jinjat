{% macro jinjat__template__crud_entrypoint(to, ) %}
    {% set read_only_operations = {
            "analyses/crud/_list_customers.sql": generate_jinjat__crud__analysis_list(to),
            "analyses/crud/_id/_get_customers.sql": generate_jinjat__crud__analysis_get(to),
       }
    %}

    {% set write_operations = [
        {
            "analyses/crud/_create_customers.sql": generate_jinjat__crud__analysis_create(to),
            "analyses/crud/_id/_delete_customers.sql": generate_jinjat__crud__analysis_delete(to),
            "analyses/crud/_id/_patch_customers.sql": generate_jinjat__crud__analysis_path(to),
        }
    ] %}

    {{ return()}}
{% endmacro %}