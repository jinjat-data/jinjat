import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import styles from './dashboard.module.css';
import {Responsive, WidthProvider} from "react-grid-layout";

import React, {useEffect, useState} from "react";
import {JinjatExposureProps} from "@components/crud/utils";
import {useJinjatProvider} from "@components/hooks/useSchemaProvider";
import {DashboardItem} from "@components/hooks/schema";
import {findComponentByName} from "../../interfaces/createComponents";

const ResponsiveGridLayout = WidthProvider(Responsive);

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

    if(items == null) {
        return <div>Loading..</div>
    }

    return (
        <ResponsiveGridLayout
            className="layout"
            cols={{lg: 10, md: 8, sm: 6, xs: 4, xxs: 2}}
            rowHeight={90}
            containerPadding={[10, 10]}
            margin={[10, 10]}
            isDraggable={false}
            isResizable={false}
        >
            {items.map((val, idx) => {
                // @ts-ignore
                const ComponentToRender = findComponentByName(val.component.name);

                debugger
                return <div key={idx} data-grid={{x: idx, y: idx, w: 2, h: 2}} className={styles.dashboardItem}>
                    <ComponentToRender {...val.component.arguments} />
                </div>;
            })}
        </ResponsiveGridLayout>
    )
}