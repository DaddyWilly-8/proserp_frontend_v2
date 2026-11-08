'use client'

import React, { useMemo, useState } from 'react';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Box, Button, ButtonGroup, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { CartesianGrid, ComposedChart, Bar, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { BatchSummary } from './batchTypes';

type Grouping = 'day' | 'week' | 'month';

const compact = (value: number) => (value >= 1000000 ? `${(value / 1000000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M` : value >= 1000 ? `${(value / 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })}k` : String(value));
const two = (value: number) => Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** The start of the day, week (Monday) or month that a date falls in. */
const periodOf = (date: string, by: Grouping) => (by === 'month' ? dayjs(date).startOf('month') : by === 'week' ? dayjs(date).subtract((dayjs(date).day() + 6) % 7, 'day') : dayjs(date)).format('YYYY-MM-DD');

/**
 * Feed given over the whole of a batch's time, in kilograms (bars) and what it cost (line), by day, week or month.
 * Days with no feed show as zero so gaps in feeding are visible. Cost is drawn only when the user may see money.
 */
const FeedTrend = ({ trend, start, end, showCost }: { trend: BatchSummary['feed_trend']; start: string; end?: string | null; showCost: boolean }) => {
  const t = useDictionary().bioProduction.batches.summary.feedTrend;
  const { theme } = useJumboTheme();

  const lastDay = dayjs(end ?? undefined).format('YYYY-MM-DD');
  const firstDay = dayjs(start).format('YYYY-MM-DD');
  const span = dayjs(lastDay).diff(dayjs(firstDay), 'day') + 1;
  const [chosen, setChosen] = useState<Grouping | null>(null);
  const by: Grouping = chosen ?? (span > 180 ? 'month' : span > 45 ? 'week' : 'day');

  const data = useMemo(() => {
    const given = new Map((trend?.days ?? []).map((row) => [row.date, row]));
    const periods = new Map<string, { period: string; kg: number; cost: number }>();
    for (let date = dayjs(firstDay); !date.isAfter(dayjs(lastDay)); date = date.add(1, 'day')) {
      const key = date.format('YYYY-MM-DD');
      const period = periodOf(key, by);
      const row = periods.get(period) ?? { period, kg: 0, cost: 0 };
      row.kg += given.get(key)?.kg ?? 0;
      row.cost += given.get(key)?.cost ?? 0;
      periods.set(period, row);
    }
    // Feed dated outside the batch's own dates is kept rather than dropped.
    given.forEach((row, key) => {
      if (key < firstDay || key > lastDay) {
        const period = periodOf(key, by);
        const entry = periods.get(period) ?? { period, kg: 0, cost: 0 };
        entry.kg += row.kg;
        entry.cost += row.cost;
        periods.set(period, entry);
      }
    });

    return [...periods.values()].sort((a, b) => a.period.localeCompare(b.period)).map((row) => ({ ...row, kg: Math.round(row.kg * 1000) / 1000, cost: Math.round(row.cost * 100) / 100 }));
  }, [trend, firstDay, lastDay, by]);

  if (!trend?.days.length) return <Typography color='text.secondary' p={2}>{t.none}</Typography>;

  const label = (period: string) => (by === 'month' ? dayjs(period).format('MMM YYYY') : dayjs(period).format('D MMM'));
  const barColor = theme.palette.primary.main;
  const lineColor = theme.palette.warning.main;

  return (
    <Box p={2}>
      <Box display='flex' justifyContent='flex-end' mb={1}>
        <ButtonGroup variant='outlined' size='small' disableElevation>
          {(['day', 'week', 'month'] as Grouping[]).map((grouping) => (
            <Button key={grouping} variant={by === grouping ? 'contained' : 'outlined'} onClick={() => setChosen(grouping)}>{t[grouping]}</Button>
          ))}
        </ButtonGroup>
      </Box>
      <Box sx={{ height: { xs: 280, md: 300 } }}>
        <ResponsiveContainer width='100%' height='100%'>
          <ComposedChart data={data} margin={{ top: 6, right: showCost ? 0 : 6, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray='3 3' stroke={theme.palette.divider} vertical={false} />
            <XAxis dataKey='period' tickFormatter={(period) => label(String(period))} tick={{ fontSize: 11 }} minTickGap={18} />
            <YAxis yAxisId='kg' tick={{ fontSize: 11 }} tickFormatter={compact} />
            {showCost && <YAxis yAxisId='cost' orientation='right' tick={{ fontSize: 11 }} tickFormatter={compact} />}
            <Tooltip
              labelFormatter={(period) => (by === 'week' ? t.weekOf.replace('{date}', dayjs(String(period)).format('D MMM YYYY')) : by === 'day' ? dayjs(String(period)).format('ddd, D MMM YYYY') : label(String(period)))}
              formatter={(value, name) => [name === t.cost ? two(Number(value)) : `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })} kg`, name]}
            />
            {showCost && <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />}
            <Bar yAxisId='kg' dataKey='kg' name={t.kg} fill={barColor} radius={[3, 3, 0, 0]} isAnimationActive={false} />
            {showCost && <Line yAxisId='cost' type='monotone' dataKey='cost' name={t.cost} stroke={lineColor} strokeWidth={2} dot={false} isAnimationActive={false} />}
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
      {!!trend.other_units.length && (
        <Typography variant='caption' color='warning.main' display='block' mt={1}>{t.otherUnits.replace('{units}', trend.other_units.join(', '))}</Typography>
      )}
    </Box>
  );
};

export default FeedTrend;
