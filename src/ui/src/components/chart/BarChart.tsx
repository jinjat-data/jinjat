import React from "react";
import {
  JinjatECharts,
  JinjatEChartsProps,
} from "@components/chart/JinjatECharts";

interface JinjatBarChartsProps extends JinjatEChartsProps {
  data: undefined;
  x: undefined;
  y: undefined;
}

export const JinjatBarChart: React.FC<JinjatBarChartsProps> = (props) => {
  const options = props.options || {};
  if (options.series != null) {
    return (
      <div>
        `options.series` is not null, please use `ECharts` component instead.
      </div>
    );
  }
  options.series = [
    {
      type: "bar",
      encode: {
        data: props.data,
        x: props.x,
        y: props.y,
      },
    },
  ];
  return <JinjatECharts {...props} options={options} />;
};

JinjatBarChart.displayName = "BarChart";
