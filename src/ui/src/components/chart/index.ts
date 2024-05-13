import {JinjatECharts} from "@components/chart/JinjatECharts";
import {JinjatLineChart} from "@components/chart/LineChart";
import {JinjatKPI} from "@components/chart/JinjatKPI";
import React from "react";


const allComponents: { [index: string]: React.FC<any> } = {}
allComponents[JinjatECharts.displayName] = JinjatECharts
allComponents[JinjatLineChart.displayName] = JinjatLineChart
allComponents[JinjatKPI.displayName] = JinjatKPI
export default allComponents