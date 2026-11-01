'use client'

import React, { useState } from 'react';
import JumboCardQuick from '@jumbo/components/JumboCardQuick/JumboCardQuick';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Box, Button, ButtonGroup, FormControl, InputLabel, MenuItem, Select, Skeleton, Tooltip, Typography, useMediaQuery } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from 'recharts';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { dashboardServices } from '../bio-production-services';
import { Grouping, TrendMetric, TrendPeriod } from './dashboardTypes';

export interface TrendSeries {
  key: string;
  label: string;
  color: string;
}

const GROUPINGS: Grouping[] = ['day', 'week', 'month', 'year'];

/** How a period is named on the axis, and on hover. */
const axisLabel = (period: string, by: Grouping) => (by === 'month' ? dayjs(`${period}-01`).format('MMM YYYY') : by === 'year' ? period : dayjs(period).format('D MMM'));

const compact = (value: number) => (value >= 1000000 ? `${(value / 1000000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M` : value >= 1000 ? `${(value / 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })}k` : String(value));

/**
 * One trend over the dashboard's From and To, grouped by day, week, month or year at the card's own choice:
 * buttons on a wide screen and a drop-down on a smaller one, as on the general dashboard's trends.
 */
const TrendCard = ({ metric, title, series, stacked = false, kind = 'bar', params, money = false }: { metric: TrendMetric; title: string; series: TrendSeries[]; stacked?: boolean; kind?: 'bar' | 'area'; params: Record<string, unknown>; money?: boolean }) => {
  const dictionary = useDictionary();
  const t = dictionary.bioProduction.dashboard.trends;
  const { theme } = useJumboTheme();
  const narrow = useMediaQuery(theme.breakpoints.down('lg'));
  const [by, setBy] = useState<Grouping>('day');

  const { data, isLoading } = useQuery<{ periods: TrendPeriod[] }>({
    queryKey: ['bioDashboardTrend', metric, by, params],
    queryFn: () => dashboardServices.trend({ ...params, metric, aggregate_by: by }),
    placeholderData: (previous) => previous,
  });
  const Chart = kind === 'area' ? AreaChart : BarChart;
  const tooltips: Record<Grouping, string> = { day: dictionary.tooltips.dailyTrend, week: dictionary.tooltips.weeklyTrend, month: dictionary.tooltips.monthlyTrend, year: dictionary.tooltips.yearlyTrend };

  return (
    <JumboCardQuick
      title={title}
      sx={{ height: 360 }}
      action={
        narrow ? (
          <FormControl size='small' sx={{ minWidth: 120 }}>
            <InputLabel id={`${metric}-interval`}>{t.interval}</InputLabel>
            <Select labelId={`${metric}-interval`} value={by} label={t.interval} onChange={(event) => setBy(event.target.value as Grouping)}>
              {GROUPINGS.map((grouping) => <MenuItem key={grouping} value={grouping}>{t[grouping]}</MenuItem>)}
            </Select>
          </FormControl>
        ) : (
          <ButtonGroup variant='outlined' size='small' disableElevation>
            {GROUPINGS.map((grouping) => (
              <Tooltip key={grouping} title={tooltips[grouping]}>
                <Button variant={by === grouping ? 'contained' : 'outlined'} onClick={() => setBy(grouping)}>{t[grouping]}</Button>
              </Tooltip>
            ))}
          </ButtonGroup>
        )
      }
    >
      {isLoading || !data ? (
        <Skeleton variant='rounded' height={250} />
      ) : data.periods.length === 0 ? (
        <Typography color='text.secondary'>{t.none}</Typography>
      ) : (
        <Box sx={{ height: 270 }}>
          <ResponsiveContainer width='100%' height='100%'>
            <Chart data={data.periods} margin={{ top: 6, right: 6, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray='3 3' stroke={theme.palette.divider} vertical={false} />
              <XAxis dataKey='period' tickFormatter={(period) => axisLabel(String(period), by)} tick={{ fontSize: 11 }} minTickGap={18} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={compact} allowDecimals={false} />
              <ChartTooltip
                labelFormatter={(period) => (by === 'week' ? t.weekOf.replace('{date}', dayjs(String(period)).format('D MMM YYYY')) : by === 'day' ? dayjs(String(period)).format('ddd, D MMM YYYY') : axisLabel(String(period), by))}
                formatter={(value, name) => [money ? Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : Number(value).toLocaleString(), name]}
              />
              {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
              {series.map((item) =>
                kind === 'area' ? (
                  <Area key={item.key} type='monotone' dataKey={item.key} name={item.label} stroke={item.color} fill={item.color} fillOpacity={0.15} strokeWidth={2} dot={{ r: 2.5 }} activeDot={{ r: 4 }} isAnimationActive={false} />
                ) : (
                  <Bar key={item.key} dataKey={item.key} name={item.label} fill={item.color} stackId={stacked ? 'stack' : undefined} radius={stacked ? 0 : [3, 3, 0, 0]} isAnimationActive={false} />
                ),
              )}
            </Chart>
          </ResponsiveContainer>
        </Box>
      )}
    </JumboCardQuick>
  );
};

export default TrendCard;
