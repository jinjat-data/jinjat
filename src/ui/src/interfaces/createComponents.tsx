import {JinjatECharts} from "@components/chart/JinjatECharts";
import {
    Box, Card, CardContent, CardHeader,
    Divider as MuiDivider,
    Link, Slider,
    Table,
    TableBody,
    TableCell,
    TableFooter, TableHead,
    TableProps, TableRow,
    Typography
} from "@mui/material";
import {getScrollbarStyles} from "@components/chart/utils";
import Grid from "@mui/material/Unstable_Grid2";
import Paper from "@mui/material/Paper";
import React, {Component, ReactNode} from "react";
import BarsArrowUpIcon from "@heroicons/react/24/outline/BarsArrowUpIcon";
import ListBulletIcon from "@heroicons/react/24/outline/ListBulletIcon";
import Bars3Icon from "@heroicons/react/24/solid/Bars3Icon";
import RectangleGroupIcon from "@heroicons/react/24/outline/RectangleGroupIcon";
import FolderIcon from "@heroicons/react/24/outline/FolderIcon";
import DocumentChartBarIcon from "@heroicons/react/24/outline/DocumentChartBarIcon";
import {JinjatResource} from "@components/hooks/schema";
import WindowIcon from "@heroicons/react/24/outline/WindowIcon";
import {Observe} from "mdx-state";

export const muiComponents = {
    a: props => <Link {...props} />,
    h1: props => <Typography variant={"h1"} {...props} />,
    h2: props => <Typography variant={"h2"} {...props} />,
    h3: props => <Typography variant={"h3"} {...props} />,
    h4: props => <Typography variant={"h4"} {...props} />,
    h5: props => <Typography variant={"h5"} {...props} />,
    blockquote: props => <Box
        component='blockquote'
        dir='auto'
        sx={{
            borderInlineStart: '3px solid',
            paddingInlineStart: '1.5rem',
            borderColor: 'text.secondary',
            m: '0.25rem 0',
        }}
    >
        {props.children}
    </Box>,
    hr: props => <MuiDivider {...props} />,
    TableWrapper: (props: TableProps) => {
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
    },
    tbody: props => <TableBody {...props} />,
    td: props => <TableCell {...props} />,
    th: props => <TableCell {...props} />,
    tfoot: props => <TableFooter {...props} />,
    thead: props => <TableHead {...props} />,
    tr: props => <TableRow {...props} />,
    // pre: props => <PreBlock {...props} />,
    Grid: Grid,
    Paper: Paper,
    Box, Card, CardHeader, CardContent,
    Slider,
    Blockquote: Box
};
export const jinjatComponents = {ECharts: JinjatECharts, Observe};

type GenericObject = { [key: string]: any };
export const allComponents : GenericObject =  {...muiComponents, ...jinjatComponents}


const allComponentNames = Object.keys(allComponents)

export function findComponentByName(name: string): any {
    const componentName = allComponentNames.find(name => name.toLowerCase() === name.toLowerCase());
    return allComponents[componentName!!]
}

const exposureIcons = {
    "create": BarsArrowUpIcon,
    "list": ListBulletIcon,
    "show": Bars3Icon,
    "dashboard": RectangleGroupIcon,
    "application": FolderIcon,
    "notebook": DocumentChartBarIcon,
}

export function getIconForResource(resource: JinjatResource): ReactNode | undefined {
    // @ts-ignore
    let Icon = exposureIcons[resource?.jinjat?.refine?.layout || resource.type] || WindowIcon;
    return <Icon/>;
}