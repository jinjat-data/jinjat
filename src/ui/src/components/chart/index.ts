import { JinjatECharts } from "@components/chart/JinjatECharts";
import { JinjatKPI } from "@components/chart/JinjatKPI";
import { JinjatDataset } from "@components/crud/utils";

import { JinjatLineChart } from "@components/chart/LineChart";
import { JinjatBarChart } from "@components/chart/BarChart";
import { JinjatAreaChart } from "@components/chart/AreaChart";
import { JinjatBubbleChart } from "@components/chart/BubbleChart";
import { JinjatFunnelChart } from "@components/chart/FunnelChart";
import { JinjatSankeyChart } from "@components/chart/SankeyChart";

const allComponents = {};
allComponents[JinjatECharts.displayName] = JinjatECharts;
allComponents[JinjatKPI.displayName] = JinjatKPI;

allComponents[JinjatLineChart.displayName] = JinjatLineChart;
allComponents[JinjatBarChart.displayName] = JinjatBarChart;
allComponents[JinjatAreaChart.displayName] = JinjatAreaChart;
allComponents[JinjatBubbleChart.displayName] = JinjatBubbleChart;
allComponents[JinjatFunnelChart.displayName] = JinjatFunnelChart;
allComponents[JinjatSankeyChart.displayName] = JinjatSankeyChart;

export default allComponents;
