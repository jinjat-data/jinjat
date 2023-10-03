import { DevtoolsProvider, DevtoolsPanel } from "@refinedev/devtools";
import { Refine } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import { RefineSnackbarProvider, notificationProvider } from "@refinedev/mui";
import routerProvider, {
  UnsavedChangesNotifier,
} from "@refinedev/nextjs-router";
import type { NextPage } from "next";
import { AppProps } from "next/app";

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
} from "@mui/material";
import dataProvider from "@refinedev/simple-rest";
import { authProvider } from "src/authProvider";
import React from "react";
import { createResources } from "src/refine/createResources";
import { useJinjatProject } from "@components/hooks/useJinjatProject";
import { jinjatProvider } from "@components/hooks/schema";
import { JinjatServiceContextProvider } from "@components/hooks/useSchemaProvider";
import { ThemedLayout } from "@components/themedLayout";
import { getMessageForStatusCode } from "../src/utils/messages";

const API_URL = "http://127.0.0.1:8581";

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  noLayout?: boolean;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

function JinjatApp({ Component, pageProps }: AppPropsWithLayout): JSX.Element {
  const jinjatContext = jinjatProvider(API_URL);

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
  const renderComponent = () => {
    if (Component.noLayout) {
      return <Component {...pageProps} project={project} />;
    }

    return (
      <ThemedLayout project={project!!}>
        <Component {...pageProps} project={project} />
      </ThemedLayout>
    );
  };

  return <>
    <RefineKbarProvider>
      <ColorModeContextProvider>
        <CssBaseline />
        <GlobalStyles styles={{ html: { WebkitFontSmoothing: "auto" } }} />
        <RefineSnackbarProvider>
          <JinjatServiceContextProvider {...jinjatContext}>
            <DevtoolsProvider>
              <Refine
                routerProvider={routerProvider}
                dataProvider={dataProvider(API_URL + "/_id")}
                notificationProvider={notificationProvider}
                authProvider={authProvider}
                resources={resources}
                options={{
                  syncWithLocation: true,
                  warnWhenUnsavedChanges: true,
                  projectId: "TLkcDd-TQtrdp-xjPbye"
                }}
              >
                {renderComponent()}
                <RefineKbar />
                <UnsavedChangesNotifier />
              </Refine>
              <DevtoolsPanel />
            </DevtoolsProvider>
          </JinjatServiceContextProvider>
        </RefineSnackbarProvider>
      </ColorModeContextProvider>
    </RefineKbarProvider>
  </>;
}

export default JinjatApp;
