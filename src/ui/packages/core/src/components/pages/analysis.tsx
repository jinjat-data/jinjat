import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { useJinjatProvider } from "@components/hooks/useSchemaProvider";
import { JinjatCreate } from "@components/refine/create";
import React from "react";
import CodeBracketSquareIcon from "@heroicons/react/24/solid/CodeBracketSquareIcon";
import { JinjatList } from "@components/refine/list";
import { authCheck } from "../../authProvider";

export default function AnalysisPage() {
    const nonAuth = authCheck();
    const router = useRouter();
    const { jinjat } = router.query;
    const spread = typeof jinjat == "string" ? [jinjat] : jinjat ? jinjat : [];
    const [package_name, version, analysis_name, id] = spread;
    const schemaProvider = useJinjatProvider();

    const {
        isLoading,
        error,
        data: analysis,
    } = useQuery({
        queryKey: ["analysis", package_name, version, analysis_name],
        queryFn: () =>
            schemaProvider.getAnalysisApi(package_name, analysis_name),
    });

    if (nonAuth) {
        return nonAuth;
    }

    if (analysis == null) {
        return <div>The analysis doesnt exist</div>;
    }

    return (
        <>
            <JinjatCreate
                title={`analysis.${package_name}.${analysis_name}`}
                logo={<CodeBracketSquareIcon />}
                packageName={package_name}
                resources={{ create: analysis_name }}
                version={version}
            />
            <JinjatList
                title={`analysis.${package_name}.${analysis_name}`}
                logo={<CodeBracketSquareIcon />}
                packageName={package_name}
                resources={{ list: analysis_name }}
                enableActions={false}
                version={version}
            />
        </>
    );
}
