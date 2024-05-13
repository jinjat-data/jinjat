import {HorizontalLayout} from "@jsonforms/core/src/models/uischema";
import {Node, nodes, Tag, transformer} from "@markdoc/markdoc";
import {ControlElement} from "@jsonforms/core";
import {JinjatCreate} from "@components/crud/create";
import {
    Box,
    Divider as MuiDivider,
    ListItem,
    Table,
    TableBody, TableCell,
    TableHead,
    TableProps,
    TableRow,
    Typography
} from "@mui/material";
import List from "@mui/material/List";
import {actions, getScrollbarStyles} from "../../interfaces/createComponents";
import Link from "next/link";
import Head from "next/head";
import Image from "next/image";
import Script from "next/script";
import React from "react";
import {useRouter} from "next/router";
import {useResource} from "@refinedev/core";
import {JinjatFormProps} from "@components/crud/utils";

export const jinjatNodes = {
    heading: {
        attributes: {
            level: {type: Number, render: true, required: true},
        },
        render: (props) => <Typography variant={'h' + props.level} {...props} />
    },
    paragraph: {
        ...nodes.paragraph,
    },
    hr: {
        ...nodes.hr,
        render: props => <MuiDivider {...props} />
    },
    fence: {
        ...nodes.fence,
    },
    blockquote: {
        ...nodes.blockquote,
    },
    list: {
        ...nodes.list,
        render: props => <List {...props} />
    },
    item: {
        ...nodes.item,
        render: props => <ListItem {...props} />
    },
    table: {
        ...nodes.table,
        render: (props: TableProps) => {
            const {children, sx, ...otherProps} = props;

            return (
                <Box
                    sx={
                        sx
                            ? sx
                            : ({palette}) => ({
                                overflow: 'auto',
                                ...getScrollbarStyles(palette),
                            })
                    }
                >
                    <Table {...otherProps}>{children}</Table>
                </Box>
            );
        }
    },
    thead: {
        ...nodes.thead,
        render: props => <TableHead {...props} />
    },
    tbody: {
        ...nodes.tbody,
        render: props => <TableBody {...props} />
    },
    tr: {
        ...nodes.tr,
        render: props => <TableRow {...props} />
    },
    td: {
        ...nodes.td,
        render: props => <TableCell {...props} />

    },
    th: {
        ...nodes.th,
        render: props => <TableCell {...props} />
    },
    inline: {
        ...nodes.inline,
    },
    strong: {
        ...nodes.strong,
    },
    em: {
        ...nodes.em,
    },
    s: {
        ...nodes.s,
    },
    link: {
        render: Link,
        description: 'Displays a Next.js link',
        attributes: {
            href: {
                description: 'The path or URL to navigate to.',
                type: String,
                errorLevel: 'critical',
                required: true,
            },
            as: {
                description:
                    'Optional decorator for the path that will be shown in the browser URL bar.',
                type: String,
            },
            passHref: {
                description: 'Forces Link to send the href property to its child.',
                type: Boolean,
                default: false,
            },
            prefetch: {
                description: 'Prefetch the page in the background.',
                type: Boolean,
            },
            replace: {
                description:
                    'Replace the current history state instead of adding a new url into the stack.',
                type: Boolean,
                default: false,
            },
            scroll: {
                description: 'Scroll to the top of the page after a navigation.',
                type: Boolean,
                default: true,
            },
            shallow: {
                description:
                    'Update the path of the current page without rerunning getStaticProps, getServerSideProps or getInitialProps.',
                type: Boolean,
                default: true,
            },
            locale: {
                description: 'The active locale is automatically prepended.',
                type: Boolean,
            },
        },
    },
    code: {
        attributes: {
            content: {type: String, render: true, required: true},
        },
        render: (props) => {
            return <Box component="pre" sx={{display: 'inline'}}>{props.content}</Box>
        }
    },
    text: nodes.text,
    hardbreak: nodes.hardbreak,
    softbreak: nodes.softbreak,
    error: nodes.error,
    comment: {
        description: 'Use to comment the content itself',
        attributes: {},
        transform() {
            return [];
        },
    },
    head: {
        render: Head,
        description: 'Renders a Next.js head tag',
        attributes: {},
    },
    image: {
        render: (props) => {
            if (!props.width && !props.height) {
                return <img {...props} />
            } else {
                return <Image fill={!props.width && !props.height} {...props} />
            }
        },
        description: 'Renders a Next.js image tag',
        // https://nextjs.org/docs/app/api-reference/components/image
        attributes: {
            src: {
                type: String,
                required: true,
            },
            alt: {
                type: String,
            },
            width: {
                type: Number,
            },
            height: {
                type: Number,
            },
            fill: {
                type: Boolean,
            },
            sizes: {
                type: String,
            },
            quality: {
                type: Number,
            },
            priority: {
                type: Boolean,
            },
            placeholder: {
                type: String,
                matches: ['blur', 'empty'],
            },
            loading: {
                type: String,
                matches: ['lazy', 'eager'],
            },
            blurDataURL: {
                type: String,
            },
        },
    },
    script: {
        render: Script,
        description: 'Renders a Next.js script tag',
        attributes: {
            src: {
                type: String,
                errorLevel: 'critical',
                required: true,
            },
            strategy: {
                type: String,
                matches: ['beforeInteractive', 'afterInteractive', 'lazyOnload'],
            },
        },
    },
};

