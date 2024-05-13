import React, {useMemo} from "react";
import {useCustom} from "@refinedev/core";
// import dynamic from 'next/dynamic'

import {memoize} from "lodash";
import {JinjatDataset} from "@components/crud/utils";

//
// const ReactEChartsComponent = dynamic(() => import('echarts-for-react'), {
//     ssr: false,
// })

export interface JinjatEChartsProps {
    dataset: JinjatDataset;
    options?: EChartsOptions;
    theme?: string
}

type EChartsOptions = object;

export const JinjatECharts: React.FC<JinjatEChartsProps> = ({
                                                                dataset,
                                                                options = {},
                                                                theme,
                                                            }) => {
    // @ts-ignore
    const isRenderable = memoize(() => (Array.isArray(options?.dataset) && options?.dataset[0]?.source == null) || (options?.dataset?.source == null))
    const { data, isLoading, isError } = useCustom<[]>({
        url: `/_analysis/${dataset.analysis}`,
        method: "get",
        config: {
            query: dataset.query_params,
            payload: dataset.body
        },
        queryOptions: {
            queryKey: ["_analysis", dataset],
        }
    });

    const memoOptions = useMemo(() => {
        if(data?.data) {
            // @ts-ignore
            options["dataset"] = [
                {source: data?.data},
                // @ts-ignore
                ...(options["datasets"] || []),
            ];

            // @ts-ignore
            options["yAxis"] = options["yAxis"] = {}
            // @ts-ignore
            options["xAxis"] = options["xAxis"] = {}
            console.log('echarts', options)
        }

        return options
    }, [options, data]);

    if (isLoading) {
        return <div>loading..</div>;
    }

    if (isError) {
        return <div>Something went wrong!</div>;
    }

    return (
        // <ReactEChartsComponent.ReactECharts
        <div
            // echarts={echarts}
            // option={memoOptions}
            // notMerge={true}
            // lazyUpdate={true}
            // theme={theme || "default"}
        />
    );
};

JinjatECharts.displayName = "ECharts"