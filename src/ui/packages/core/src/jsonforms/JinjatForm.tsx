import React, {useMemo} from "react";
import {JsonForms} from '@jsonforms/react';
import {allJsonFormsCells, allJsonFormsRenderer} from "./util";
import {Generate, JsonSchema, UISchemaElement} from "@jsonforms/core";
import Ajv, {ErrorObject} from "ajv";
import addFormats from 'ajv-formats';
import _ from "lodash";
import {Alert, AlertTitle} from "@mui/material";
import {EditorCode} from "@components/code/editor-code";
import * as YAML from 'yaml';

const ajv = new Ajv({
    allErrors: true,
    verbose: true,
    strict: false,
    useDefaults: true
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
    const schema = React.useMemo(() => {
        if (props.schema == null || Object.keys(props.schema).length == 0 || Object.keys(props.schema.properties || {}).length === 0) {
            // workaround for https://github.com/eclipsesource/jsonforms/issues/2207
            // let prunedData = Object.fromEntries(Object.entries(props.data).filter(([_, v]) => v != null));
            if(Array.isArray(props.data)) {
                const itemSchema = Generate.jsonSchema(props.data.find(row => row != null))
                return {
                    type: "array",
                    items: itemSchema
                } as JsonSchema
            } else {
                return Generate.jsonSchema(props.data);
            }
        } else {
            return props.schema;
        }
    }, [props.schema])


    const uischemaToUse = useMemo(
        () => {
            const uiSchemaElement = typeof props.uischema === 'object' ? props.uischema : schema ? Generate.uiSchema(schema) : undefined;
            if (uiSchemaElement != null && props.layout != null) {
                uiSchemaElement.type = `${_.startCase(_.camelCase(props.layout)).replace(/ /g, '')}Layout`;
            }
            return uiSchemaElement
        },
        [props.uischema, props.data, schema, props.layout]
    );

    if ((uischemaToUse as any)?.elements?.length == 0) {
        return <>
            <Alert severity="error">
                <AlertTitle>No renderer found, schema doesnt have any type</AlertTitle>
            </Alert>
            <EditorCode value={YAML.stringify(schema)} language={"yaml"}></EditorCode>
        </>
    }

    return (
        <JsonForms
            ajv={ajv}
            validationMode={"ValidateAndHide"}
            readonly={props.readonly}
            schema={schema}
            data={props.data}
            uischema={uischemaToUse}
            renderers={allJsonFormsRenderer}
            config={{hideRequiredAsterisk: false, restrict: false, showUnfocusedDescription: true, trim: false}}
            cells={allJsonFormsCells}
            onChange={({data, errors}) => {
                props.onChange && !_.isEqual(data, props.data) && props.onChange(data)
                props.onError && props.onError(errors || [])
            }}
        />
    );
}

