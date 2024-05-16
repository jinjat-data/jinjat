import { JinjatApp } from "@jinjatdata/core";
import { useMemo } from "react";

export default function App ({...props}) {
    return useMemo(
        () => <JinjatApp {...props} apiUrl={"https://dbtjinjatintegrationtests-wyn2ibrubq-uc.a.run.app"}/>,
        [props]
      );
}
