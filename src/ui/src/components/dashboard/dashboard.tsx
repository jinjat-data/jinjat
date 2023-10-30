import React, {useEffect, useState} from "react";
import {JinjatExposureProps} from "@components/crud/utils";
import {useJinjatProvider} from "@components/hooks/useSchemaProvider";
import {DashboardItem} from "@components/hooks/schema";
import {allComponents} from "../../interfaces/createComponents";
import Grid from '@mui/material/Unstable_Grid2';
import {ErrorBoundary} from "react-error-boundary";
import {Alert, AlertTitle} from "@mui/material";
import Paper from "@mui/material/Paper";

export const JinjatDashboard: React.FC<JinjatExposureProps> = ({packageName, exposure}) => {
    const [items, setItems] = useState<Array<DashboardItem>>()
    const schemaProvider = useJinjatProvider();
    const dashboard = schemaProvider.getDashboard(packageName, exposure)

    useEffect(() => {
        dashboard.then(module => {
            setItems(module.items)
        }).catch(err => {
            console.log(err)
            setItems(undefined)
        })
    }, [])

    if (items == null) {
        return <div>Loading..</div>
    }

    function findComponentByName(componentName: string): any {
        const internalComponentName = Object.keys(allComponents).find(name => name.toLowerCase() === componentName.toLowerCase());
        return allComponents[internalComponentName!!]
    }

    function fallbackRender({error, resetErrorBoundary}) {
        return (
            <Alert severity="error">
                <AlertTitle>Unable to render component</AlertTitle>
                {error.message}
            </Alert>
        );
    }

    return (
        <Grid container spacing={2} columns={16}>
            {items.map((val, idx) => {
                // @ts-ignore
                const ComponentToRender = findComponentByName(val.component.name);
                return <Grid key={idx} xs={val.width} md={val.width}>
                    <Paper variant={'outlined'}>
                        <ErrorBoundary FallbackComponent={fallbackRender}>
                            <ComponentToRender {...val.component.arguments} />
                        </ErrorBoundary>
                    </Paper>
                </Grid>
            })}
        </Grid>
    )
}