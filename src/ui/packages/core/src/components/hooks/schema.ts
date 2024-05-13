import {AxiosInstance} from "axios";
import {stringify} from "query-string";
import {JsonSchema} from "@jsonforms/core";
import {axiosInstance} from "../../data-provider/utils";

export interface RefineResource<T> {
    list?: T;
    create?: T;
    edit?: T;
    show?: T;
}

interface RefineAction {
    delete: string;

    [key: string]: any;
}

export type ExposureRefineConfig = {
    menu_icon?: string,
    actions?: RefineAction,
    resources?: RefineResource<string>,
    layout?: string
    props: RefineResource<any>
}

export interface ExposureJinjatConfig {
    refine: ExposureRefineConfig,
    analysis?: string
}


export interface Owner {
    email: string,
    name: string
}

export enum ResourceType {
    APPLICATION = "application", ANALYSIS = "analysis", DASHBOARD = "dashboard", NOTEBOOK = "notebook"
}

export interface JinjatResource {
    name: string,
    unique_id: string,
    type: ResourceType,
    url : string | null,

    label?: string,
    description?: string

    package_name: string

    tags?: string

    jinjat: ExposureJinjatConfig

    owner?: Owner
}

export interface SidebarMenu {
    route?: string,
    children: object[],
    label: string,
}

export interface ProjectRefineConfig {
    sidebar_menu: object[]
}

export interface JinjatOpenAPI {
    jsonforms?: { renderers: Map<string, string> }
    refine: ProjectRefineConfig
    importmaps?: string[]
}

export interface JinjatManifest {
    resources: JinjatResource[],
    package_name: string
    version: string
}

export interface DocFile {
    content: string
    file_path: string
}

export interface DbtNode {
    package_name: string
    name: string
    resource_type: string
    unique_id: string
}

type DashboardParameter = {
    type: string
    // it should be mapped to a query or a body parameter.
}

export type DashboardItem = {
    width: number,
    height: number,
    left: number,
    top: number,
    component: {
        name: string,
        arguments: Map<string, any>
    }
}

export interface Dashboard {
    parameters: Map<string, DashboardParameter>
    items: Array<DashboardItem>
}

export interface OpenAPIParameter {
    in: 'query' | 'path',
    name: string,
    required: boolean
    schema: JsonSchema
    description?: string
}

export type JinjatJsonSchema = { "x-pk"?: string, "x-jsonforms"?: { renderer?: string } } & JsonSchema

export interface JinjatSchema {
    parameters: Array<OpenAPIParameter>
    schema: JinjatJsonSchema
}

export interface JinjatAnalysis {
    method: string,
    parameters: Array<OpenAPIParameter>,
    requestSchema: JinjatJsonSchema,
    responseSchema: JinjatJsonSchema
}

export interface IJinjatContextProvider {
    getResponseSchema: (params: {
        packageName: string,
        analysis: string;
    }) => Promise<JinjatSchema>;

    getRequestSchema: (params: {
        packageName: string,
        analysis: string;
    }) => Promise<JinjatSchema>;

    getManifest: () => Promise<JinjatManifest>
    getProject: (params: {
        packageName: string | null
    }) => Promise<JinjatOpenAPI>

    getApiUrl: () => string

    getAnalysisApi: (packageName: string, analysis: string) => Promise<JinjatAnalysis | null>

    getDashboard: (packageName: string, exposure: string) => Promise<Dashboard>

    getReadme: () => Promise<DocFile>

    getNotebook: (params: { packageName: string, analysis: string }) => Promise<DocFile>

    getAllDbtNodes: () => Promise<DbtNode[]>
}

