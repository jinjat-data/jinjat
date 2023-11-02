import React from "react";
import {
  JinjatECharts,
  JinjatEChartsProps,
} from "@components/chart/JinjatECharts";

interface JinjatSankeyChartsProps extends JinjatEChartsProps {
  data: undefined;
  sourceCol: "source";
  targetCol: "target";
  valueCol: "value";
}

export const JinjatSankeyChart: React.FC<JinjatSankeyChartsProps> = (props) => {
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
      type: "sankey",
      encode: {
        data: props.data,
        sourceCol: props.sourceCol,
        targetCol: props.targetCol,
        valueCol: props.valueCol,
      },
    },
  ];
  return <JinjatECharts {...props} options={options} />;
};

JinjatSankeyChart.displayName = "SankeyChart";
