import {DevtoolsProvider, DevtoolsPanel} from "@refinedev/devtools";
import {Refine} from "@refinedev/core";
import {RefineSnackbarProvider, notificationProvider} from "@refinedev/mui";
import routerProvider, {
    UnsavedChangesNotifier,
} from "@refinedev/nextjs-router";
import type {NextPage} from "next";
import {AppProps} from "next/app";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {
    KBarProvider
} from "kbar";

import {ColorModeContextProvider} from "@contexts";
import {
    Alert,
    AlertTitle,
    Box,
    Card,
    CardContent,
    Container,
    CssBaseline,
    GlobalStyles,
} from "@mui/material";
import {authProvider} from "src/authProvider";
import React, {useState} from "react";
import {createResources} from "src/refine/createResources";
import {useJinjatProject} from "@components/hooks/useJinjatProject";
import {jinjatProvider} from "@components/hooks/schema";
import {JinjatServiceContextProvider, useJinjatProvider} from "@components/hooks/useSchemaProvider";
import {getMessageForStatusCode} from "../src/utils/messages";
import {CacheProvider} from "@emotion/react";
import {useNProgress} from "@components/hooks/use-nprogress";
import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider';
import {AdapterDateFns} from "@mui/x-date-pickers/AdapterDateFns";
import {ThemedLayoutV2} from "@components/layout";
import createCache from "@emotion/cache";
import {dataProvider} from "src/analysis-data-provider";
import {createActionsFromProject, CommandBar, createActionsFromNodes} from "@components/kbar";

const clientSideEmotionCache = createCache({key: 'css'});

const queryClient = new QueryClient();

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
    noLayout?: boolean;
};

type AppPropsWithLayout = AppProps & {
    Component: NextPageWithLayout;
};

function JinjatApp({Component, pageProps}: AppPropsWithLayout): JSX.Element {
    let apiUrl = process.env.NEXT_PUBLIC_JINJAT_URL;
    const jinjatContext = jinjatProvider(apiUrl);
    useNProgress();

    const {
        data: project,
        isLoading,
        error,
    } = useJinjatProject({schemaContext: jinjatContext});

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error != null) {
        return (
            <Box component="div">
                <Container
                    component="main"
                    maxWidth="md"
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        height: "100vh",
                    }}
                >
                    <Card>
                        <CardContent>
                            <Alert severity="error">
                                <AlertTitle>
                                    <b>
                                        Something went wrong fetching metadata from Jinjat to boot
                                        your app!
                                    </b>
                                </AlertTitle>
                                {getMessageForStatusCode(error)}
                            </Alert>
                        </CardContent>
                    </Card>
                </Container>
            </Box>
        );
    }

    let resources = createResources(project!!);
    console.log(resources);
    const renderComponent = () => {
        if (Component.noLayout) {
            // @ts-ignore
            return <Component {...pageProps} project={project}/>;
        }

        return (
            <ThemedLayoutV2>
                <Component {...pageProps} project={project}/>
            </ThemedLayoutV2>
        );
    };

    const resourceActions = createActionsFromProject(project!!)

    return <>
        <CacheProvider value={clientSideEmotionCache}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <QueryClientProvider client={queryClient}>
                    <KBarProvider actions={resourceActions}>
                        <CommandBar/>
                        <ColorModeContextProvider>
                            <CssBaseline/>
                            <GlobalStyles styles={{html: {WebkitFontSmoothing: "auto"}}}/>
                            <RefineSnackbarProvider>
                                <JinjatServiceContextProvider {...jinjatContext}>
                                    {/*<DevtoolsProvider>*/}
                                    <Refine
                                        routerProvider={routerProvider}
                                        dataProvider={dataProvider(apiUrl)}
                                        notificationProvider={notificationProvider}
                                        authProvider={authProvider}
                                        resources={resources}
                                        options={{
                                            syncWithLocation: true,
                                            warnWhenUnsavedChanges: true,
                                            reactQuery: {
                                                clientConfig: queryClient
                                            }
                                        }}
                                    >
                                        {renderComponent()}
                                        <UnsavedChangesNotifier/>
                                    </Refine>
                                    {/*<DevtoolsPanel/>*/}
                                    {/*</DevtoolsProvider>*/}
                                </JinjatServiceContextProvider>
                            </RefineSnackbarProvider>
                        </ColorModeContextProvider>
                    </KBarProvider>
                </QueryClientProvider>
            </LocalizationProvider>
        </CacheProvider>
    </>;
}

export default JinjatApp;
