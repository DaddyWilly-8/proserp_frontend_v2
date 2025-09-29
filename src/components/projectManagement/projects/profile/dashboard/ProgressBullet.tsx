"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Highcharts from "highcharts";
import { LinearProgress } from "@mui/material";

const HighchartsReact = dynamic(() => import("highcharts-react-official"), { ssr: false });

function ProgressBullet() {
  const [isReady, setIsReady] = useState(false);

useEffect(() => {
  let mounted = true;

  async function loadBulletModule() {
    try {
      const mod: any =
        await import("highcharts/modules/bullet");

      const initFn = (mod as any)?.default ?? (mod as any);
      if (typeof initFn === "function") {
        initFn(Highcharts);
      }
    } catch (err) {
      console.error("Failed to load bullet module:", err);
    } finally {
      if (mounted) setIsReady(true);
    }
  }

  loadBulletModule();

  return () => {
    mounted = false;
  };
}, []);


  if (!isReady) return <LinearProgress />;

  const options: Highcharts.Options = {
    chart: {
      inverted: true,
      type: "bullet",
      height: 130,
      marginLeft: 130,
    },
    title: {
      text: "Progress",
    },
    xAxis: {
      categories: ["Progress"],
    },
    yAxis: {
      gridLineWidth: 0,
      plotBands: [
        {
          from: 0,
          to: 100,
          color: "#29A3AD",
        },
      ],
      title: { text: undefined },
    },
    series: [
      {
        type: "bullet",
        name: "Progress",
        data: [{ y: 14, target: 29 }],
        targetOptions: { width: "200%" },
      } as Highcharts.SeriesOptionsType,
    ],
    tooltip: {
      pointFormat: "<b>{point.y}</b> (with target at {point.target})",
    },
    legend: { enabled: false },
    plotOptions: {
      bullet: {
        pointPadding: 0.25,
        borderWidth: 0,
        color: "#000",
        targetOptions: { width: "200%" },
      } as Highcharts.PlotBulletOptions,
    },
    exporting: { enabled: false },
    accessibility: { enabled: false },
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
}

export default ProgressBullet;
