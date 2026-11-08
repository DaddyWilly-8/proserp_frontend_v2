'use client'

import React from 'react';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Box, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { BatchSummary } from './batchTypes';

/** Feed given, weight gained and the feed conversion between one weighing and the next. */
const FcrTrend = ({ trend }: { trend: BatchSummary['fcr_trend'] }) => {
  const t = useDictionary().bioProduction.batches.summary.fcrTrend;
  const { theme } = useJumboTheme();
  // Between one weighing and the next: feed given, weight gained, and the ratio of the two. The first interval starts from nothing.
  const intervals = (trend ?? []).map((point, index, all) => {
    const before = index > 0 ? all[index - 1] : { feed_kg: 0, gain_kg: 0 };
    const feed = Number(point.feed_kg ?? 0) - Number(before.feed_kg ?? 0);
    const gain = Number(point.gain_kg ?? 0) - Number(before.gain_kg ?? 0);

    return { date: point.date, feed: Math.round(feed * 1000) / 1000, gain: Math.round(gain * 1000) / 1000, fcr: gain > 0.001 && feed > 0 ? Math.round((feed / gain) * 100) / 100 : null };
  });

  if ((trend ?? []).filter((point) => point.fcr != null).length < 2) return <Typography color='text.secondary' p={2}>{t.none}</Typography>;

  return (
    <Box p={2}>
      <Box sx={{ height: { xs: 280, md: 300 } }}>
        <ResponsiveContainer width='100%' height='100%'>
          <ComposedChart data={intervals} margin={{ top: 6, right: 0, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray='3 3' stroke={theme.palette.divider} vertical={false} />
            <XAxis dataKey='date' tickFormatter={(date) => dayjs(String(date)).format('D MMM')} tick={{ fontSize: 11 }} minTickGap={18} />
            <YAxis yAxisId='kg' tick={{ fontSize: 11 }} />
            <YAxis yAxisId='fcr' orientation='right' tick={{ fontSize: 11 }} domain={[0, 'auto']} />
            <Tooltip
              labelFormatter={(date) => dayjs(String(date)).format('ddd, D MMM YYYY')}
              formatter={(value, name) => [name === t.interval.fcr ? Number(value).toFixed(2) : `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 })} kg`, name]}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
            <Bar yAxisId='kg' dataKey='feed' name={t.interval.feed} fill={theme.palette.primary.main} radius={[3, 3, 0, 0]} isAnimationActive={false} />
            <Bar yAxisId='kg' dataKey='gain' name={t.interval.gain} fill={theme.palette.info.main} radius={[3, 3, 0, 0]} isAnimationActive={false} />
            <Line yAxisId='fcr' type='monotone' dataKey='fcr' name={t.interval.fcr} stroke={theme.palette.success.dark} strokeWidth={2} connectNulls dot={{ r: 3 }} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default FcrTrend;
