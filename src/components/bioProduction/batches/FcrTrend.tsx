'use client'

import React from 'react';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Box, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { BatchSummary } from './batchTypes';

/** The batch's feed conversion so far, as it stood on each day a weight was read. */
const FcrTrend = ({ trend }: { trend: BatchSummary['fcr_trend'] }) => {
  const t = useDictionary().bioProduction.batches.summary.fcrTrend;
  const { theme } = useJumboTheme();
  const points = (trend ?? []).filter((point) => point.fcr != null);

  if (points.length < 2) return <Typography color='text.secondary' p={2}>{t.none}</Typography>;

  return (
    <Box p={2} sx={{ height: { xs: 280, md: 300 } }}>
      <ResponsiveContainer width='100%' height='100%'>
        <LineChart data={points} margin={{ top: 6, right: 6, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray='3 3' stroke={theme.palette.divider} vertical={false} />
          <XAxis dataKey='date' tickFormatter={(date) => dayjs(String(date)).format('D MMM')} tick={{ fontSize: 11 }} minTickGap={18} />
          <YAxis tick={{ fontSize: 11 }} domain={[0, 'auto']} allowDecimals />
          <Tooltip
            labelFormatter={(date) => dayjs(String(date)).format('ddd, D MMM YYYY')}
            formatter={(value, name, item: any) => (name === t.fcr ? [Number(value).toFixed(2), `${name} (${Number(item.payload.feed_kg).toLocaleString(undefined, { maximumFractionDigits: 1 })} kg / ${Number(item.payload.gain_kg).toLocaleString(undefined, { maximumFractionDigits: 1 })} kg)`] : [value, name])}
          />
          <Line type='monotone' dataKey='fcr' name={t.fcr} stroke={theme.palette.success.dark} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default FcrTrend;
