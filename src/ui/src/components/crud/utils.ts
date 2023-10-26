import {RefineResource} from "@components/hooks/schema";

export interface JinjatFormProps {
    packageName: string;
    version: string;
    resources: RefineResource,
    params?: string;
    title?: string,
    logo?: React.ReactNode
}


export interface JinjatExposureProps {
    packageName: string;
    exposure: string
}

export interface JinjatListProps extends JinjatFormProps {
    enableActions: boolean
}

export interface JinjatNotebookProps {
    packageName: string;
    analysis: string | null;
    source? : string
}

export interface JinjatEChartsProps {
    dataset: JinjatDataset;
    options: EChartsOptions;
    theme?: string
}

type EChartsOptions = object;

export interface JinjatComponent {
    name : string;
    args: Map<string, any>;
}

export interface JinjatDataset {
    analysis: string;
    body?: Map<string, any>;
    query_params: Map<string, any>;
}

