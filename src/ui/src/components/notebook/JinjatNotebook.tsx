import React, {useEffect, useState} from "react";
import {useJinjatProvider} from "@components/hooks/useSchemaProvider";
import {DocFile} from "@components/hooks/schema";
import {JinjatNotebookProps} from "@components/crud/utils";
import {allComponents} from "../../interfaces/createComponents";
import {serialize} from 'next-mdx-remote/serialize'
import {MDXRemote, MDXRemoteSerializeResult} from 'next-mdx-remote'
import {createState} from "mdx-state";
import {useQuery} from "@tanstack/react-query";
import {Alert, AlertTitle} from "@mui/material";
import {ErrorBoundary} from "react-error-boundary";

export const JinjatNotebook: React.FC<JinjatNotebookProps> = ({packageName, analysis}) => {
    const [doc, setDoc] = useState<DocFile>()
    const schemaProvider = useJinjatProvider();
    const scope = {
        createState: createState,
        value: 42,
        value1: 1,
        key3: {nestedKey: "nestedValue"},
    };

    let promise: Promise<DocFile>
    if (analysis == null) {
        promise = schemaProvider.getReadme()
    } else {
        promise = schemaProvider.getNotebook({packageName, analysis: analysis})
    }

    useEffect(() => {
        promise.then(module => {
            setDoc(module)
        }).catch(err => {
            setDoc(undefined)
        })
    }, [])

    const {
        error : componentError,
        data: component,
    } = useQuery<MDXRemoteSerializeResult, Error>({
        queryKey: ['notebook', packageName, analysis],
        enabled: doc != null,
        queryFn: () => serialize(doc!!.content, {
            mdxOptions: {
                development: true,
                useDynamicImport: true,
                remarkPlugins: []
            },
            parseFrontmatter: true,
            scope: scope
        })
    })


    // @ts-ignore
    function fallbackRender({ error, resetErrorBoundary }) {
        return (
            <Alert severity="error">
                <AlertTitle>Unable to render MDX</AlertTitle>
                {error.message}
            </Alert>
        );
    }

    if (doc == null) {
        return <div>Loading..</div>
    }

    if (component == null) {
        if(componentError == null) {
            return <div>Rendering..</div>
        } else {
            return <div>{componentError.message}</div>
        }
    }


    return (
        <ErrorBoundary FallbackComponent={fallbackRender}>
            <MDXRemote
                {...component}
                components={allComponents}
                lazy={false}
            />
        </ErrorBoundary>
    );
}