import {JinjatManifest} from "@components/hooks/schema";
import { ResourceProps } from "@refinedev/core";
import {getIconForResource} from "../interfaces/createComponents";

export function createResources({resources, version}: JinjatManifest): ResourceProps[] {

    return (resources || []).map(resource => {
        const name = `${resource.package_name}/${version}/${resource.name}`;
        const path = `/exposure/${name}`;
        return {
            name: name,
            identifier: resource.unique_id,
            list: `${path}`,
            edit: resource?.jinjat?.refine?.resources?.edit ? `${path}/edit/:id` : undefined,
            show: resource?.jinjat?.refine?.resources?.show ? `${path}/show/:id` : undefined,
            create: resource?.jinjat?.refine?.resources?.create != null ? `${path}/create` : undefined,
            meta: {
                canDelete: resource.jinjat?.refine?.actions?.delete != null,
                label: resource.label || resource.name,
                jinjat: resource.jinjat,
                url: resource.url,
                type: resource.type,
                icon: getIconForResource(resource)
            }
        };
    })
}
