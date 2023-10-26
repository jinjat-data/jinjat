import {authCheck} from "src/authProvider";
import {useRouter} from 'next/router'
import {JinjatList} from "@components/crud/list";
import {JinjatCreate} from "@components/crud/create";
import {JinjatShow} from "@components/crud/show";
import React from "react";
import {JinjatEdit} from "@components/crud/edit";
import {useResource} from "@refinedev/core";
import {useJinjatProvider} from "@components/hooks/useSchemaProvider";
import {useQuery} from "@tanstack/react-query";
import {JinjatDashboard} from "@components/dashboard/dashboard";
import {JinjatNotebook} from "@components/notebook/JinjatNotebook";


export default function ExposurePage() {
    const {resource} = useResource();
    let type = resource?.meta?.type;

    const router = useRouter()
    const {exposure} = router.query
    let [package_name, version, name, action, id] = exposure
    const schemaProvider = useJinjatProvider();

    let analysis_name = resource?.meta?.jinjat?.analysis || name;
    action = action || resource?.meta?.jinjat?.refine?.layout;
    // TODO: only perform when layout and action is not set
    const {isLoading, error, data: method} = useQuery({
        queryKey: ['analysis.method', package_name, version, analysis_name],
        queryFn: () => schemaProvider.getAnalysisMethod(package_name, analysis_name),
        enabled: action == null && type == 'analysis'
    })

    let nonAuth = authCheck();
    if (nonAuth) {
        return nonAuth
    }

    const actions = {
        "create": JinjatCreate,
        "show": JinjatShow,
        "edit": JinjatEdit,
        "list": JinjatList,
        "dashboard": JinjatDashboard,
        "notebook": JinjatNotebook,
    }

    if (action != null) {
        // @ts-ignore
        const JinjatComponent = actions[action]
        if (JinjatComponent != null) {
            let resources = resource?.meta?.jinjat?.refine?.resources;
            if(resources == null) {
                resources = {}
                resources[action] = analysis_name
            }
            return <JinjatComponent packageName={package_name}
                                    resources={resources}
                                    action={action}
                                    exposure={name}
                                    params={id}
                                    version={version}/>
        }
    } else {
        if (false) {
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
                return <JinjatList title={resource?.meta?.label || exposure[1]}
                                   logo={resource?.meta?.jinjat.logo || <div/>} packageName={package_name}
                                   resources={{list: analysis_name}}
                                   enableActions={false}
                                   version={version}/>
            } else {
                return <JinjatCreate title={resource?.meta?.label || exposure[1]}
                                     logo={resource?.meta?.jinjat.logo || <div/>} packageName={package_name}
                                     resources={{create: analysis_name}}
                                     version={version}/>
            }
        } else if (type == 'application') {
            let analysis = resource?.meta?.jinjat.refine.resources?.list;
            return <JinjatList packageName={package_name} resources={{list: analysis || analysis_name}}
                               enableActions={true}
                               version={version}/>
        } else if (type == 'dashboard') {
            return <JinjatDashboard packageName={package_name} exposure={analysis_name}/>
        } else if (type == 'notebook') {
            return <JinjatNotebook packageName={package_name} analysis={analysis_name}/>
        }
    }

    return <div>404</div>;
}


