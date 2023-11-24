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
    Skeleton, Tab, Tabs,
    Typography
} from "@mui/material";

export const JinjatCreate: React.FC<JinjatFormProps> = ({packageName, resources, title, logo, ...props}) => {
    const {formLoading, onFinish} = useForm({resource: `_analysis/${packageName}.${resources.create}`});

    const [data, setData] = useState<object>({})
    const [errors, setErrors] = useState<ErrorObject[] | null>(null)

    let resource = `${packageName}.${resources.create}`;
    const {data: jinjatSchema, isLoading, error} = useSchema<JsonSchema, HttpError>({
        analysis: resource,
        config: {type: Type.REQUEST}
    })

    if (isLoading) {
        return <Skeleton/>;
    }

    if (error != null) {
        return <div>Something went wrong! {error.message}</div>;
    }

    if (jinjatSchema?.schema == null) {
        return <Alert severity="error">
            <AlertTitle>Schema not found!</AlertTitle>
            For <code>create</code>` action, you need to define
            the <code>request.body</code> for <code>{resource}</code>
        </Alert>
    }

    // let pkColumn = jinjatSchema.schema?.["x-pk"];
    // if(pkColumn != null && jinjatSchema?.schema?.properties != null) {
    //     delete jinjatSchema?.schema?.properties[pkColumn]
    // }

    return <Create title={title} goBack={logo} isLoading={formLoading}
                   saveButtonProps={{disabled: errors != null && errors.length > 0, onClick: () => onFinish(data)}}>
        <JinjatForm data={data} schema={jinjatSchema.schema} onChange={setData}
                    onError={setErrors} {...(props?.form || {})}/>
    </Create>
}