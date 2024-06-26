import React from "react";
import {
    JinjatECharts,
    JinjatEChartsProps,
} from "@components/chart/JinjatECharts";

interface JinjatLineChartsProps extends JinjatEChartsProps {
    x: string;
    y: string;
}

export const JinjatLineChart: React.FC<JinjatLineChartsProps> = (props) => {
    const options = props.options || ({} as any);
    if (options.series != null) {
        return (
            <div>
                `options.series` is not null, please use `ECharts` component
                instead.
            </div>
        );
    }
    // @ts-ignore
    options.series = [
        {
            type: "line",
            encode: {
                x: props.x,
                y: props.y,
            },
        },
    ];
    return <JinjatECharts {...props} options={options} />;
};

JinjatLineChart.displayName = "LineChart";
