import allChartComponents from "@components/chart";
import {
    Box, Card, CardContent, CardHeader, darken,
    Divider as MuiDivider,
    Link, Palette, Slider,
    Table,
    TableBody,
    TableCell,
    TableFooter, TableHead,
    TableProps, TableRow,
    Typography,
    Paper,
    Unstable_Grid2 as Grid,
} from "@mui/material";
import React, {ReactNode} from "react";
import BarsArrowUpIcon from "@heroicons/react/24/outline/BarsArrowUpIcon";
import ListBulletIcon from "@heroicons/react/24/outline/ListBulletIcon";
import Bars3Icon from "@heroicons/react/24/solid/Bars3Icon";
import RectangleGroupIcon from "@heroicons/react/24/outline/RectangleGroupIcon";
import FolderIcon from "@heroicons/react/24/outline/FolderIcon";
import DocumentChartBarIcon from "@heroicons/react/24/outline/DocumentChartBarIcon";
import {JinjatResource} from "@components/hooks/schema";
import WindowIcon from "@heroicons/react/24/outline/WindowIcon";
import {JinjatCreate} from "@components/refine/create";
import {JinjatShow} from "@components/refine/show";
import {JinjatEdit} from "@components/refine/edit";
import {JinjatList} from "@components/refine/list";
import {JinjatNotebook} from "@components/JinjatNotebook";
import _ from "lodash";
import AllHeroIcons from "@heroicons/react/24/outline"

export const getScrollbarStyles = (palette: Palette) => ({
    '::-webkit-scrollbar': {
        width: '8px',
        height: '6px',
    },
    '::-webkit-scrollbar-track': {
        background:
            palette.mode === 'dark'
                ? palette.background.default
                : palette.background.paper,
        borderRadius: '8px',
        overflow: 'hidden',
    },
    '::-webkit-scrollbar-thumb': {
        background: darken(palette.background.default, 0.05),
        borderRadius: '8px',
    },
});

export const jinjatMuiComponents: { [key: string]: (props: React.PropsWithChildren<any>) => React.ReactElement | null } = {
    a: props => <Link {...props} />,
    h1: (props) => <Typography variant={"h1"} {...props} />,
    h2: props => <Typography variant={"h2"} {...props} />,
    h3: props => <Typography variant={"h3"} {...props} />,
    h4: props => <Typography variant={"h4"} {...props} />,
    h5: props => <Typography variant={"h5"} {...props} />,
    heading: props => <Typography variant={props.level} {...props} />,
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
    Grid,
    Paper,
    Box, Card, CardHeader, CardContent,
    Slider,
    Blockquote: Box
};

export const allComponents = {...jinjatMuiComponents, ...allChartComponents}


const exposureIcons: { [key: string]: React.ComponentType<any> } = {
    "create": BarsArrowUpIcon,
    "list": ListBulletIcon,
    "show": Bars3Icon,
    "dashboard": RectangleGroupIcon,
    "application": FolderIcon,
    "notebook": DocumentChartBarIcon,
}

export const actions: { [key: string]: React.ComponentType<any> } = {
    "create": JinjatCreate,
    "show": JinjatShow,
    "edit": JinjatEdit,
    "list": JinjatList,
    "notebook": JinjatNotebook,
}

export function getIconForKeyword(value: string, fallbackComponent = WindowIcon): ReactNode | undefined {
    const Icon = exposureIcons[value];
    return <Icon/>;
}


export function getIconForResource(resource: JinjatResource): ReactNode | undefined {
    const menuIcon = resource.jinjat.refine.menu_icon;
    if (menuIcon?.startsWith('heroicons/')) {
        const suffix = _.camelCase(menuIcon?.substring('heroicons/'.length));
        const capitalizedSuffix = suffix.charAt(0).toUpperCase() + suffix.slice(1) + 'Icon'
        // @ts-ignore
        let Component = AllHeroIcons[capitalizedSuffix]
        if (Component == null) {
            console.error(`Unable to find icon ${menuIcon}`)
            Component = AllHeroIcons.QuestionMarkCircleIcon
        }
        return <Component/>
    }
    return getIconForKeyword(resource?.jinjat?.refine?.layout || resource.type, WindowIcon);
}
