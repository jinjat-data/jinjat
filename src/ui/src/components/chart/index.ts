import { JinjatECharts } from "@components/chart/JinjatECharts";
import { JinjatKPI } from "@components/chart/JinjatKPI";
import { JinjatDataset } from "@components/crud/utils";

import { JinjatLineChart } from "@components/chart/LineChart";
import { JinjatBarChart } from "@components/chart/BarChart";

const allComponents = {};
allComponents[JinjatECharts.displayName] = JinjatECharts;
allComponents[JinjatKPI.displayName] = JinjatKPI;

allComponents[JinjatLineChart.displayName] = JinjatLineChart;
allComponents[JinjatBarChart.displayName] = JinjatBarChart;
export default allComponents;