export type ResourceProps = {
    Component: React.ReactNode,
    props: Map<string, any>
}
const NodeWithResource: React.FC<ResourceProps> = ({Component, props}) => {
    const router = useRouter()
    let {exposure} = router.query
    const spread = typeof exposure == "string" ? [exposure] : exposure
    let [package_name, version, name, action, id] = spread
    const {resource} = useResource(`exposure.${package_name}.${name}`);
    let resources = resource?.meta?.jinjat?.refine?.resources;

    // @ts-ignore
    return <Component packageName={package_name}
                      resources={resources}
                      action={action}
                      exposure={name}
                      params={id}
                      version={version}
                      {...props}/>
}

export const tags = {
    create: {
        render: NodeWithResource,
        attributes: {
            type: {type: String}
        },
        transform(node, config) {
            const uiSchema: HorizontalLayout = {type: 'HorizontalLayout', elements: []}
            node.children
                .filter(item => item.tag != null)
                .forEach((item: Node) => {
                    if (item.tag === "control") {
                        uiSchema.elements.push({type: 'Control', scope: item.attributes.ref} as ControlElement)
                        item.attributes.ref = item.attributes.label;
                    } else if (item.tag === "if") {
                        let firstAnnotation = item.annotations[0];

                        if (item.annotations.length != 1 || firstAnnotation.constructor.name != 'Function2'
                            && firstAnnotation.type != 'attribute'
                            && firstAnnotation.value.parameters[0].name != 'matches') {
                            throw new Error("Invalid if tag. You can only use `matches` function")
                        }

                        const parameters = firstAnnotation.value.parameters

                        item.children.forEach((child) => {
                            if (child.tag === "control") {
                                uiSchema.elements.push({
                                    type: 'Control', scope: child.attributes.ref, rule: {
                                        effect: 'SHOW', condition: {
                                            scope: parameters[0],
                                            schema: parameters[1]
                                        }
                                    }
                                } as ControlElement)
                            } else {
                                throw new Error("Invalid tag in if. Only control is allowed.")
                            }
                        })
                    } else {
                        throw new Error("Invalid tag in form. Only control and if are allowed.")
                    }
                })

            // @ts-ignore
            return new Tag(NodeWithResource, {
                Component: actions[node.tag],
                props: {uiSchema}
            }, node.transformChildren(config));
        }
    },
    switch: {
        attributes: {primary: {render: false}},
        transform(node, config) {
            const attributes = node.transformAttributes(config);

            const child = node.children.find(
                (child) => child.attributes.primary === attributes.primary
            );

            return child ? transformer.node(child, config) : [];
        }
    },
    case: {
        attributes: {primary: {render: false}}
    }
}

export const components = Object.keys(tags).reduce(function (result, key) {
    result[key] = tags[key].render
    return result
}, {})