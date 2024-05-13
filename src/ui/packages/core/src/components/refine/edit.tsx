import React, { useEffect, useState } from "react";
import { HttpError, useForm } from "@refinedev/core";
import { Edit } from "@refinedev/mui";
import { JinjatForm } from "src/jsonforms/JinjatForm";
import { Type, useSchema } from "@components/hooks/useSchema";
import { JsonSchema } from "@jsonforms/core";
import { ErrorObject } from "ajv";
import { JinjatFormProps } from "@components/refine/utils";
import JinjatAnalysisForm from "../../jsonforms/JinjatAnalysisForm";

export const JinjatEdit: React.FC<JinjatFormProps> = ({
    packageName,
    title,
    resources,
    params,
}) => {
    const showResource = `_analysis/${packageName}.${resources.show}`;
    const { queryResult, formLoading, onFinish } = useForm({
        resource: showResource,
        id: params,
    });

    const [errors, setErrors] = useState<ErrorObject[] | null>(null);

    const resource = `${packageName}.${resources.edit}`;
    const {
        data: jinjatSchema,
        isLoading: isLoadingSchema,
        isError,
    } = useSchema<JsonSchema, HttpError>({
        analysis: resource,
        config: { type: Type.REQUEST },
    });

    useEffect(() => {
        const pkColumn = jinjatSchema?.schema["x-pk"];
        if (pkColumn != null && jinjatSchema?.schema.properties != null) {
            // @ts-ignore
            jinjatSchema.schema.properties[pkColumn].readOnly = true;
        }
    }, []);

    if (isLoadingSchema) {
        return <div>Loading schema...</div>;
    }

    if (isError || !jinjatSchema) {
        return <div>Something went wrong!</div>;
    }

    if (queryResult == null) {
        return <div>Data not found!</div>;
    }

    const { data, isLoading, isError : isDataError } = queryResult;

    if (data == null || !isDataError) {
        return <div>Something went wrong!</div>;
    }

    return (
        <Edit
            title={title}
            resource={showResource}
            recordItemId={params}
            isLoading={isLoading}
            saveButtonProps={{
                disabled: errors != null && errors.length > 0,
                onClick: () => onFinish(data),
            }}
        >
            {jinjatSchema.parameters?.length > 0 ? (
                <JinjatAnalysisForm
                    parameters={jinjatSchema.parameters}
                    action={"edit"}
                />
            ) : (
                <div />
            )}
            <JinjatForm
                data={data.data}
                schema={jinjatSchema.schema}
                onError={setErrors}
            />
        </Edit>
    );
};
