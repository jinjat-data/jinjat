import {AxiosInstance} from "axios";
import {stringify} from "query-string";
import {JsonSchema} from "@jsonforms/core";
import {axiosInstance} from "@refinedev/simple-rest";

enum FieldType {
    Boolean, Number, TimeDelta, Date, DateTime, Text
}

interface RefineResource {
    list: string;
    create: string;
    edit: string;
    show: string;

    [key: string]: any;
}

interface RefineAction {
    delete: string;

    [key: string]: any;
}

export interface RefineConfig {
    menu_icon?: string,
    actions?: RefineAction,
    resources?: RefineResource,
}

export interface Owner {
    email: string,
    name: string
}

export enum ResourceType {
    APPLICATION = "application", ANALYSIS = "analysis", DASHBOARD = "dashboard"
}

export interface JinjatResource {
    name: string,
    identifier: string,
    type: ResourceType,

    label?: string,
    description?: string

    package_name: string

    tags?: string

    refine: RefineConfig

    owner?: Owner
}

export interface JinjatProject {
    resources: JinjatResource[],

    package_name : string
    version: string
}

export interface DocFile {
    content : string
    file_path: string
}

export interface IJinjatContextProvider {
    getResponseSchema: (params: {
        packageName: string,
        analysis: string;
    }) => Promise<JsonSchema>;

    getRequestSchema: (params: {
        packageName: string,
        analysis: string;
    }) => Promise<JsonSchema>;

    getProject: () => Promise<JinjatProject>

    getApiUrl: () => string

    getAnalysisMethod: (packageName : string, analysis : string) => Promise<string | null>

    getReadme: () => Promise<DocFile>
}

const REQUEST_QUERY = (packageName : string, analysis: string) => `paths.*.*[] | [?ends_with(operationId, \`${analysis}\`)] | [0] | requestBody.content."application/json".schema`
const RESPONSE_QUERY = (packageName : string, analysis: string) => `paths.*.*[] | [?ends_with(operationId, \`${analysis}\`)] | [0] | responses."200".content."application/json".schema`
const EXPOSURES_QUERY = 'exposures.* | [?not_null(meta.jinjat.refine)].projection(`name, type, unique_id, description, package_name, refine, owner, label`, name, type, identifier, description, package_name, meta.jinjat.refine, owner, label)'
const MAIN_README_QUERY = 'docs."doc.{{project_name}}.__overview__".projection(\'file_path, content\', original_file_path, block_contents)'

const GET_ANALYSIS_QUERY = (analysis : string) => `nodes."analysis.{{project_name}}.${analysis}".config.jinjat.method`


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

    getApiUrl(): string {
        return apiUrl;
    },

    getAnalysisMethod(packageName: string, analysis: string): Promise<string | null> {
        let jmespath = stringify({jmespath: GET_ANALYSIS_QUERY(analysis)});
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
    }
})