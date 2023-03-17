{% macro request(req) %}
    {% if execute %}
        {% set analyses_ref_node = graph.nodes.values() | selectattr('name', 'equalto', this.identifier) | first %}
        {% set jinjat = analyses_ref_node.config.jinjat %}

        {% if not jinjat %}
            {{ exceptions.raise_compiler_error(this.identifier ~ ": analyses can't use request() macro because it doesn't have `jinjat` config") }}
        {% endif %}

        {%- set req = req or {} %}

        {% if 'headers' not in req %}
            {% do req.update({"headers": {}}) %}
        {% endif %}
        {% if 'query' not in req %}
            {% do req.update({"query": {}}) %}
        {% endif %}
        {% if 'params' not in req %}
            {% do req.update({"params": {}}) %}
        {% endif %}

    
        {% if 'body' not in req %}
          {%- set request_body = jinjat.openapi.requestBody.content['application/json'].schema
            if "openapi" in jinjat 
            and "requestBody" in jinjat.openapi 
            and "content" in jinjat.openapi.requestBody 
            and "application/json" in jinjat.openapi.requestBody.content 
            and "schema" in jinjat.openapi.requestBody.content['application/json'] else {} %}

            {% if request_body['$ref'] and request_body['$ref'].startswith('#/components/schemas/') %}
                {% set identifier = request_body['$ref'][21:] %}

                {% set ref_node = graph.nodes[identifier] %}

                {%- set example = {} %}
                {% for name, column in ref_node.columns.items() %}
                    {% do example.update({name: column.name}) %}
                {% endfor %}
                               
                {% do req.update({"body": example}) %}
            {% elif request_body.type %}
                {% do req.update({"body": generate_sample_from_json_schema(request_body)}) %}
            {% else %}
                {% if jinjat.method in ['post', 'put', 'patch'] %}
                    {{ exceptions.raise_compiler_error(this.identifier ~ ": Unable to create an example value which is required for `" ~ jinjat.method ~ "` method") }}
                {% endif %}
            {% endif %}
        {% endif %}
         
        {{log("Request processing for `" ~ this.identifier ~ "`: " ~  tojson(req))}}

        {{return(req)}}
    {% endif %}
{% endmacro %}


{% macro generate_sample_from_json_schema(json_schema) %}
    {% if 'examples' in json_schema %}
        {{return(json_schema.examples[0])}}
    {% elif 'example' in json_schema %}
        {{return(json_schema.example)}}
    {% endif %}

    {% if 'default' in json_schema %}
        {{return(json_schema.default)}}
    {% endif %}

    {% if 'enum' in json_schema or json_schema.type == 'string' %}
        {% if 'enum' in json_schema %}
            {{return(json_schema.enum[0])}}
        {% else %}
            {{return("'?'")}}
        {% endif %}
    {% elif json_schema.type == 'object' %}
        {% set example_object = {} %}
        {% for key, value in json_schema.properties.items() %}
            {% do example_object.update({key: generate_sample_from_json_schema(value)}) %}
        {% endfor %}
        {{return(example_object)}}
    {% elif json_schema.type == 'array' %}
        {{return([generate_sample_from_json_schema(json_schema.items)])}}
    {% elif json_schema.type == 'boolean' %}
         {{return("TRUE")}}
    {% elif json_schema.type == 'number' %}
         {{return("0")}}
    {% elif json_schema.type == 'null' %}
        {{return("NULL")}}
    {% endif %}
{% endmacro %}