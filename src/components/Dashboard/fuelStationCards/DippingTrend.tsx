"use client";

import React, { useMemo } from "react";
import { Alert, Typography } from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import dayjs from "dayjs";
import { COLORS } from "@/utilities/constants/colors";

// --------- Types ---------
interface Tank {
  calculated_stock: number;
  deviation: number;
  reading: number;
}

interface Reading {
  name: string;
  tanks: Tank[];
}

interface Report {
  as_at: string;
  readings: Reading[];
}

interface Station {
  report_data?: Report[];
}

export type SelectedType = "calculated stock" | "deviation" | "reading";

interface DippingTrendProps {
  reportData: Station[];
  selectedType: SelectedType;
}

interface ChartPoint {
  time: Date;
  value: number;
}

interface ChartDataset {
  name: string;
  data: ChartPoint[];
}

// --------- Utility: Generate chart data ---------
function generateChartData(
  stations: Station[],
  selectedType: SelectedType
): ChartDataset[] {
  const timestamps = new Set<string>();
  const productSeriesData: Record<string, ChartPoint[]> = {};

  // Collect unique timestamps
  stations?.forEach((station) => {
    station.report_data?.forEach((report) => {
      timestamps.add(report.as_at);
    });
  });

  // Sort timestamps
  const sortedTimestamps = Array.from(timestamps).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  sortedTimestamps?.forEach((timestamp) => {
    const aggregatedProductValues: Record<string, number> = {};

    stations?.forEach((station) => {
      const reportAtTimestamp = station.report_data?.find(
        (report) =>
          new Date(report.as_at).getTime() === new Date(timestamp).getTime()
      );

      if (reportAtTimestamp) {
        reportAtTimestamp.readings?.forEach((reading) => {
          const productName = reading.name;
          let totalValue = 0;

          reading.tanks?.forEach((tank) => {
            if (selectedType === "calculated stock") {
              totalValue += tank.calculated_stock;
            } else if (selectedType === "deviation") {
              totalValue += tank.deviation;
            } else {
              totalValue += tank.reading;
            }
          });

          aggregatedProductValues[productName] =
            (aggregatedProductValues[productName] || 0) + totalValue;
        });
      }
    });

    // Push aggregated values into series
    Object.keys(aggregatedProductValues).forEach((productName) => {
      if (!productSeriesData[productName]) {
        productSeriesData[productName] = [];
      }
      productSeriesData[productName].push({
        time: new Date(timestamp),
        value: aggregatedProductValues[productName],
      });
    });
  });

  return Object.keys(productSeriesData).map((productName) => ({
    name: productName,
    data: productSeriesData[productName],
  }));
}

// --------- Custom Tooltip ---------
const CustomTooltip: React.FC<TooltipProps<number, string>> = ({
  active,
  payload,
  label,
}) => {
  if (active && payload && payload.length) {
    const formattedDate = dayjs(label as string).format(
      "dddd, MMMM D, YYYY, h:mm A"
    );

    return (
      <div
        className="custom-tooltip"
        style={{
          backgroundColor: "white",
          border: "1px solid #ccc",
          padding: "10px",
        }}
      >
        <Typography variant="body2">{formattedDate}</Typography>
        {payload.map((item, index) => (
          <Typography key={index} style={{ marginTop: "5px" }}>
            {item.name}: {item.value?.toLocaleString()}
          </Typography>
        ))}
      </div>
    );
  }
  return null;
};

// --------- Colors ---------
function getColorByIndex(index: number): string {
  return COLORS[index % COLORS.length];
}

// --------- Component ---------
const DippingTrend: React.FC<DippingTrendProps> = ({
  reportData,
  selectedType,
}) => {
  const chartData = useMemo(
    () => generateChartData(reportData, selectedType),
    [reportData, selectedType]
  );

  // Merge series for recharts
  const combinedData = chartData.reduce<Record<string, any>>((acc, dataset) => {
    dataset?.data?.forEach(({ time, value }) => {
      const timeString = time.toISOString();
      if (!acc[timeString]) {
        acc[timeString] = { time };
      }
      acc[timeString][dataset.name] = value;
    });
    return acc;
  }, {});

  const finalData = Object.values(combinedData);

  return (
    <div>
      <Typography mb={2} variant="h5" gutterBottom>
        Dipping Trend
      </Typography>
      <ResponsiveContainer width="100%" height={220}>
        {finalData.length > 0 ? (
          <LineChart data={finalData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              tickFormatter={(time) => dayjs(time).format("ddd, MMM D, YYYY")}
            />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: "12px", paddingBottom: 40 }} />
            {chartData.map((dataset, index) => (
              <Line
                key={dataset.name}
                type="monotone"
                dataKey={dataset.name}
                stroke={getColorByIndex(index)}
                dot={false}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        ) : (
          <Alert variant="outlined" severity="info">
            No Trend for the selected period
          </Alert>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default DippingTrend;
