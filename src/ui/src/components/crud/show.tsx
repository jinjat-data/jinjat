import React from "react";
import {HttpError, IResourceComponentsProps, useResource, useShow} from "@refinedev/core";
import {Show} from "@refinedev/mui";
import {JinjatForm} from "src/jsonforms/JinjatForm";
import {Type, useSchema} from "@components/hooks/useSchema";
import {JsonSchema} from "@jsonforms/core";
import {JinjatListProps} from "@components/crud/utils";

export const JinjatShow: React.FC<JinjatListProps> = ({packageName}) => {
    const {queryResult} = useShow();
    let analysis = resource?.meta?.jinjat.resources.show;

    let resource = `${packageName}.${analysis}`;
    const {data: schema, isLoading: isSchemaLoading, isError} = useSchema<JsonSchema, HttpError>({
        resource: resource,
        config: {type: Type.RESPONSE}
    })

    if (isSchemaLoading) {
        return <div>Loading...</div>;
    } else
    if(schema == null) {
        return <div>Unable to find the schema...</div>;
    }

    if (isError) {
        return <div>Something went wrong!</div>;
    }

    const {data, isLoading} = queryResult;

    if(data == null) {
        return <div>Can't see the result :(</div>;
    }

    return (
        <Show isLoading={isLoading}>
            <JinjatForm data={data.data} schema={schema} readonly/>
        </Show>
    );
}