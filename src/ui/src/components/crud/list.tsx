import React from "react";
import { List, useDataGrid, EditButton, ShowButton, DeleteButton } from "@refinedev/mui";
import { DataGrid, GridToolbar, GridValueFormatterParams, GridNativeColTypes, GridColDef } from "@mui/x-data-grid";
import {HttpError, Option} from "@refinedev/core";
import {Type, useSchema} from "@components/hooks/useSchema";
import {JsonSchema} from "@jsonforms/core";
import {JinjatFormProps, JinjatListProps} from "@components/crud/utils";

export const JinjatList: React.FC<JinjatListProps> = ({packageName, analysis, enableActions}) => {
    if(analysis == null) {
        return <div>Unable to fetch schema</div>;
    }

    let resource = `${packageName}.${analysis}`;
    const {dataGridProps} = useDataGrid({
        syncWithLocation: true,
        resource: resource,
        pagination: {
            mode: 'server'
        }
    });

    const {data : schema, isLoading, isError} = useSchema<JsonSchema, HttpError>({
        resource: resource,
        config: {type: Type.RESPONSE}
    })

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (isError) {
        return <div>Something went wrong!</div>;
    }

    if (schema == null) {
        return <div>Schema is not found!</div>;
    }

    const getDataGridType = (jinjatType : string) : GridNativeColTypes => {
        return 'string'
    }

    schema.items = schema.items || {}
    // @ts-ignore
    let rowIdColumn = schema.items['x-pk'];
    // @ts-ignore
    let properties = schema.items?.properties;

    if(properties == null) {
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
        renderCell: function render({ row }) {
            return (
                <>
                    <EditButton hideText recordItemId={row[rowIdColumn]} />
                    <ShowButton hideText recordItemId={row[rowIdColumn]} />
                    <DeleteButton hideText recordItemId={row[rowIdColumn]} />
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
        <List>
            <DataGrid {...dataGridProps} columns={allColumns} autoHeight getRowId={(row) => {
                let rowElement = row[rowIdColumn];
                if(rowElement == null) {
                    rowElement = 0
                }
                return rowElement;
            }} slots={{ toolbar: GridToolbar }}/>
        </List>
    );
};