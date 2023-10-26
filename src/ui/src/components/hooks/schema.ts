import {AxiosInstance} from "axios";
import {stringify} from "query-string";
import {JsonSchema} from "@jsonforms/core";
import {axiosInstance} from "src/analysis-data-provider/utils";

enum FieldType {
    Boolean, Number, TimeDelta, Date, DateTime, Text
}

export interface RefineResource {
    list?: string;
    create?: string;
    edit?: string;
    show?: string;

    [key: string]: any;
}

interface RefineAction {
    delete: string;

    [key: string]: any;
}

export type RefineConfig = {
    menu_icon?: string,
    actions?: RefineAction,
    resources?: RefineResource,
    layout?: string
}

export interface ExposureJinjatConfig {
    refine: RefineConfig,
    analysis? : string
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
    identifier: string,
    type: ResourceType,

    label?: string,
    description?: string

    package_name: string

    tags?: string

    jinjat: ExposureJinjatConfig

    owner?: Owner
}

export interface JinjatProject {
    resources: JinjatResource[],
    package_name: string
    version: string
}

export interface DocFile {
    content: string
    file_path: string
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

export interface JinjatSchema {
    parameters: Array<OpenAPIParameter>
    schema: JsonSchema
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

    getProject: () => Promise<JinjatProject>

    getApiUrl: () => string

    getAnalysisMethod: (packageName: string, analysis: string) => Promise<string | null>

    getDashboard: (packageName: string, exposure: string) => Promise<Dashboard>

    getReadme: () => Promise<DocFile>

    getNotebook: (params: { packageName: string, analysis: string }) => Promise<DocFile>
}

const REQUEST_QUERY = (packageName: string, analysis: string) => `paths.*.*[] | [?ends_with(operationId, \`${analysis}\`)] | [0] .projection(\`parameters, schema\`, parameters, requestBody.content."application/json".schema)`
const RESPONSE_QUERY = (packageName: string, analysis: string) => `paths.*.*[] | [?ends_with(operationId, \`${analysis}\`)] | [0] .projection(\`parameters, schema\`, parameters, responses."200".content."application/json".schema)`
const EXPOSURES_QUERY = 'exposures.* | [?not_null(meta.jinjat)].projection(`name, type, unique_id, description, package_name, jinjat, owner, label`, name, type, identifier, description, package_name, meta.jinjat, owner, label)'
const MAIN_README_QUERY = 'docs."doc.{{project_name}}.__overview__".projection(\'file_path, content\', original_file_path, block_contents)'

const GET_ANALYSIS_METHOD = (packageName : string, analysis: string) => `nodes."analysis.${packageName}.${analysis}".config.jinjat.method`
const GET_DASHBOARD_EXPOSURE = (packageName : string, exposure: string) => `exposures."exposure.${packageName}.${exposure}".projection(\`parameters, items\`, meta.jinjat.parameters meta.jinjat.items)`


export const jinjatProvider = (
    apiUrl: string,
    httpClient: AxiosInstance = axiosInstance,
): IJinjatContextProvider => <IJinjatContextProvider>({

    getProject(): Promise<JinjatProject> {
        let queryParams = stringify({jmespath: EXPOSURES_QUERY})
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

    getDashboard(packageName : string, exposure : string): Promise<Dashboard> {
        let jmespath = stringify({jmespath: GET_DASHBOARD_EXPOSURE(packageName, exposure)});
        return httpClient.get(
            `${apiUrl}/admin/manifest.json?${jmespath}`,
        ).then(result => result.data);
    },

    getApiUrl(): string {
        return apiUrl;
    },

    getAnalysisMethod(packageName: string, analysis: string): Promise<string | null> {
        let jmespath = stringify({jmespath: GET_ANALYSIS_METHOD(packageName, analysis)});
        return httpClient.get(
            `${apiUrl}/admin/manifest.json?${jmespath}`,
        ).then(result => result.data);
    },

    getResponseSchema: async ({packageName, analysis}) => {
        let jmespath = stringify({jmespath: RESPONSE_QUERY(packageName, analysis)});
        return httpClient.get(
            `${apiUrl}/${packageName}/openapi.json?${jmespath}`,
        ).then(result => result.data);
    },

    getRequestSchema: async ({packageName, analysis}) => {
        let jmespath = stringify({jmespath: REQUEST_QUERY(packageName, analysis)});
        return httpClient.get(
            `${apiUrl}/${packageName}/openapi.json?${jmespath}`,
        ).then(result => result.data);
    },

    getReadme: async () => {
        let queryParams = stringify({jmespath: MAIN_README_QUERY});
        return httpClient.get(
            `${apiUrl}/admin/manifest.json?${queryParams}`,
        ).then(result => result.data);
    },

    getNotebook: async ({packageName, analysis}) => {
        return httpClient.get(
            `${apiUrl}/_notebook/${packageName}.${analysis}`,
        ).then(result => result.data);
    },


})