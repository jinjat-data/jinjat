import {RefineResource} from "@components/hooks/schema";
import {DataGridProps} from "@mui/x-data-grid/models/props/DataGridProps";
import {JinjatJsonFormsInitStateProps} from "../../jsonforms/JinjatForm";

export interface JinjatFormProps  {
    packageName: string;
    version: string;
    resources: RefineResource<string>;
    params?: string;
    title?: string;
    logo?: React.ReactNode;
    form?: Omit<JinjatJsonFormsInitStateProps<any>, 'data' | 'schema'>;
}


export interface JinjatExposureProps {
    packageName: string;
    exposure: string
}

export interface JinjatListProps extends JinjatFormProps {
    datagrid?: DataGridProps
    enableActions: boolean
}

export interface JinjatNotebookProps {
    packageName: string;
    analysis: string | null;
    source? : string
}

export interface JinjatDataset {
    analysis: string;
    body?: Map<string, any>;
    query_params: Map<string, any>;
}

