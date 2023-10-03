import React, {useState} from "react";
import {HttpError, IResourceComponentsProps, useForm, useResource, useShow} from "@refinedev/core";
import { Edit } from "@refinedev/mui";
import {JinjatForm} from "src/jsonforms/JinjatForm";
import {Type, useSchema} from "@components/hooks/useSchema";
import {JsonSchema} from "@jsonforms/core";
import {ErrorObject} from "ajv";

export const JinjatEdit: React.FC<IResourceComponentsProps> = () => {
    const {resource} = useResource();
    let analysis = resource?.meta?.jinjat.resources.edit;
    const {queryResult} = useShow();
    const [errors, setErrors] = useState<ErrorObject[] | null>(null)
    const { formLoading, onFinish } = useForm();

    const {data: schema, isLoading : isLoadingSchema, isError} = useSchema<JsonSchema, HttpError>({
        resource: analysis,
        config: {type: Type.REQUEST}
    })

    if (isLoadingSchema) {
        return <div>Loading schema...</div>;
    }

    if (isError || !schema) {
        return <div>Something went wrong!</div>;
    }

    // @ts-ignore
    let pkColumn = schema['x-pk'];
    if(pkColumn != null && schema?.properties != null) {
        // @ts-ignore
       schema.properties[pkColumn].readOnly = true
    }

    const {data, isLoading} = queryResult;

    if (data == null) {
        return <div>Data not found!</div>;
    }

    return (
        <Edit isLoading={isLoading || formLoading} saveButtonProps={{disabled: errors != null && errors.length > 0, onClick: () => onFinish(data)}}>
            <JinjatForm data={data.data} schema={schema} onError={setErrors}/>
        </Edit>
    );
}