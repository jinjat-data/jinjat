import {DeleteButton, EditButton, ShowButton} from "@refinedev/mui";
import {GridColDef, GridNativeColTypes} from "@mui/x-data-grid";
import React from "react";

export const actionsColumn = (rowIdColumn : string) => ({
    field: "__actions",
    headerName: "Actions",
    filterable: false,
    sortable: false,
    hideable: false,
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
    minWidth: 100,
} as GridColDef);


export const getDataGridType = (jinjatType: string): GridNativeColTypes => {
    return 'string'
}