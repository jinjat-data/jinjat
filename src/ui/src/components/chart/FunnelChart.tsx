import React from "react";
import {
  JinjatECharts,
  JinjatEChartsProps,
} from "@components/chart/JinjatECharts";

interface JinjatFunnelChartsProps extends JinjatEChartsProps {
  data: undefined;
  nameCol: undefined;
  valueCol: undefined;
}

export const JinjatFunnelChart: React.FC<JinjatFunnelChartsProps> = (props) => {
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
      type: "funnel",
      encode: {
        data: props.data,
        nameCol: props.nameCol,
        valueCol: props.valueCol,
      },
    },
  ];
  return <JinjatECharts {...props} options={options} />;
};

JinjatFunnelChart.displayName = "FunnelChart";
