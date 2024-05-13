import React, {ReactElement, ReactNode, useEffect, useState} from "react";
import {useJinjatProvider} from "@components/hooks/useSchemaProvider";
import {DocFile} from "@components/hooks/schema";
import {useQuery} from "@tanstack/react-query";
import {
    Alert,
    AlertTitle
} from "@mui/material";
import Markdoc from '@markdoc/markdoc';

import {JinjatFormProps} from "@components/crud/utils";
import * as markdocConfig from "@components/notebook/markdoc";


export const JinjatNotebook: React.FC<JinjatFormProps> = ({packageName, resources, title, logo, ...props}) => {
    const [doc, setDoc] = useState<DocFile>()
    const schemaProvider = useJinjatProvider();

    // const analysis = resources.create as string;
    const analysis = 'create';
    let promise: Promise<DocFile>
    if (analysis == null) {
        promise = schemaProvider.getReadme()
    } else {
        promise = schemaProvider.getNotebook({packageName, analysis})
    }

    useEffect(() => {
        promise.then(module => {
            setDoc(module)
        }).catch(err => {
            setDoc(undefined)
        })
    }, [])


    // @ts-ignore
    function fallbackRender({error, resetErrorBoundary}) {
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

    const ast = Markdoc.parse(doc.content);
    // @ts-ignore
    const content = Markdoc.transform(ast, {nodes: markdocConfig.jinjatNodes, tags: markdocConfig.tags, variables: {}, functions: {}, partials: {}});
    let react = Markdoc.renderers.react(content, React, {components: markdocConfig.components});
    return react as ReactElement;
}