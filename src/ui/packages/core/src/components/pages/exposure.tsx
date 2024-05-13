import {authCheck} from "src/authProvider";
import {useRouter} from 'next/router'
import {JinjatList} from "@components/refine/list";
import {JinjatCreate} from "@components/refine/create";
import React from "react";
import {useResource} from "@refinedev/core";
import {useJinjatProvider} from "@components/hooks/useSchemaProvider";
import {useQuery} from "@tanstack/react-query";
import {actions} from "src/interfaces/createComponents";

export function ExposurePage() {
    const nonAuth = authCheck();

    const router = useRouter()
    const {dbt} = router.query
    if(dbt == null) {
        return <div>Unknown route</div>
    }

    const spread = typeof dbt == "string" ? [dbt] : (dbt || [])
    const [_, package_name, version, name, action, id] = spread

    const {resource} = useResource(`exposure.${package_name}.${name}`);
    const type = resource?.meta?.type;
    const schemaProvider = useJinjatProvider();

    const analysis_name = resource?.meta?.jinjat?.analysis || name;
    // TODO: only perform when layout and action is not set
    const {isLoading, error, data} = useQuery({
        queryKey: ['analysis.method', package_name, version, analysis_name],
        queryFn: () => schemaProvider.getAnalysisApi(package_name, analysis_name),
        enabled: action == null && type == 'analysis'
    })

    if (nonAuth) {
        return nonAuth
    }

    if (action != null) {
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
                                    version={version}
                                    {...(resource?.meta?.jinjat?.refine?.props?.[action] || {})}/>
        } else {
            debugger
        }
    } else {
        const url = resource.meta?.url;
        if (url != null) {
            if(url.startsWith('/')) {
                router.push(url)
                return <div>Redirecting..</div>
            } else {
                return <iframe src={url} width={'100%'} height={"600px"}/>
            }
        }

        if (type == 'analysis') {
            if (isLoading) {
                return <div>Loading...</div>;
            }

            if (error) {
                return <div>{JSON.stringify(error)}</div>;
            }

            if (data?.method == null) {
                return <div>The analysis doesnt have any method</div>;
            }

            if (data.method == 'get') {
                return <JinjatList title={resource?.meta?.label || spread[1]}
                                   logo={resource?.meta?.jinjat.logo || <div/>} packageName={package_name}
                                   resources={{list: analysis_name}}
                                   enableActions={false}
                                   version={version}
                                   {...resource?.meta?.jinjat?.refine?.props.get} />
            } else {
                return <JinjatCreate title={resource?.meta?.label || spread[1]}
                                     logo={resource?.meta?.jinjat.logo || <div/>} packageName={package_name}
                                     resources={{create: analysis_name}}
                                     version={version}/>
            }
        } else if (type == 'application') {
            const analysis = resource?.meta?.jinjat.refine.resources?.list;

            return <JinjatList packageName={package_name} resources={{list: analysis || analysis_name}}
                               enableActions={true}
                               version={version}
                               {...resource?.meta?.jinjat?.refine?.props?.list}/>
        }
    }

    return <div>404</div>;
}


