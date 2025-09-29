"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Highcharts from "highcharts";
import { useProjectProfile } from "../ProjectProfileProvider";
import { LinearProgress } from "@mui/material";

const HighchartsReact = dynamic(
  () => import("highcharts-react-official"),
  { ssr: false }
);

interface BudgetBulletDataPoint {
  y: number;
  target: number;
}

interface BudgetBulletChartOptions extends Highcharts.Options {
  chart: Highcharts.ChartOptions & {
    type: "bullet";
  };
  series: Highcharts.SeriesOptionsType[] | Array<Highcharts.SeriesBulletOptions>;
}

function BudgetBullet() {
  const { project }: any = useProjectProfile();

  const [isBulletLoaded, setIsBulletLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("highcharts/modules/bullet")
        .then((mod) => {
          const bullet = (mod && (mod.default ?? mod)) as any;
          if (typeof bullet === "function") {
            bullet(Highcharts);
          } else {
            console.warn("bullet module is not a function:", mod);
          }
        })
        .catch((err) => {
          console.error("Failed to load bullet module:", err);
        })
        .finally(() => {
          setIsBulletLoaded(true);
        });
    }
  }, []);

  if (!isBulletLoaded) {
    return <LinearProgress/>;
  }

  const options: BudgetBulletChartOptions = {
    chart: {
      inverted: true,
      type: "bullet",
      height: 130,
      marginLeft: 130,
    },
    title: {
      text: "Budget",
    },
    xAxis: {
      categories: [
        `<span class="hc-cat-title">Budget</span><br/>(${project.budget.toLocaleString()})`,
      ],
    },
    yAxis: {
      gridLineWidth: 0,
      plotBands: [
        {
          from: 0,
          to: project.budget,
          color: "#29A3AD",
        },
      ],
      title: { text: undefined },
    },
    series: [
      {
        type: "bullet",
        name: "Budget",
        data: [
          {
            y: 750000,
            target: 600000,
          } as BudgetBulletDataPoint,
        ],
        targetOptions: {
          width: "200%",
        },
      },
    ],
    tooltip: {
      pointFormat: "<b>{point.y}</b> (with target at {point.target})",
    },
    legend: {
      enabled: false,
    },
    plotOptions: {
      series: {
        pointPadding: 0.25,
        borderWidth: 0,
        color: "#000",
        targetOptions: {
          width: '200%'
        }
      } as Highcharts.PlotSeriesOptions,
    },
    exporting: {
      enabled: false,
    },
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
}

export default BudgetBullet;