import ReactECharts from "echarts-for-react";
import React, {useEffect, useMemo} from "react";
import {JinjatEChartsProps} from "@components/crud/utils";
import {HttpError, useCustom, useList, useShow} from "@refinedev/core";
import * as echarts from "echarts";
import {memoize} from "lodash";

export const JinjatECharts: React.FC<JinjatEChartsProps> = ({
                                                                dataset,
                                                                options,
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
                {dimensions: ["test"], source: data?.data},
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
        <ReactECharts
            echarts={echarts}
            option={memoOptions}
            notMerge={true}
            lazyUpdate={true}
            theme={theme || "default"}
        />
    );
};
