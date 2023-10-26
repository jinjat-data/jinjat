import React from "react";
import {HttpError, IResourceComponentsProps, useResource, useShow} from "@refinedev/core";
import {Show} from "@refinedev/mui";
import {JinjatForm} from "src/jsonforms/JinjatForm";
import {Type, useSchema} from "@components/hooks/useSchema";
import {JsonSchema} from "@jsonforms/core";
import {JinjatListProps} from "@components/crud/utils";
import JinjatUrlParamsForm from "../../jsonforms/JInjatUrlParamsForm";
import JinjatAnalysisForm from "../../jsonforms/JinjatAnalysisForm";

const aa = {
    "type": "object",
    properties: {
        "aa": {
            "type": "string",
            "enum": ["test", "mest"]
        }
    }
}
export const JinjatShow: React.FC<JinjatListProps> = ({packageName, version, resources, params}) => {
    const {queryResult} = useShow({resource: `_analysis/${packageName}.${resources.show}`, id: params});

    let analysis = resources.show;
    const {data: jinjatSchema, isLoading: isSchemaLoading, isError} = useSchema<JsonSchema, HttpError>({
        analysis: `${packageName}.${analysis}`,
        config: {type: Type.RESPONSE}
    })

    if (isSchemaLoading) {
        return <div>Loading...</div>;
    } else if (jinjatSchema == null) {
        return <div>Unable to find the schema...</div>;
    }

    if (isError) {
        return <div>Something went wrong!</div>;
    }

    const {data, isLoading} = queryResult;

    console.log(data, isLoading)
    return (
        <Show isLoading={isLoading}>
            <JinjatAnalysisForm parameters={jinjatSchema.parameters}/>
            {!isLoading ? <JinjatForm data={data?.data} schema={jinjatSchema.schema} readonly/> : <div>loading..</div>}
        </Show>
    );
}