import React, {CSSProperties, useState} from "react";
import {
    CanAccess,
    ITreeMenu,
    useIsExistAuthentication,
    useLogout,
    useTitle,
    useTranslate,
    useRouterContext,
    useRouterType,
    useLink,
    useMenu,
    useRefineContext,
    useActiveAuthProvider,
    pickNotDeprecated,
    useWarnAboutChange,
} from "@refinedev/core";
import {
    useThemedLayoutContext,
} from "@refinedev/mui";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import Dashboard from "@mui/icons-material/Dashboard";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import ListOutlined from "@mui/icons-material/ListOutlined";
import Logout from "@mui/icons-material/Logout";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Tooltip from "@mui/material/Tooltip";
import type {RefineThemedLayoutV2SiderProps} from "@refinedev/mui";
import {defaultIcon, defaultText, ThemedTitleV2} from "@components/layout/title";
import NextLink from "next/link";
import {Button, ButtonBase, Divider, NativeSelect, Stack, SvgIcon, Typography} from "@mui/material";
import ChevronUpDownIcon from "@heroicons/react/24/solid/ChevronUpDownIcon";
import {items} from "../../devias/layouts/dashboard/config";
import {SideNavItem} from "../../devias/layouts/dashboard/side-nav-item";
import ArrowTopRightOnSquareIcon from "@heroicons/react/24/solid/ArrowTopRightOnSquareIcon";

