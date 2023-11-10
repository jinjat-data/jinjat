import React, {useState} from "react";
import {HttpError, IResourceComponentsProps, useForm, useResource, useShow} from "@refinedev/core";
import { Edit } from "@refinedev/mui";
import {JinjatForm} from "src/jsonforms/JinjatForm";
import {Type, useSchema} from "@components/hooks/useSchema";
import {JsonSchema} from "@jsonforms/core";
import {ErrorObject} from "ajv";
import {JinjatFormProps} from "@components/crud/utils";
import JinjatAnalysisForm from "../../jsonforms/JinjatAnalysisForm";

export const JinjatEdit: React.FC<JinjatFormProps> = ({packageName, version, resources, params}) => {
    const {queryResult} = useShow({resource: `_analysis/${packageName}.${resources.show}`, id: params});
    console.log(queryResult)
    const [errors, setErrors] = useState<ErrorObject[] | null>(null)
    const { formLoading, onFinish } = useForm();

    let resource = `${packageName}.${resources.edit}`;
    const {data: jinjatSchema, isLoading : isLoadingSchema, isError} = useSchema<JsonSchema, HttpError>({
        analysis: resource,
        config: {type: Type.REQUEST},
    })

    if (isLoadingSchema) {
        return <div>Loading schema...</div>;
    }

    if (isError || !jinjatSchema) {
        return <div>Something went wrong!</div>;
    }

    // // @ts-ignore
    // let pkColumn = jinjatSchema.schema['x-pk'];
    // if(pkColumn != null && jinjatSchema?.schema.properties != null) {
    //     // @ts-ignore
    //    jinjatSchema.schema.properties[pkColumn].readOnly = true
    // }

    const {data, isLoading} = queryResult;

    if (data == null) {
        return <div>Data not found!</div>;
    }

    return (
        <Edit isLoading={isLoading || formLoading} saveButtonProps={{disabled: errors != null && errors.length > 0, onClick: () => onFinish(data)}}>
            <JinjatAnalysisForm parameters={jinjatSchema.parameters} action={"edit"}/>
            <JinjatForm data={data.data} schema={jinjatSchema.schema} onError={setErrors}/>
        </Edit>
    );
}