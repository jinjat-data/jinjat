import React, {useState} from "react";
import {HttpError, useForm} from "@refinedev/core";
import {Create} from "@refinedev/mui";
import {Type, useSchema} from "@components/hooks/useSchema";
import {JsonSchema} from "@jsonforms/core";
import {JinjatForm} from "src/jsonforms/JinjatForm";
import {ErrorObject} from "ajv";
import {JinjatFormProps} from "@components/crud/utils";
import {
    Alert,
    AlertTitle,
    Skeleton
} from "@mui/material";
import {QueryObserverResult} from "@tanstack/react-query";
import {JinjatSchema} from "@components/hooks/schema";
import JinjatAnalysisForm from "../../jsonforms/JinjatAnalysisForm";

export const JinjatCreate: React.FC<JinjatFormProps> = ({packageName, resources, title, logo, ...props}) => {
    let createResource = `_analysis/${packageName}.${resources.create}`;
    const {formLoading, onFinish, queryResult} = useForm({resource: createResource});

    const [data, setData] = useState<object>({})
    const [errors, setErrors] = useState<ErrorObject[] | null>(null)

    let resource = `${packageName}.${resources.create}`;

    let schema
    if(typeof resources.create == "string") {
        schema = useSchema<JsonSchema, HttpError>({
            analysis: resource,
            config: {type: Type.REQUEST}
        })
    } else {
        schema = resources.create as QueryObserverResult<JinjatSchema, HttpError>
    }


    if (schema.isLoading) {
        return <Skeleton/>;
    }

    if (schema.error != null) {
        return <div>Something went wrong! {schema.error.message}</div>;
    }

    if (schema.data?.schema == null && schema.data?.parameters == null) {
        return <Alert severity="error">
            <AlertTitle>Schema not found!</AlertTitle>
            For <code>create</code>` action, you need to define
            the <code>request.body</code> for <code>{resource}</code>
        </Alert>
    }

    return <Create title={title} goBack={logo} isLoading={formLoading}
                   saveButtonProps={{disabled: errors != null && errors.length > 0, onClick: () => onFinish(data)}}>
        {schema.data.parameters?.length > 0 ? <JinjatAnalysisForm parameters={schema.data.parameters} action={"create"}/> : <div/>}
        {schema.data?.schema != null ? <JinjatForm data={data} schema={schema.data?.schema} onChange={setData}
                    onError={setErrors} {...(props || {})}/> : null}
    </Create>
}