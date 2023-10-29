import {authCheck} from "../../src/authProvider";
import {useRouter} from "next/router";
import {useQuery} from "@tanstack/react-query";
import {useJinjatProvider} from "@components/hooks/useSchemaProvider";
import {JinjatList} from "@components/crud/list";
import {JinjatCreate} from "@components/crud/create";
import React from "react";
import CodeBracketSquareIcon from '@heroicons/react/24/solid/CodeBracketSquareIcon';

export default function AnalysisPage() {
    let nonAuth = authCheck();
    const router = useRouter()
    const {analysis} = router.query
    let [package_name, version, analysis_name, id] = analysis
    const schemaProvider = useJinjatProvider();

    const {isLoading, error, data: method} = useQuery({
        queryKey: ['analysis.method', package_name, version, analysis_name],
        queryFn: () => schemaProvider.getAnalysisMethod(package_name, analysis_name),
    })

    if (nonAuth) {
        return nonAuth
    }

    if (method == null) {
        return <div>The analysis doesn't have any method</div>;
    }

    if (method == 'get') {
        return <JinjatList title={`analysis.${package_name}.${analysis_name}`}
                           logo={<CodeBracketSquareIcon/>} packageName={package_name}
                           resources={{list: analysis_name}}
                           enableActions={false}
                           version={version}/>
    } else {
        return <JinjatCreate title={`analysis.${package_name}.${analysis_name}`}
                             logo={<CodeBracketSquareIcon/>}
                             packageName={package_name}
                             resources={{create: analysis_name}}
                             version={version}/>
    }
}