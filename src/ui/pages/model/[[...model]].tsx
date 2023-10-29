import {authCheck} from "../../src/authProvider";
import {useRouter} from "next/router";
import {useQuery} from "@tanstack/react-query";
import {useJinjatProvider} from "@components/hooks/useSchemaProvider";
import {JinjatList} from "@components/crud/list";
import {JinjatCreate} from "@components/crud/create";
import React from "react";
import CodeBracketSquareIcon from '@heroicons/react/24/solid/CodeBracketSquareIcon';

export default function ModelPage() {
    let nonAuth = authCheck();
    const router = useRouter()
    const {analysis} = router.query
    let [package_name, version, model_name, id] = analysis
    const schemaProvider = useJinjatProvider();

    if (nonAuth) {
        return nonAuth
    }

    return <JinjatList title={model_name}
                       logo={<CodeBracketSquareIcon/>} packageName={package_name}
                       resources={{list: model_name}}
                       enableActions={false}
                       version={version}/>
}