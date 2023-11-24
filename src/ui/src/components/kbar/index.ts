import {DbtNode, JinjatManifest} from "@components/hooks/schema";
import {getIconForKeyword, getIconForResource} from "../../interfaces/createComponents";
import {redirect} from "next/navigation";
import {Action, Priority} from "kbar";
import {NextRouter} from "next/router";

export {CommandBar} from "@components/kbar/commandBar";

export function createActionsFromNodes(project: JinjatManifest | undefined, nodes: DbtNode[], router : NextRouter): Action[] {
    if (!project) {
        return []
    }
    return nodes.map(node => {
        return {
            id: node.unique_id,
            name: node.name,
            keywords: `${node.resource_type} words`,
            section: node.resource_type,
            perform: () => router.push(`/${node.resource_type}/${node.package_name}/${project.version}/${node.name}`),
            // icon: getIconForKeyword(node.resource_type),
            priority: Priority.LOW
        }
    })
}

export function createActionsFromProject({resources, version}: JinjatManifest, router : NextRouter): Action[] {
    return (resources || []).map(resource => {
        return {
            id: resource.unique_id,
            name: resource.label || resource.name,
            keywords: `${resource.type} words`,
            perform: () => router.push(`/exposure/${resource.package_name}/${version}/${resource.name}`),
            icon: getIconForResource(resource),
            subtitle: `${resource.type} by ${resource.owner?.name}`,
            priority: Priority.NORMAL
        }
    })
}
