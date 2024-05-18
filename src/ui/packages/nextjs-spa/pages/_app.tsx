import { ExtendedAppProps, JinjatApp } from "@jinjatdata/core";
import { useMemo } from "react";

export default function App ({Component, pageProps} : ExtendedAppProps) {
    const host = process.env.JINJAT_HOST || "http://127.0.0.1:8581"

    return useMemo(
        () => <JinjatApp Component={Component} pageProps={pageProps} apiUrl={host}/>,
        [pageProps]
      );
}
