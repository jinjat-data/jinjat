import {authCheck} from "../../src/authProvider";
import {useRouter} from "next/router";
import {useQuery} from "@tanstack/react-query";
import {useJinjatProvider} from "@components/hooks/useSchemaProvider";
import {JinjatCreate} from "@components/crud/create";
import React from "react";
import CodeBracketSquareIcon from '@heroicons/react/24/solid/CodeBracketSquareIcon';
import {JinjatList} from "@components/crud/list";

export default function AnalysisPage() {
    let nonAuth = authCheck();
    const router = useRouter()
    const {analysis : analysisRoute} = router.query
    let [package_name, version, analysis_name, id] = analysisRoute
    const schemaProvider = useJinjatProvider();

    const {isLoading, error, data: analysis} = useQuery({
        queryKey: ['analysis', package_name, version, analysis_name],
        queryFn: () => schemaProvider.getAnalysisApi(package_name, analysis_name),
    })

    if (nonAuth) {
        return nonAuth
    }

    if (analysis == null) {
        return <div>The analysis doesn't exist</div>;
    }


    return <>
        <JinjatCreate title={`analysis.${package_name}.${analysis_name}`}
                         logo={<CodeBracketSquareIcon/>}
                         packageName={package_name}
                         resources={{create: analysis_name}}
                         version={version}/>
        <JinjatList title={`analysis.${package_name}.${analysis_name}`}
                    logo={<CodeBracketSquareIcon/>} packageName={package_name}
                    resources={{list: analysis_name}}
                    enableActions={false}
                    version={version}/>
    </>
}