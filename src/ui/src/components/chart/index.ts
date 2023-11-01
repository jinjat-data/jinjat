import { JinjatECharts } from "@components/chart/JinjatECharts";
import { JinjatKPI } from "@components/chart/JinjatKPI";
import { JinjatDataset } from "@components/crud/utils";

import { JinjatLineChart } from "@components/chart/LineChart";
import { JinjatBarChart } from "@components/chart/BarChart";
import { JinjatAreaChart } from "@components/chart/AreaChart";

const allComponents = {};
allComponents[JinjatECharts.displayName] = JinjatECharts;
allComponents[JinjatKPI.displayName] = JinjatKPI;

allComponents[JinjatLineChart.displayName] = JinjatLineChart;
allComponents[JinjatBarChart.displayName] = JinjatBarChart;
allComponents[JinjatAreaChart.displayName] = JinjatAreaChart;
export default allComponents;
