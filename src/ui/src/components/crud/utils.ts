import {JinjatSchema, RefineResource} from "@components/hooks/schema";
import {DataGridProps} from "@mui/x-data-grid/models/props/DataGridProps";
import {JinjatJsonFormsInitStateProps} from "../../jsonforms/JinjatForm";
import {QueryObserverResult} from "@tanstack/react-query";
import {HttpError} from "@refinedev/core";

export interface JinjatFormProps  {
    packageName: string;
    version: string;
    resources: RefineResource<string | QueryObserverResult<JinjatSchema, HttpError>>;
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

export interface JinjatDataset {
    analysis: string;
    body?: Map<string, any>;
    query_params: Map<string, any>;
}

