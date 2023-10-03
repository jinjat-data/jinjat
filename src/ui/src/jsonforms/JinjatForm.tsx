import React from 'react';
import {JsonForms} from '@jsonforms/react';
import {
    materialRenderers,
    materialCells,
} from '@jsonforms/material-renderers';
import { Box } from "@mui/material";
import {generateJsonformModule} from "./util";
import {JsonSchema, UISchemaElement} from "@jsonforms/core";
import {ErrorObject} from "ajv";
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

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

export interface JinjatJsonFormsInitStateProps {
    data: any;
    schema: JsonSchema;
    uischema?: UISchemaElement;
    readonly? : boolean;
    onChange?(value?: any): void;
    onError?(value: ErrorObject[]): void;
}

export const JinjatForm: React.FC<JinjatJsonFormsInitStateProps> = (props) => {
    const renderers = [
        ...materialRenderers
            .map(it => ({
            tester: it.tester,
            renderer: (args: JSX.IntrinsicAttributes) => <Box
                component="form"
                sx={{ display: "flex", flexDirection: "column" }}
                style={{marginTop: '10px'}}
                autoComplete="off"
            >
                <it.renderer {...args} />
            </Box>
        })
            ),
        ...custom_modules.map(generateJsonformModule),
    ];

    return (
            <JsonForms
                schema={props.schema}
                validationMode={"ValidateAndShow"}
                uischema={props.uischema}
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

