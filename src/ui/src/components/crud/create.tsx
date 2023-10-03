import React, {useState} from "react";
import {HttpError, useForm} from "@refinedev/core";
import {Create} from "@refinedev/mui";
import {Type, useSchema} from "@components/hooks/useSchema";
import {JsonSchema} from "@jsonforms/core";
import {JinjatForm} from "src/jsonforms/JinjatForm";
import {ErrorObject} from "ajv";
import {JinjatFormProps} from "@components/crud/utils";

export const JinjatCreate: React.FC<JinjatFormProps> = ({packageName, analysis}) => {
    const { formLoading, onFinish } = useForm();

    const [data, setData] = useState<object>({})
    const [errors, setErrors] = useState<ErrorObject[] | null>(null)

    let resource = `${packageName}.${analysis}`;
    const {data: schema, isLoading, error} = useSchema<JsonSchema, HttpError>({
        resource: resource,
        config: {type: Type.REQUEST}
    })

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error != null) {
        return <div>Something went wrong! {error.message}</div>;
    }

    if(schema == null) {
        return <div>Schema not found!</div>;
    }

    // @ts-ignore
    let pkColumn = schema['x-pk'];
    if(pkColumn != null && schema?.properties != null) {
        delete schema.properties[pkColumn]
    }



    return <Create isLoading={formLoading} saveButtonProps={{disabled: errors != null && errors.length > 0, onClick: () => onFinish(data)}}>
        <JinjatForm data={data} schema={schema} onChange={setData} onError={setErrors}/>
    </Create>
}