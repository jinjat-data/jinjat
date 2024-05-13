import React from "react";
import {HttpError, IResourceComponentsProps, useResource, useShow} from "@refinedev/core";
import {Show} from "@refinedev/mui";
import {JinjatForm} from "src/jsonforms/JinjatForm";
import {Type, useSchema} from "@components/hooks/useSchema";
import {JsonSchema} from "@jsonforms/core";
import {JinjatListProps} from "@components/crud/utils";
import JinjatAnalysisForm from "../../jsonforms/JinjatAnalysisForm";
import {Skeleton} from "@mui/material";
import {QueryErrorComponent} from "@components/common/queryError";


export const JinjatShow: React.FC<JinjatListProps> = ({packageName, version, resources, params}) => {
    let analysis = resources.show;
    let analysisReference = `${packageName}.${analysis}`;
    const {data: jinjatSchema, isLoading: isSchemaLoading, error: schemaError} = useSchema<JsonSchema, HttpError>({
        analysis: analysisReference,
        config: {type: Type.RESPONSE}
    })

    const {queryResult} = useShow({resource: `_analysis/${packageName}.${resources.show}`, id: params});
    const {data, error: dataError, isLoading: isDataLoading} = queryResult;

    if (isSchemaLoading || isDataLoading) {
        return <Skeleton height={50}/>;
    }

    if (schemaError != null) {
        return <div> Something went wrong {schemaError.message}! </div>;
    }


    if (dataError != null) {
        // @ts-ignore
        return <QueryErrorComponent message={`Unable fetching ${analysisReference}`} errors={dataError.response.data.errors}/>
    }

    return (
        <Show isLoading={isDataLoading}>
            <JinjatAnalysisForm parameters={jinjatSchema.parameters || []} action={"show"}/>
            <JinjatForm data={data?.data} schema={jinjatSchema.schema} readonly/>
        </Show>
    );
}