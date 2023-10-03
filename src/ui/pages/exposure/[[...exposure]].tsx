import {authCheck} from "src/authProvider";
import {useRouter} from 'next/router'
import {JinjatList} from "@components/crud/list";
import {JinjatCreate} from "@components/crud/create";
import {JinjatShow} from "@components/crud/show";
import React from "react";
import {JinjatEdit} from "@components/crud/edit";
import {useResource} from "@refinedev/core";
// import {JinjatDashboard} from "@components/dashboard/dashboard";
import {useJinjatProvider} from "@components/hooks/useSchemaProvider";
import {useQuery} from "@tanstack/react-query";


export default function ExposurePage() {
    const {resource} = useResource();
    let type = resource?.meta?.type;

    const router = useRouter()
    const {exposure} = router.query
    const [package_name, name, action, id] = exposure

    const schemaProvider = useJinjatProvider();
    const {isLoading, error, data : method} = useQuery({
        queryKey: ['analysis', 'method'],
        queryFn: () => schemaProvider.getAnalysisMethod(package_name, exposure[1]),
        enabled: action == null && type == 'analysis'
    })

    let nonAuth = authCheck();
    if (nonAuth) {
        return nonAuth
    }

    if (action == 'create') {
        return <JinjatCreate packageName={package_name} analysis={resource?.meta?.jinjat.resources.create}/>
    } else if (action == 'show') {
        return <JinjatShow/>
    } else if (action == 'edit') {
        return <JinjatEdit/>
    } else if (action == null) {
        if(false) {
            return <iframe src={"http://example.com"} width={'100%'} height={"600px"}/>
        }
        if (type == 'analysis') {
            if (isLoading) {
                return <div>Loading...</div>;
            }

            if (error) {
                return <div>{JSON.stringify(error)}</div>;
            }

            if (method == null) {
                return <div>The analysis doesn't have any method</div>;
            }

            if (method == 'get') {
                return <JinjatList packageName={package_name} analysis={exposure[1]} enableActions={false}/>
            } else {
                return <JinjatCreate packageName={package_name} analysis={exposure[1]}/>
            }
        } else if (type == 'application') {
            let analysis = resource?.meta?.jinjat.resources?.list;
            return <JinjatList packageName={package_name} analysis={analysis}  enableActions={true}/>
        } else if (type == 'dashboard') {
            // return <JinjatDashboard packageName={package_name} exposure={exposure[1]} />
        }
    }

    return <div>404</div>;
}