export const ThemedSiderV2: React.FC<RefineThemedLayoutV2SiderProps> = ({
                                                                            Title: TitleFromProps,
                                                                            render,
                                                                            meta,
                                                                            activeItemDisabled = false,
                                                                        }) => {
    const {
        siderCollapsed,
        setSiderCollapsed,
        mobileSiderOpen,
        setMobileSiderOpen,
    } = useThemedLayoutContext();

    const drawerWidth = () => {
        if (siderCollapsed) return 56;
        return 240;
    };

    const t = useTranslate();
    const routerType = useRouterType();
    const Link = useLink();
    const {Link: LegacyLink} = useRouterContext();
    const ActiveLink = routerType === "legacy" ? LegacyLink : Link;
    const {hasDashboard} = useRefineContext();
    const translate = useTranslate();

    const {menuItems, selectedKey, defaultOpenKeys} = useMenu({meta});
    const isExistAuthentication = useIsExistAuthentication();
    const TitleFromContext = useTitle();
    const authProvider = useActiveAuthProvider();
    const {warnWhen, setWarnWhen} = useWarnAboutChange();
    const {mutate: mutateLogout} = useLogout({
        v3LegacyAuthProviderCompatible: Boolean(authProvider?.isLegacy),
    });

    const [open, setOpen] = useState<{ [k: string]: any }>({});

    React.useEffect(() => {
        setOpen((previous) => {
            const previousKeys: string[] = Object.keys(previous);
            const previousOpenKeys = previousKeys.filter((key) => previous[key]);

            const uniqueKeys = new Set([...previousOpenKeys, ...defaultOpenKeys]);
            const uniqueKeysRecord = Object.fromEntries(
                Array.from(uniqueKeys.values()).map((key) => [key, true])
            );
            return uniqueKeysRecord;
        });
    }, [defaultOpenKeys]);

    const RenderToTitle = TitleFromProps ?? TitleFromContext ?? ThemedTitleV2;

    const handleClick = (key: string) => {
        setOpen({...open, [key]: !open[key]});
    };

    const renderTreeView = (tree: ITreeMenu[], selectedKey?: string) => {
        return tree.map((item: ITreeMenu) => {
            const { route, name, children, meta, options} =
                item;
            const isOpen = open[item.key || ""] || false;

            const isSelected = item.key === selectedKey;
            const isNested = !(
                pickNotDeprecated(meta?.parent, options?.parent, meta?.parent) ===
                undefined
            );

            if (children.length > 0) {
                return (
                    <CanAccess
                        key={item.key}
                        resource={name.toLowerCase()}
                        action="list"
                        params={{
                            resource: item,
                        }}
                    >
                        <div key={item.key}>
                            <Tooltip
                                title={meta?.label ?? name}
                                placement="right"
                                disableHoverListener={!siderCollapsed}
                                arrow
                            >
                                <ListItemButton
                                    onClick={() => {
                                        if (siderCollapsed) {
                                            setSiderCollapsed(false);
                                            if (!isOpen) {
                                                handleClick(item.key || "");
                                            }
                                        } else {
                                            handleClick(item.key || "");
                                        }
                                    }}
                                    sx={{
                                        pl: isNested ? 4 : 2,
                                        justifyContent: "center",
                                        marginTop: "8px",
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            justifyContent: "center",
                                            minWidth: "24px",
                                            transition: "margin-right 0.3s",
                                            marginRight: siderCollapsed ? "0px" : "12px",
                                            color: "currentColor",
                                        }}
                                    >
                                        {meta?.icon ?? <ListOutlined/>}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={meta?.label}
                                        primaryTypographyProps={{
                                            noWrap: true,
                                            fontSize: "14px",
                                        }}
                                    />
                                    {isOpen ? (
                                        <ExpandLess
                                            sx={{
                                                color: "text.icon",
                                            }}
                                        />
                                    ) : (
                                        <ExpandMore
                                            sx={{
                                                color: "text.icon",
                                            }}
                                        />
                                    )}
                                </ListItemButton>
                            </Tooltip>
                            {!siderCollapsed && (
                                <Collapse
                                    in={open[item.key || ""]}
                                    timeout="auto"
                                    unmountOnExit
                                >
                                    <List component="div" disablePadding>
                                        {renderTreeView(children, selectedKey)}
                                    </List>
                                </Collapse>
                            )}
                        </div>
                    </CanAccess>
                );
            }

            // @ts-ignore
            return (
                <CanAccess
                    key={item.key}
                    resource={name.toLowerCase()}
                    action="list"
                    params={{resource: item}}
                >
                    <Tooltip
                        title={meta?.label ?? name}
                        placement="right"
                        disableHoverListener={!siderCollapsed}
                        arrow
                    >
                        <li>
                            <Button
                                sx={{
                                    alignItems: 'center',
                                    borderRadius: 1,
                                    display: 'flex',
                                    justifyContent: 'flex-start',
                                    pl: '16px',
                                    pr: '16px',
                                    py: '6px',
                                    textAlign: 'left',
                                    width: '100%',
                                    ...(isSelected && {
                                        backgroundColor: 'rgba(255, 255, 255, 0.04)'
                                    }),
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.04)'
                                    }
                                }}
                                component={NextLink}
                                href={route}
                            >
                                    <Box
                                        component="span"
                                        sx={{
                                            alignItems: 'center',
                                            color: 'neutral.400',
                                            display: 'inline-flex',
                                            justifyContent: 'center',
                                            mr: 2,
                                            ...(isSelected && {
                                                color: 'primary.main'
                                            })
                                        }}
                                    >
                                        <SvgIcon
                                            fontSize="small"
                                            sx={{color: 'neutral.500'}}
                                        >
                                        {meta?.icon != null ?  meta?.icon : defaultIcon}
                                        </SvgIcon>
                                    </Box>
                                <Box
                                    component="span"
                                    sx={{
                                        color: 'neutral.400',
                                        flexGrow: 1,
                                        fontFamily: (theme) => theme.typography.fontFamily,
                                        fontSize: 14,
                                        fontWeight: 600,
                                        lineHeight: '24px',
                                        whiteSpace: 'nowrap',
                                        ...(isSelected && {
                                            color: 'common.white'
                                        })
                                    }}
                                >
                                    {meta?.label}
                                </Box>
                            </Button>
                        </li>
                    </Tooltip>
                </CanAccess>
            );
        });
    };

    const dashboard = hasDashboard ? (
        <CanAccess resource="dashboard" action="list">
            <Tooltip
                title={translate("dashboard.title", "Dashboard")}
                placement="right"
                disableHoverListener={!siderCollapsed}
                arrow
            >
                <ListItemButton
                    component={ActiveLink}
                    to="/"
                    selected={selectedKey === "/"}
                    onClick={() => {
                        setMobileSiderOpen(false);
                    }}
                    sx={{
                        pl: 2,
                        py: 1,
                        justifyContent: "center",
                        color: selectedKey === "/" ? "primary.main" : "text.primary",
                    }}
                >
                    <ListItemIcon
                        sx={{
                            justifyContent: "center",
                            minWidth: "24px",
                            transition: "margin-right 0.3s",
                            marginRight: siderCollapsed ? "0px" : "12px",
                            color: "currentColor",
                            fontSize: "14px",
                        }}
                    >
                        <Dashboard/>
                    </ListItemIcon>
                    <ListItemText
                        primary={translate("dashboard.title", "Dashboard")}
                        primaryTypographyProps={{
                            noWrap: true,
                            fontSize: "14px",
                        }}
                    />
                </ListItemButton>
            </Tooltip>
        </CanAccess>
    ) : null;

    const handleLogout = () => {
        if (warnWhen) {
            const confirm = window.confirm(
                t(
                    "warnWhenUnsavedChanges",
                    "Are you sure you want to leave? You have unsaved changes."
                )
            );

            if (confirm) {
                setWarnWhen(false);
                mutateLogout();
            }
        } else {
            mutateLogout();
        }
    };

    const logout = isExistAuthentication && (
        <Tooltip
            title={t("buttons.logout", "Logout")}
            placement="right"
            disableHoverListener={!siderCollapsed}
            arrow
        >
            <ListItemButton
                key="logout"
                onClick={() => handleLogout()}
                sx={{
                    justifyContent: "center",
                }}
            >
                <ListItemIcon
                    sx={{
                        justifyContent: "center",
                        minWidth: "24px",
                        transition: "margin-right 0.3s",
                        marginRight: siderCollapsed ? "0px" : "12px",
                        color: "currentColor",
                    }}
                >
                    <Logout/>
                </ListItemIcon>
                <ListItemText
                    primary={t("buttons.logout", "Logout")}
                    primaryTypographyProps={{
                        noWrap: true,
                        fontSize: "14px",
                    }}
                />
            </ListItemButton>
        </Tooltip>
    );

    const items = renderTreeView(menuItems, selectedKey);

    const renderSider = () => {
        if (render) {
            return render({
                dashboard,
                logout,
                items,
                collapsed: siderCollapsed,
            });
        }
        return (
            <>
                {dashboard}
                {items}
                {logout}
            </>
        );
    };

    const drawer = (
        <List
            disablePadding
            sx={{
                flexGrow: 1,
                paddingTop: "16px",
            }}
        >
            {renderSider()}
        </List>
    );

    return (
        <>
            <Box
                sx={{
                    width: {xs: drawerWidth()},
                    display: {
                        xs: "none",
                        md: "block",
                    },
                    transition: "width 0.3s ease",
                }}
            />

            <Box
                component="nav"
                sx={{
                    position: "fixed",
                    zIndex: 1101,
                    width: {sm: drawerWidth()},
                    display: "flex",
                }}
            >
                <Drawer
                    variant="temporary"
                    elevation={2}
                    open={mobileSiderOpen}
                    onClose={() => setMobileSiderOpen(false)}
                    ModalProps={{
                        keepMounted: true, // Better open performance on mobile.
                    }}
                    sx={{
                        display: {
                            sm: "block",
                            md: "none",
                        },

                    }}
                >
                    <Box
                        sx={{
                            width: drawerWidth(),
                        }}
                    >
                        <Box
                            sx={{
                                height: 64,
                                display: "flex",
                                alignItems: "center",
                                paddingLeft: "16px",
                                fontSize: "14px",
                            }}
                        >
                            <RenderToTitle collapsed={false}/>
                        </Box>
                        {drawer}
                    </Box>
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: {xs: "none", md: "block"},
                        "& .MuiDrawer-paper": {
                            width: drawerWidth(),
                            overflow: "hidden",
                            backgroundColor: 'neutral.800',
                            color: 'common.white',
                            transition: "width 200ms cubic-bezier(0.4, 0, 0.6, 1) 0ms",
                        },
                    }}
                    open
                >
                    <Paper
                        elevation={0}
                        sx={{
                            fontSize: "14px",
                            width: "100%",
                            height: 64,
                            display: "flex",
                            flexShrink: 0,
                            alignItems: "center",
                            justifyContent: siderCollapsed ? "center" : "space-between",
                            paddingLeft: siderCollapsed ? 0 : "16px",
                            paddingRight: siderCollapsed ? 0 : "8px",
                            variant: "outlined",
                            borderRadius: 0,
                            borderBottom: (theme) =>
                                `1px solid ${theme.palette.action.focus}`,
                            backgroundColor: 'inherit',

                        }}
                    >
                        <Link
                            to="/"
                            component={ActiveLink}
                            underline="none"
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                            }}
                        >
                            <SvgIcon height="24px" width="24px">
                                {defaultIcon}
                            </SvgIcon>
                        </Link>
                        {!siderCollapsed && (
                            <IconButton size="small" onClick={() => setSiderCollapsed(true)}>
                                {<ChevronLeft/>}
                            </IconButton>
                        )}
                    </Paper>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100%'
                        }}
                    >
                        <Box sx={{p: 3}}>
                            <Box
                                sx={{
                                    alignItems: 'center',
                                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                                    borderRadius: 1,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    mt: 0,
                                    p: '12px'
                                }}
                            >
                                <div>
                                    <Typography
                                        color="inherit"
                                        fontWeight={500}
                                        variant="subtitle1"
                                    >
                                        {defaultText}
                                    </Typography>
                                    <Typography
                                        color="neutral.400"
                                        variant="body2"
                                    >

                                        <NativeSelect
                                            sx={{
                                                color: 'white'
                                            }}
                                            defaultValue={30}
                                            inputProps={{
                                                name: 'environment',
                                                id: 'uncontrolled-native',
                                            }}
                                        >
                                            <option value={"dev"}>Development</option>
                                        </NativeSelect>
                                    </Typography>
                                </div>
                                <SvgIcon
                                    fontSize="small"
                                    sx={{color: 'neutral.500'}}
                                >
                                    <ChevronUpDownIcon/>
                                </SvgIcon>
                            </Box>
                        </Box>
                        <Divider sx={{borderColor: 'neutral.700'}}/>
                        <Box
                            component="nav"
                            sx={{
                                flexGrow: 1,
                                px: 2,
                                py: 3
                            }}
                        >
                            <Stack
                                component="ul"
                                spacing={0.5}
                                sx={{
                                    listStyle: 'none',
                                    p: 0,
                                    m: 0
                                }}
                            >
                                {drawer}
                            </Stack>
                        </Box>
                        <Divider sx={{borderColor: 'neutral.700'}}/>
                    </Box>
                </Drawer>
            </Box>
        </>
    );
};
