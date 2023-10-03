import React, {useEffect, useState} from "react";
// @ts-ignore
import MDX from '@mdx-js/runtime'
import {useJinjatProvider} from "@components/hooks/useSchemaProvider";
import {DocFile} from "@components/hooks/schema";

export type MdxRendererProps = {
    path: string;
};

const components = {}

const scope = {
    some: 'value'
}

export const MdxRenderer = () => {
    const [doc, setDoc] = useState<DocFile>()
    const schemaProvider = useJinjatProvider();

    useEffect(() => {
        schemaProvider.getReadme().then(module => {
            setDoc(module)
        }).catch(err => {
            console.log(err)
            setDoc(undefined)
        })
    }, [])

    if (doc == null) {
        return <div>Loading..</div>
    }

    return (
        <MDX components={components} scope={scope}>
            {doc.content}
        </MDX>
    );
}