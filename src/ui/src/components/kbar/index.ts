import {DbtNode, JinjatProject} from "@components/hooks/schema";
import {getIconForKeyword, getIconForResource} from "../../interfaces/createComponents";
import {redirect} from "next/navigation";
import {Action, Priority} from "kbar";

export {CommandBar} from "@components/kbar/commandBar";

export function createActionsFromNodes(project: JinjatProject | undefined, nodes: DbtNode[]): Action[] {
    if (!project) {
        return []
    }
    return nodes.map(node => {
        return {
            id: node.unique_id,
            name: node.name,
            keywords: `${node.resource_type} words`,
            section: node.resource_type,
            perform: () => redirect(`/${node.resource_type}/${node.package_name}/${project.version}/${node.name}`),
            icon: getIconForKeyword(node.resource_type),
            subtitle: `${node.resource_type}`,
            priority: Priority.LOW
        }
    })
}

export function createActionsFromProject({resources, version}: JinjatProject): Action[] {
    return (resources || []).map(resource => {
        return {
            id: resource.unique_id,
            name: resource.label || resource.name,
            keywords: `${resource.type} words`,
            perform: () => redirect(`/exposure/${resource.package_name}/${version}/${resource.name}`),
            icon: getIconForResource(resource),
            subtitle: `${resource.type} by ${resource.owner?.name}`,
            priority: Priority.NORMAL
        }
    })
}
