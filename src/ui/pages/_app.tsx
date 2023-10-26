import {DevtoolsProvider, DevtoolsPanel} from "@refinedev/devtools";
import {Refine} from "@refinedev/core";
import {RefineKbar, RefineKbarProvider} from "@refinedev/kbar";
import {RefineSnackbarProvider, notificationProvider} from "@refinedev/mui";
import routerProvider, {
    UnsavedChangesNotifier,
} from "@refinedev/nextjs-router";
import type {NextPage} from "next";
import {AppProps} from "next/app";
import {QueryClient} from "@tanstack/react-query";

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
import React from "react";
import {createResources} from "src/refine/createResources";
import {useJinjatProject} from "@components/hooks/useJinjatProject";
import useKbarActions from "@components/hooks/useKbarActions";
import {jinjatProvider} from "@components/hooks/schema";
import {JinjatServiceContextProvider} from "@components/hooks/useSchemaProvider";
import {getMessageForStatusCode} from "../src/utils/messages";
import {CacheProvider} from "@emotion/react";
import {useNProgress} from "@components/hooks/use-nprogress";
import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider';
import {AdapterDateFns} from "@mui/x-date-pickers/AdapterDateFns";
import {ThemedLayoutV2} from "@components/layout";
import createCache from "@emotion/cache";
import {dataProvider} from "src/analysis-data-provider";
import { createAction, useRegisterActions } from "@refinedev/kbar";

const API_URL = "http://127.0.0.1:8581";

const clientSideEmotionCache = createCache({key: 'css'});

const queryClient = new QueryClient();

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
    noLayout?: boolean;
};

type AppPropsWithLayout = AppProps & {
    Component: NextPageWithLayout;
};

function JinjatApp({Component, pageProps}: AppPropsWithLayout): JSX.Element {
    const jinjatContext = jinjatProvider(API_URL);
    useNProgress();
    // useKbarActions();

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

    return <>
        <CacheProvider value={clientSideEmotionCache}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <RefineKbarProvider>
                        <ColorModeContextProvider>
                            <CssBaseline/>
                            <GlobalStyles styles={{html: {WebkitFontSmoothing: "auto"}}}/>
                            <RefineSnackbarProvider>
                                <JinjatServiceContextProvider {...jinjatContext}>
                                    {/*<DevtoolsProvider>*/}
                                    <Refine
                                        routerProvider={routerProvider}
                                        dataProvider={dataProvider(API_URL)}
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
                                        <RefineKbar/>
                                        <UnsavedChangesNotifier/>
                                    </Refine>
                                    {/*<DevtoolsPanel/>*/}
                                    {/*</DevtoolsProvider>*/}
                                </JinjatServiceContextProvider>
                            </RefineSnackbarProvider>
                        </ColorModeContextProvider>
                    </RefineKbarProvider>
            </LocalizationProvider>
        </CacheProvider>
    </>;
}

export default JinjatApp;
