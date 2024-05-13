import React, {useState} from "react";
import {List, useDataGrid} from "@refinedev/mui";
import {DataGrid, GridColDef, GridToolbar, useGridApiRef} from "@mui/x-data-grid";
import {HttpError} from "@refinedev/core";
import {Type, useSchema} from "@components/hooks/useSchema";
import {Generate, JsonSchema} from "@jsonforms/core";
import {JinjatListProps} from "@components/refine/utils";
// @ts-ignore
import {fmt} from "@components/chart/formatting";
import {JinjatJsonSchema} from "@components/hooks/schema";
import {LinearProgress, Skeleton} from "@mui/material";
import {actionsColumn, getDataGridType} from "../../utils/grid";
import _ from "lodash";
import {QueryErrorComponent} from "@components/common/queryError";
import { OpenNotificationParams } from "@refinedev/core/dist/interfaces";

export const JinjatList: React.FC<JinjatListProps> = ({
                                                          packageName,
                                                          resources,
                                                          enableActions,
                                                          title,
                                                          ...props
                                                      }) => {
    const analysis = resources.list;
    if (analysis == null) {
        return <div>Unable to fetch schema</div>;
    }

    const [errors, setErrors] = useState([]);
    const analysisReference = `${packageName}.${analysis}`;
    const { dataGridProps, search } = useDataGrid({
        syncWithLocation: true,
        resource: `_analysis/${analysisReference}`,
        pagination: {
            mode: "server",
        },
        errorNotification: (error,
                            values,
                            resource) => {
            setErrors(error?.response.data.errors);
            return {
                message: error?.message,
                description: "Error",
                type: "error",
            } as OpenNotificationParams;
        },
    });

    const {data: jinjatSchema, isLoading: isSchemaLoading, isError: isSchemaError} = useSchema<JsonSchema, HttpError>({
        analysis: `${packageName}.${analysis}`,
        config: {type: Type.RESPONSE}
    })

    const properties = React.useMemo<JinjatJsonSchema>(() => {
        // @ts-ignore
        const schemaProperties = jinjatSchema?.schema?.items?.properties;
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
        // TODO: implement [key : string] for JsonSchema7
        // @ts-ignore
        const rowIdColumn = jinjatSchema?.schema?.items?.['x-pk'];
        if (rowIdColumn != null || properties == null) {
            return rowIdColumn
        }

        const objectKeys = Object.keys(properties);
        // @ts-ignore
        const pkColumn = objectKeys.find(key => properties[key]['x-pk'] === true)
        if (pkColumn != null) {
            return pkColumn
        }

        return objectKeys.find(prop => prop.toLowerCase() == 'id')
    }, [jinjatSchema]);

    debugger
    const allColumns = React.useMemo(() => {
        if (properties == null) {
            return null
        }
        const fieldColumns = Object.entries(properties).map(([key, column]) => (
                {
                    field: key,
                    headerName: column.label || key,
                    type: getDataGridType(column.type),
                    filterable: column.filterable,
                    description: column.description,
                    resizable: column.resizable,
                    sortable: column.sortable,
                    headerAlign: rowIdColumn == key ? "left" : undefined,
                    align: rowIdColumn == key ? "left" : undefined,
                    renderCell: function render({row}) {
                        if (isSchemaLoading) {
                            return "Loading...";
                        }

                        const format = column['x-jinjat-format'];
                        return fmt(row[key], format);
                    },
                    flex: 1,
                } as GridColDef
            )
        )

        return enableActions && rowIdColumn != null ? [
            ...fieldColumns,
            actionsColumn(rowIdColumn),
        ] : fieldColumns
    }, [enableActions, properties, rowIdColumn])

    const datagrid = React.useMemo(() => {
        return _.cloneDeep(props.datagrid || {})
    }, [props.datagrid])

    const apiRef = useGridApiRef();

    React.useEffect(() => {
        //
        if (allColumns != null && apiRef?.current?.restoreState != null && props.datagrid?.initialState != null) {
            apiRef?.current?.restoreState(props.datagrid?.initialState)
        }
    }, [allColumns]);

    if (isSchemaLoading || dataGridProps?.loading) {
        return <Skeleton height={30}/>;
    }

    if (isSchemaError) {
        return <div>Something went wrong!</div>;
    }

    if (allColumns == null) {
        return <div>No data or schema found</div>;
    }

    if (errors.length > 0) {
        return <QueryErrorComponent message={`Unable fetching ${analysisReference}`} errors={errors}/>
    }

    return (
        <List title={title}>
            <DataGrid {...dataGridProps}

                      apiRef={apiRef}
                      columns={allColumns}
                      autoHeight
                      getRowId={(row) => {
                          let rowElement = row[rowIdColumn];
                          if (rowElement == null) {
                              rowElement = dataGridProps.rows.indexOf(row)
                          }
                          return rowElement;
                      }}
                      slots={{toolbar: GridToolbar, loadingOverlay: LinearProgress}}
                      {...datagrid}
            />
        </List>
    );
};
