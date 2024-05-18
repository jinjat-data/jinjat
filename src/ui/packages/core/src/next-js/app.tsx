// import { DevtoolsProvider, DevtoolsPanel } from "@refinedev/devtools";
import { RefineSnackbarProvider, useNotificationProvider } from "@refinedev/mui";
import routerProvider, {
    UnsavedChangesNotifier,
} from "@refinedev/nextjs-router";
import type { NextPage } from "next";
import { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { KBarProvider } from "kbar";

// import "@copilotkit/react-textarea/styles.css";
// import "@copilotkit/react-ui/styles.css";

import { CopilotTextarea } from "@copilotkit/react-textarea";
// import {CopilotProvider, useMakeCopilotReadable} from "@copilotkit/react-core";

import { ColorModeContextProvider } from "@contexts";
import {
    Alert,
    AlertTitle,
    Box,
    Card,
    CardContent,
    Container,
    CssBaseline,
    GlobalStyles,
    Portal,
} from "@mui/material";
import { authProvider } from "../authProvider";
import React from "react";
import { createResources } from "../refine/createResources";
import { useJinjatProject } from "@components/hooks/useJinjatProject";
import { jinjatProvider } from "@components/hooks/schema";
import { JinjatServiceContextProvider } from "@components/hooks/useSchemaProvider";
import { CacheProvider } from "@emotion/react";
import { useNProgress } from "@components/hooks/use-nprogress";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ThemedLayoutV2 } from "@components/layout";
import createCache from "@emotion/cache";
import { dataProvider } from "../data-provider";
import { createActionsFromProject, CommandBar } from "@components/kbar";
// import {CopilotSidebarUIProvider} from "@copilotkit/react-ui";
import { useRouter } from "next/router";
import { getMessageForStatusCode } from "../utils/messages";
import { Refine } from "@refinedev/core";

const clientSideEmotionCache = createCache({ key: "css" });

const queryClient = new QueryClient();

// useMakeCopilotReadable()

export type ExtendedNextPage = NextPage & {
    noLayout?: boolean;
};

export type ExtendedAppProps = AppProps & {
    Component: ExtendedNextPage;
    apiUrl: string;
};

export function JinjatApp({ Component, pageProps, apiUrl }: ExtendedAppProps) {
    useNProgress();
    const jinjatContext = jinjatProvider(apiUrl);
    const router = useRouter();

    const {
        data: project,
        isLoading,
        error,
    } = useJinjatProject({ schemaContext: jinjatContext });

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
                                        Something went wrong fetching metadata
                                        from Jinjat to boot your app!
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

    if (project == null) {
        return <div>Project is null</div>;
    }

    const resources = createResources(project.manifest);
    const renderComponent = () => {
        if (Component.noLayout) {
            return <Component {...pageProps} project={project.manifest} />;
        }

        return (
            <ThemedLayoutV2 project={project!}>
                <Component {...pageProps} project={project?.manifest} />
            </ThemedLayoutV2>
        );
    };

    const resourceActions = createActionsFromProject(project.manifest, router);

    return (
        <>
            <CacheProvider value={clientSideEmotionCache}>
                {/*<CopilotProvider chatApiEndpoint="/api/copilot">*/}
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <QueryClientProvider client={queryClient}>
                        <KBarProvider actions={resourceActions}>
                            <CommandBar jinjatContext={jinjatContext} />
                            <ColorModeContextProvider>
                                <CssBaseline />
                                <GlobalStyles
                                    styles={{
                                        html: { WebkitFontSmoothing: "auto" },
                                    }}
                                />
                                <RefineSnackbarProvider>
                                    <JinjatServiceContextProvider
                                        {...jinjatContext}
                                    >
                                        {/*<DevtoolsProvider>*/}
                                            <Refine
                                                routerProvider={routerProvider}
                                                dataProvider={dataProvider(
                                                    apiUrl,
                                                )}
                                                notificationProvider={
                                                    useNotificationProvider
                                                }
                                                authProvider={authProvider}
                                                resources={resources}
                                                options={{
                                                    syncWithLocation: true,
                                                    warnWhenUnsavedChanges:
                                                        true,
                                                    reactQuery: {
                                                        clientConfig:
                                                            queryClient,
                                                    },
                                                }}
                                            >
                                                {renderComponent()}
                                                <UnsavedChangesNotifier />
                                            </Refine>
                                            {/*<DevtoolsPanel />*/}
                                        {/*</DevtoolsProvider>*/}
                                    </JinjatServiceContextProvider>
                                </RefineSnackbarProvider>
                            </ColorModeContextProvider>
                        </KBarProvider>
                        <Portal>
                            {/*<CopilotSidebarUIProvider >*/}
                            {/*    <Button>test</Button>fsdfsd*/}
                            {/*</CopilotSidebarUIProvider>*/}
                        </Portal>
                    </QueryClientProvider>
                </LocalizationProvider>
                {/*</CopilotProvider>*/}
            </CacheProvider>
        </>
    );
}
