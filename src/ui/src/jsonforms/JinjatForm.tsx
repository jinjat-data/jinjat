import React, {useMemo} from 'react';
import {JsonForms} from '@jsonforms/react';
import {
    materialRenderers,
    materialCells,
} from '@jsonforms/material-renderers';
import {Box, Card, CardContent, CardHeader} from "@mui/material";
import {generateJsonformModule} from "./util";
import {Generate, JsonSchema, UISchemaElement} from "@jsonforms/core";
import {ErrorObject} from "ajv";
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import {VerticalLayout} from "@jsonforms/core/src/models/uischema";
import _ from "lodash";

// const default_uischema: VerticalLayout = {
//     options: {
//         showUnfocusedDescription: true
//     }
// }

let custom_modules = [{
    module: '@mui/material',
    export: 'Rating',
    name: 'rating'
}];

const ajv = new Ajv({
    allErrors: true,
    verbose: true,
    strict: false,
});
addFormats(ajv);

export interface JinjatJsonFormsInitStateProps<T> {
    data: T;
    schema: JsonSchema;
    uischema?: UISchemaElement;
    readonly?: boolean;

    onChange?(value?: any): void;

    onError?(value: ErrorObject[]): void;

    layout?: 'horizontal' | 'vertical'
}

export const JinjatForm: React.FC<JinjatJsonFormsInitStateProps<any>> = (props) => {
    const renderers = [
        ...materialRenderers
            .map(it => ({
                    tester: it.tester,
                    renderer: (args: JSX.IntrinsicAttributes) => <Box
                        component="form"
                        sx={{display: "flex", flexDirection: "column"}}
                        style={{marginTop: '10px'}}
                        autoComplete="off"
                    >
                        <it.renderer {...args} />
                    </Box>
                })
            ),
        ...custom_modules.map(generateJsonformModule),
    ];

    const uischemaToUse = useMemo(
        () => {
            const uiSchemaElement = typeof props.uischema === 'object' ? props.uischema : Generate.uiSchema(props.schema);
            if(uiSchemaElement != null) {
                uiSchemaElement.type = `${_.startCase(_.camelCase(props.layout || 'vertical')).replace(/ /g, '')}Layout`
            }
            return uiSchemaElement
        },
        [props.uischema, props.schema, props.layout]
    );

    return (
        <JsonForms
            schema={props.schema}
            validationMode={"ValidateAndShow"}
            uischema={uischemaToUse}
            readonly={props.readonly}
            data={props.data}
            renderers={renderers}
            cells={materialCells}
            onChange={({data, errors}) => {
                props.onChange && props.onChange(data)
                props.onError && props.onError(errors || [])
            }}
        />
    );
}

