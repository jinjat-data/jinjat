import { JinjatECharts } from "@components/chart/JinjatECharts";
import { JinjatKPI } from "@components/chart/JinjatKPI";
import { JinjatDataset } from "@components/crud/utils";

import { JinjatLineChart } from "@components/chart/LineChart";
import { JinjatBarChart } from "@components/chart/BarChart";
import { JinjatAreaChart } from "@components/chart/AreaChart";
import { JinjatBubbleChart } from "@components/chart/BubbleChart";

const allComponents = {};
allComponents[JinjatECharts.displayName] = JinjatECharts;
allComponents[JinjatKPI.displayName] = JinjatKPI;

allComponents[JinjatLineChart.displayName] = JinjatLineChart;
allComponents[JinjatBarChart.displayName] = JinjatBarChart;
allComponents[JinjatAreaChart.displayName] = JinjatAreaChart;
allComponents[JinjatBubbleChart.displayName] = JinjatBubbleChart;

export default allComponents;
