import {ResourceProps} from "@refinedev/core";
import {JinjatProject, ResourceType} from "@components/hooks/schema";
import {getIconForResource} from "../interfaces/createComponents";


export function createResources({resources, version}: JinjatProject): ResourceProps[] {

    return (resources || []).map(resource => {
        let name = `${resource.package_name}/${version}/${resource.name}`;
        const path = `/exposure/${name}`;
        return {
            name: name,
            identifier: resource.identifier,
            list: `${path}`,
            edit: resource.type == ResourceType.APPLICATION ? `${path}/edit/:id` : undefined,
            show: resource.type == ResourceType.APPLICATION ? `${path}/show/:id` : undefined,
            create: resource?.jinjat?.refine?.resources?.create != null ? `${path}/create` : undefined,
            meta: {
                canDelete: resource.jinjat?.refine?.actions?.delete != null,
                label: resource.label || resource.name,
                jinjat: resource.jinjat,
                type: resource.type,
                icon: getIconForResource(resource)
            }
        };
    })
}