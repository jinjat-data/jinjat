import React from "react";
import {List, useDataGrid, EditButton, ShowButton, DeleteButton} from "@refinedev/mui";
import {DataGrid, GridToolbar, GridValueFormatterParams, GridNativeColTypes, GridColDef} from "@mui/x-data-grid";
import {HttpError, Option} from "@refinedev/core";
import {Type, useSchema} from "@components/hooks/useSchema";
import {Generate, JsonSchema} from "@jsonforms/core";
import {JinjatListProps} from "@components/crud/utils";
import {fmt} from "@components/chart/formatting";
import {JinjatJsonSchema} from "@components/hooks/schema";
import {Skeleton} from "@mui/material";
import {actionsColumn, getDataGridType} from "../../utils/grid";

export const JinjatList: React.FC<JinjatListProps> = ({
                                                          packageName,
                                                          version,
                                                          resources,
                                                          enableActions,
                                                          logo,
                                                          title,
                                                          ...props
                                                      }) => {
    let analysis = resources.list;
    if (analysis == null) {
        return <div>Unable to fetch schema</div>;
    }

    const {dataGridProps} = useDataGrid({
        syncWithLocation: true,
        resource: `_analysis/${packageName}.${analysis}`,
        meta: {
            _json_columns: ['columns']
        },
        pagination: {
            mode: 'server'
        }
    });

    const {data: jinjatSchema, isLoading: isSchemaLoading, isError: isSchemaError} = useSchema<JsonSchema, HttpError>({
        analysis: `${packageName}.${analysis}`,
        config: {type: Type.RESPONSE}
    })

    const properties = React.useMemo<JinjatJsonSchema>(() => {
        let schemaProperties = jinjatSchema?.schema?.items?.properties;
        if (schemaProperties != null) {
            return schemaProperties
        }
        if (dataGridProps.rows?.length > 0) {
            return Generate.jsonSchema(dataGridProps.rows[0]).properties;
        } else {
            return null
        }
    }, [jinjatSchema, dataGridProps])

    const rowIdColumn = React.useMemo(() => {
        let rowIdColumn = jinjatSchema?.schema?.items?.['x-pk'];
        if (rowIdColumn != null || properties == null) {
            return rowIdColumn
        }

        let objectKeys = Object.keys(properties);
        const pkColumn  = objectKeys.find(key => properties[key]['x-pk'] === true)
        if(pkColumn != null) {
            return pkColumn
        }

        return objectKeys.find(prop => prop.toLowerCase() == 'id')
    }, [jinjatSchema])

    const allColumns = React.useMemo(() => {
        if (properties == null) {
            return null
        }
        const fieldColumns = Object.entries(properties).map(([key, value]) => (
                {
                    field: key,
                    headerName: value.label || key,
                    type: getDataGridType(value.type),
                    filterable: value.filterable,
                    description: value.description,
                    resizable: value.resizable,
                    sortable: value.sortable,
                    headerAlign: rowIdColumn == key ? "left" : undefined,
                    align: rowIdColumn == key ? "left" : undefined,
                    valueFormatter: (params: GridValueFormatterParams<Option>) => {
                        return fmt(params.value, 'auto');
                    },
                    flex: 1,
                    renderCell: function render({row}) {
                        if (isSchemaLoading) {
                            return "Loading...";
                        }

                        return row[key]
                    },
                } as GridColDef
            )
        )

        return enableActions && rowIdColumn != null ? [
            ...fieldColumns,
            actionsColumn(rowIdColumn),
        ] : fieldColumns
    }, [enableActions, properties, rowIdColumn])


    if (isSchemaLoading || dataGridProps?.loading) {
        return <Skeleton height={30}/>;
    }

    if (isSchemaError) {
        return <div>Something went wrong!</div>;
    }

    if (allColumns == null) {
        return <div>No data or schema found</div>;
    }

    return (
        <List title={title}>
            <DataGrid {...dataGridProps}
                      columns={allColumns}
                      sx={{overflowX: 'scroll'}}
                      autoHeight
                      getRowId={(row) => {
                          let rowElement = row[rowIdColumn];
                          if (rowElement == null) {
                              rowElement = dataGridProps.rows.indexOf(row)
                          }
                          return rowElement;
                      }}
                      slots={{toolbar: GridToolbar}}
                      {...props.datagrid}
            />
        </List>
    );
};