import React from "react";
import {List, useDataGrid, EditButton, ShowButton, DeleteButton} from "@refinedev/mui";
import {DataGrid, GridToolbar, GridValueFormatterParams, GridNativeColTypes, GridColDef} from "@mui/x-data-grid";
import {HttpError, Option} from "@refinedev/core";
import {Type, useSchema} from "@components/hooks/useSchema";
import {JsonSchema} from "@jsonforms/core";
import {JinjatFormProps, JinjatListProps} from "@components/crud/utils";

export const JinjatList: React.FC<JinjatListProps> = ({packageName, version, resources, enableActions, logo, title}) => {
    let analysis = resources.list;
    if (analysis == null) {
        return <div>Unable to fetch schema</div>;
    }

    const {dataGridProps} = useDataGrid({
        syncWithLocation: true,
        resource: `_analysis/${packageName}.${analysis}`,
        pagination: {
            mode: 'server'
        }
    });

    const {data: jinjatSchema, isLoading, isError} = useSchema<JsonSchema, HttpError>({
        analysis: `${packageName}.${analysis}`,
        config: {type: Type.RESPONSE}
    })

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (isError) {
        return <div>Something went wrong!</div>;
    }

    if (jinjatSchema?.schema == null) {
        return <div>Schema is not found!</div>;
    }

    const getDataGridType = (jinjatType: string): GridNativeColTypes => {
        return 'string'
    }

    jinjatSchema.schema.items = jinjatSchema.schema.items || {}
    // @ts-ignore
    let rowIdColumn = jinjatSchema.schema.items['x-pk'];
    // @ts-ignore
    let properties = jinjatSchema.schema.items?.properties;

    if (properties == null) {
        return <div>Unable to infer schema!</div>;
    }

    const fieldColumns = Object.entries(properties).map(([key, value]) => (
            {
                field: key,
                // @ts-ignore
                headerName: value.label || key,
                // @ts-ignore
                type: getDataGridType(value.type),
                // @ts-ignore
                filterable: value.filterable,
                // @ts-ignore
                sortable: value.sortable,
                headerAlign: rowIdColumn == key ? "left" : undefined,
                align: rowIdColumn == key ? "left" : undefined,
                flex: 1,
                valueFormatter: (params: GridValueFormatterParams<Option>) => {
                    return params.value;
                },
                renderCell: function render({row}) {
                    if (isLoading) {
                        return "Loading...";
                    }

                    return row[key]
                },
            } as GridColDef
        )
    )

    const actionsColumn = {
        field: "actions",
        headerName: "Actions",
        renderCell: function render({row}) {
            let recordItemId = `id:${row[rowIdColumn]}`;
            return (
                <>
                    <EditButton hideText recordItemId={recordItemId}/>
                    <ShowButton hideText recordItemId={recordItemId}/>
                    <DeleteButton hideText recordItemId={recordItemId}/>
                </>
            );
        },
        align: "center",
        flex: 1,
        headerAlign: "center",
        minWidth: 80,
    } as GridColDef;

    const allColumns = enableActions ? [
        ...fieldColumns,
        actionsColumn,
    ] : fieldColumns

    return (
        <List title={title} logo={logo}>
            <DataGrid {...dataGridProps} columns={allColumns} autoHeight getRowId={(row) => {
                let rowElement = row[rowIdColumn];
                if (rowElement == null) {
                    rowElement = 0
                }
                return rowElement;
            }} slots={{toolbar: GridToolbar}}/>
        </List>
    );
};