import React, {ReactNode, useEffect, useState} from "react";
import {useJinjatProvider} from "@components/hooks/useSchemaProvider";
import {DocFile} from "@components/hooks/schema";
import {MDXRemoteSerializeResult} from 'next-mdx-remote'
import {useQuery} from "@tanstack/react-query";
import {
    Alert,
    AlertTitle,
    Box, Divider as MuiDivider, ListItem,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableProps,
    TableRow,
    Typography
} from "@mui/material";
import {fromMarkdown} from 'mdast-util-from-markdown'
import {mdxJsx} from "micromark-extension-mdx-jsx";
import {mdxJsxFromMarkdown} from "mdast-util-mdx-jsx";
import Markdoc, {nodes} from '@markdoc/markdoc';
import {transformer} from '@markdoc/markdoc';


import {JinjatFormProps} from "@components/crud/utils";
import * as markdocConfig from "@components/notebook/markdoc";


// const appHost = { isPreview: false, isCustomServer: false };

// export interface CreateRuntimeStateParams {
//     dom: appDom.AppDom;
// }
//
// export default function createRuntimeState({ dom }: CreateRuntimeStateParams) {
//     return {
//         dom: appDom.createRenderTree(dom),
//     };
// }

// function renderPage(
//     initPage: (dom: appDom.AppDom, page: appDom.PageNode) => appDom.AppDom,
//     canvasEvents: Emitter<RuntimeEvents> | null = null,
// ) {
//     let dom = appDom.createDom();
//     const root = appDom.getNode(dom, dom.root, 'app');
//     const page = appDom.createNode(dom, 'page', {
//         name: 'thePage',
//         attributes: {
//             title: '',
//         },
//     });
//     dom = appDom.addNode(dom, page, root, 'pages');
//
//     dom = initPage(dom, page);
//
//     const initialState = createRuntimeState({ dom });
//
//     return init({initialState});
// }

// const tree = fromMarkdown('# Hello world!', {
//     extensions: [mdxJsx()],
//     mdastExtensions: [mdxJsxFromMarkdown()]
// })


export const JinjatNotebook: React.FC<JinjatFormProps> = ({packageName, resources, title, logo, ...props}) => {
    const [doc, setDoc] = useState<DocFile>()
    const schemaProvider = useJinjatProvider();
    // const scope = {
    //     createState: createState,
    //     value: 42,
    //     value1: 1,
    //     key3: {nestedKey: "nestedValue"},
    // };

    const analysis = resources.create as string;
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

    const {
        error: componentError,
        data: component,
    } = useQuery<MDXRemoteSerializeResult, Error>({
        queryKey: ['notebook', packageName, analysis],
        enabled: doc != null,
        queryFn: () => fromMarkdown(doc!!.content, {
            extensions: [mdxJsx()],
            mdastExtensions: [mdxJsxFromMarkdown()]
        })
    })


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

    if (component == null) {
        if (componentError == null) {
            return <div>Rendering..</div>
        } else {
            return <div>{componentError.message}</div>
        }
    }

    const ast = Markdoc.parse(doc.content);
    const content = Markdoc.transform(ast, {nodes: markdocConfig.jinjatNodes, tags: markdocConfig.tags, variables: {}, functions: {}, partials: {}});
    let react = Markdoc.renderers.react(content, React, {components: markdocConfig.components});
    return react;

    // return renderPage((dom, page) => {
    //     const text = appDom.createNode(dom, 'element', {
    //         attributes: { component: 'Text' },
    //         props: { value: 'Hello World' },
    //     });
    //     dom = appDom.addNode(dom, text, page, 'children');
    //
    //     return dom;
    // });

    // return (
    //     <ErrorBoundary FallbackComponent={fallbackRender}>
    //         <MDXRemote
    //             {...component}
    //             components={allComponents}
    //             lazy={false}
    //         />
    //     </ErrorBoundary>
    // );
}