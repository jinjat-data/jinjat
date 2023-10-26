import React, {useState} from "react";
import {HttpError, useForm} from "@refinedev/core";
import {Create} from "@refinedev/mui";
import {Type, useSchema} from "@components/hooks/useSchema";
import {JsonSchema} from "@jsonforms/core";
import {JinjatForm} from "src/jsonforms/JinjatForm";
import {ErrorObject} from "ajv";
import {JinjatFormProps} from "@components/crud/utils";

export const JinjatCreate: React.FC<JinjatFormProps> = ({packageName, resources, title, logo}) => {
    const { formLoading, onFinish } = useForm();

    const [data, setData] = useState<object>({})
    const [errors, setErrors] = useState<ErrorObject[] | null>(null)

    let resource = `${packageName}.${resources.create}`;
    const {data : jinjatSchema, isLoading, error} = useSchema<JsonSchema, HttpError>({
        analysis: resource,
        config: {type: Type.REQUEST}
    })

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error != null) {
        return <div>Something went wrong! {error.message}</div>;
    }

    if(jinjatSchema == null) {
        return <div>Schema not found!</div>;
    }

    // @ts-ignore
    let pkColumn = jinjatSchema.schema['x-pk'];
    if(pkColumn != null && jinjatSchema?.schema?.properties != null) {
        delete jinjatSchema?.schema?.properties[pkColumn]
    }

    return <Create title={title} goBack={logo} isLoading={formLoading} saveButtonProps={{disabled: errors != null && errors.length > 0, onClick: () => onFinish(data)}}>
        <JinjatForm data={data} schema={jinjatSchema.schema} onChange={setData} onError={setErrors}/>
    </Create>
}