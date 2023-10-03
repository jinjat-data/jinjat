import React from "react";
import {isControl, JsonFormsRendererRegistryEntry, rankWith, resolveSchema, UISchemaElement} from "@jsonforms/core";
import {JsonSchema} from "@jsonforms/core/src/models";
import {Rating} from "@mui/material";
import dynamic from 'next/dynamic'

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
                return b['x-jsonforms']?.renderer == entry.name
            }
        ), renderer: ({data, handleChange, path}: any) => (
            <Component
                value={data}
            />
        )
    };
}