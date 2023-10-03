import { ResourceProps } from "@refinedev/core";
import {JinjatProject, ResourceType} from "../components/hooks/schema";

export function createResources({ resources}: JinjatProject): ResourceProps[] {

    return (resources || []).map(resource => {
        const path = `/exposure/${resource.package_name}/${resource.name}`;
        return {
            name: `${resource.package_name}/${resource.name}`,
            identifier: resource.identifier,
            list: path,
            edit: resource.type == ResourceType.APPLICATION ? `${path}/edit/:id` : undefined,
            show: resource.type == ResourceType.APPLICATION ? `${path}/show/:id` : undefined,
            create: resource?.refine?.resources?.create != null ? `${path}/create` : undefined,
            meta: {
                canDelete: resource.refine.actions?.delete != null,
                label: resource.label || resource.name,
                jinjat: resource.refine,
                type: resource.type
            }
        };
    })
}