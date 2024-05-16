import { JinjatApp } from "@jinjatdata/core";
import { useMemo } from "react";

export default function App ({...props}) {
    return useMemo(
        () => <JinjatApp {...props} apiUrl={process.env.JINJAT_HOST}/>,
        [props]
      );
}
