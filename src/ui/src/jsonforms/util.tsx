import React from "react";
import {isControl, JsonFormsRendererRegistryEntry, rankWith, resolveSchema, UISchemaElement} from "@jsonforms/core";
import {JsonSchema} from "@jsonforms/core/src/models";
import {Rating} from "@mui/material";
import dynamic from 'next/dynamic'
import {OpenAPIParameter} from "@components/hooks/schema";

export interface JsonFormCustomModule {
    module: string;
    export: string;

    name: string;
}

// const DynamicComponent = dynamic(() =>
//     import('../components/hello').then((mod) => mod.Hello),
//     {
//         ssr: false,
//         loading: () => <p>Loading...</p>,
//     })

export const extractJsonSchemaFromOpenAPIParameters = (
    parameters: OpenAPIParameter[]
): JsonSchema | null => {
    if (parameters.length == 0) {
        return null
    }
    const properties: { [key: string]: JsonSchema } = {};

    const requiredFields: string[] = []
    parameters
        .forEach((parameter) => {
            if (parameter.schema) {
                if (parameter.required) {
                    requiredFields.push(parameter.name)
                }
                parameter.schema.description = parameter.schema.description || parameter.description
                properties[parameter.name] = parameter.schema;
            } else {
                properties[parameter.name] = {
                    type: 'string',
                };
            }
        });

    return {
        type: 'object',
        required: requiredFields,
        properties,
    } as JsonSchema;
};

export function generateJsonformModule(entry: JsonFormCustomModule): JsonFormsRendererRegistryEntry {
    // const Component = React.lazy(() => import(entry.module).then(module => ({default: module[entry.export]})))
    const Component = Rating
    // @ts-ignore
    return {
        tester: rankWith(
            3,
            (
                uischema: UISchemaElement,
                schema: JsonSchema,
                context
            ): boolean => {
                if (!isControl(uischema)) {
                    return false;
                }

                let b = resolveSchema(schema, uischema.scope, context?.rootSchema);
                // @ts-ignore
                return b?.['x-jsonforms']?.renderer == entry.name
            }
        ), renderer: ({data, handleChange, path}: any) => (
            <Component
                value={data}
            />
        )
    };
}