import React from "react";
import {
  JinjatECharts,
  JinjatEChartsProps,
} from "@components/chart/JinjatECharts";

interface JinjatBubbleChartsProps extends JinjatEChartsProps {
  data: undefined;
  x: undefined;
  y: undefined;
  size: undefined;
}

export const JinjatBubbleChart: React.FC<JinjatBubbleChartsProps> = (props) => {
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
      type: "scatter",
      encode: {
        data: props.data,
        x: props.x,
        y: props.y,
        size: props.size,
      },
    },
  ];
  return <JinjatECharts {...props} options={options} />;
};

JinjatBubbleChart.displayName = "BubbleChart";