const REQUEST_QUERY = (packageName: string, analysis: string) => `paths.*.*[] | [?ends_with(operationId, \`${analysis}\`)] | [0] .projection(\`parameters, schema\`, parameters, requestBody.content."application/json".schema)`
const RESPONSE_QUERY = (packageName: string, analysis: string) => `paths.*.*[] | [?ends_with(operationId, \`${analysis}\`)] | [0] .projection(\`parameters, schema\`, parameters, responses."200".content."application/json".schema)`
const EXPOSURES_QUERY = 'exposures.* | [?not_null(meta.jinjat)].{name: name, type: type, unique_id: unique_id, description: description, package_name: package_name, url: url, jinjat: meta.jinjat, owner: owner, label: label}'
const OPENAPI_PROJECT_QUERY = '{refine: "x-jinjat".refine, security: security, securitySchemes: components.securitySchemes}'
const MAIN_README_QUERY = 'docs."doc.{{project_name}}.__overview__".projection(\'file_path, content\', original_file_path, block_contents)'
const ALL_DBT_NODES = 'nodes.* | [?resource_type==\'model\' || resource_type==\'source\' || resource_type==\'seed\' || resource_type==\'analysis\'].{package_name: package_name, name: name, resource_type: resource_type, unique_id: unique_id}'

const GET_ANALYSIS = (packageName: string, analysis: string) => `paths.*. {method: keys(@)[0], values: @.*} .include_method_in_api(@)  | [?operationId=='${analysis}'] | [0] .{parameters: parameters, requestSchema: requestBody.content."application/json".schema, responseSchema: responses."200".content."application/json".schema, method: method}`
const GET_DASHBOARD_EXPOSURE = (packageName: string, exposure: string) => `exposures."exposure.${packageName}.${exposure}".projection(\`parameters, items\`, meta.jinjat.parameters meta.jinjat.items)`


export const jinjatProvider = (
    apiUrl: string,
    httpClient: AxiosInstance = axiosInstance,
): IJinjatContextProvider => ({

    getManifest(): Promise<JinjatManifest> {
        const queryParams = stringify({jmespath: EXPOSURES_QUERY})
        return httpClient.get(
            `${apiUrl}/admin/manifest.json?${queryParams}`,
        ).then(result => {
            return {
                resources: result.data,
                package_name: result.headers['x-dbt-project-name'],
                version: result.headers['x-dbt-project-version']
            }
        });
    },

    getProject({packageName}): Promise<JinjatOpenAPI> {
        const queryParams = stringify({jmespath: OPENAPI_PROJECT_QUERY})
        return httpClient.get(
            `${apiUrl}/${packageName || '_'}/openapi.json?${queryParams}`,
        ).then(result => {
            return result.data
        });
    },

    getDashboard(packageName: string, exposure: string): Promise<Dashboard> {
        const jmespath = stringify({jmespath: GET_DASHBOARD_EXPOSURE(packageName, exposure)});
        return httpClient.get(
            `${apiUrl}/admin/manifest.json?${jmespath}`,
        ).then(result => result.data);
    },

    getApiUrl(): string {
        return apiUrl;
    },

    getAnalysisApi(packageName: string, analysis: string): Promise<JinjatAnalysis | null> {
        const jmespath = stringify({jmespath: GET_ANALYSIS(packageName, analysis)});
        return httpClient.get(
            `${apiUrl}/${packageName}/openapi.json?${jmespath}`,
        ).then(result => result.data);
    },

    getResponseSchema: async ({packageName, analysis}) => {
        const jmespath = stringify({jmespath: RESPONSE_QUERY(packageName, analysis)});
        return httpClient.get(
            `${apiUrl}/${packageName}/openapi.json?${jmespath}`,
        ).then(result => result.data);
    },

    getRequestSchema: async ({packageName, analysis}) => {
        const jmespath = stringify({jmespath: REQUEST_QUERY(packageName, analysis)});
        return httpClient.get(
            `${apiUrl}/${packageName}/openapi.json?${jmespath}`,
        ).then(result => result.data);
    },

    getReadme: async () => {
        const queryParams = stringify({jmespath: MAIN_README_QUERY});
        return httpClient.get(
            `${apiUrl}/admin/manifest.json?${queryParams}`,
        ).then(result => result.data);
    },

    getNotebook: async ({packageName, analysis}) => {
        return httpClient.get(
            `${apiUrl}/_notebook/${packageName}.${analysis}`,
        ).then(result => result.data);
    },

    getAllDbtNodes: async () => {
        const queryParams = stringify({jmespath: ALL_DBT_NODES});
        return httpClient.get(
            `${apiUrl}/admin/manifest.json?${queryParams}`,
        ).then(result => {
            return result.data
        });
    }
})
