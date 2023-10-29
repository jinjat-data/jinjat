import React from "react";
import {HttpError, IResourceComponentsProps, useResource, useShow} from "@refinedev/core";
import {Show} from "@refinedev/mui";
import {JinjatForm} from "src/jsonforms/JinjatForm";
import {Type, useSchema} from "@components/hooks/useSchema";
import {JsonSchema} from "@jsonforms/core";
import {JinjatListProps} from "@components/crud/utils";
import JinjatAnalysisForm from "../../jsonforms/JinjatAnalysisForm";


export const JinjatShow: React.FC<JinjatListProps> = ({packageName, version, resources, params}) => {
    let analysis = resources.show;
    const {data: jinjatSchema, isLoading: isSchemaLoading, error: schemaError} = useSchema<JsonSchema, HttpError>({
        analysis: `${packageName}.${analysis}`,
        config: {type: Type.RESPONSE}
    })

    const {queryResult} = useShow({resource: `_analysis/${packageName}.${resources.show}`, id: params});

    if (schemaError != null) {
        return <div>Something went wrong {schemaError}!</div>;
    }
    if (isSchemaLoading) {
        return <div>Loading schema...</div>;
    }
    if (jinjatSchema == null) {
        return <div>Unable to find the schema...</div>;
    }

    const {data, error: dataError, isLoading: isDataLoading} = queryResult;

    return (
        <Show isLoading={isDataLoading} mt={10}>
            <JinjatAnalysisForm parameters={jinjatSchema.parameters} action={"show"}/>
            {data != null ? <JinjatForm data={data?.data} schema={jinjatSchema.schema} readonly/> :
                dataError != null ? <div>{dataError}</div> :
                    isDataLoading && params != null ? <div>loading..</div> :
                        null}
        </Show>
    );
}