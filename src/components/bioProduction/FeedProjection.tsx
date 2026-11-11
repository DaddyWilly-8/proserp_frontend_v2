'use client'

import React, { useState } from 'react';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Alert, Box, Button, ButtonGroup, Divider, MenuItem, useMediaQuery, Skeleton, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { fromGrams, normalizeUnit } from './weightUnit';
import { useBioMoney } from './useBioMoney';

export interface FeedProjectionData {
  days: number;
  from: string;
  to: string;
  total_kg: number;
  cycle?: boolean;
  gain_kg?: number;
  fcr?: number | null;
  total_cost: number | null;
  buy_cost?: number | null;
  feeds: { key: string; name: string | null; kg: number; cost: number | null; rate_per_kg: number | null; on_hand_kg: number | null; runs_out: string | null; short_kg: number | null; unit: string | null; units_needed: number | null; units_short: number | null; buy_cost?: number | null }[];
  weeks: { week: string; feeds: Record<string, number> }[];
  batches: { batch_id: number; feed_kg: number; gain_kg: number; fcr: number | null; growth: 'actual' | 'template'; weight_now_g: number; overdue: boolean; stages: { stage: string; feeds: { key: string; name: string | null; share_pct: number }[]; rate_pct: number | null; days: number; kg: number; weight_from_g: number | null; weight_to_g: number | null }[] }[];
  skipped: { batch_id: number; reason: 'no_plan' | 'no_weight' | 'no_table' }[];
  batch_count?: number;
}

export type Horizon = number | 'cycle';
const num = (value: number, digits = 1) => Number(value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: digits });

/**
 * The feed that open batches still need over the coming days, by feed product and week, from the stages' feeding plans.
 * `scope` and `load` say whether it is one batch (with a table by stage) or farms (with how many batches are included).
 */
const FeedProjection = ({ scope, load, weightUnit, showCost, horizons = [30, 60, 90] }: { scope: string; load: (days: Horizon) => Promise<FeedProjectionData>; weightUnit?: string | null; showCost: boolean; horizons?: Horizon[] }) => {
  const t = useDictionary().bioProduction.feedProjection;
  const { theme } = useJumboTheme();
  const money = useBioMoney();
  const [days, setDays] = useState<Horizon>(horizons[0] ?? 30);
  const narrow = useMediaQuery(theme.breakpoints.down('sm'));
  const [view, setView] = useState<'kg' | 'amount'>('kg');
  const label = (horizon: Horizon) => (horizon === 'cycle' ? t.wholeCycle : horizon >= 180 ? t.nextMonths.replace('{months}', String(Math.round(horizon / 30.4))) : t.nextDays.replace('{days}', String(horizon)));

  const { data, isLoading, isError } = useQuery<FeedProjectionData>({
    queryKey: ['bioFeedProjection', scope, days],
    queryFn: () => load(days),
    retry: (count, failure: any) => (failure?.response?.status ?? 500) >= 500 && count < 2,
    placeholderData: (previous) => previous,
  });

  if ((isError && !data) || (data && !Array.isArray(data.weeks))) return <Typography color='text.secondary' p={2}>{t.loadFailed}</Typography>;
  if (isLoading || !data) return <Box p={2}><Skeleton variant='rounded' height={250} /></Box>;

  const palette = [theme.palette.primary.main, theme.palette.info.main, theme.palette.warning.main, theme.palette.success.main, theme.palette.secondary.main, theme.palette.error.main];
  const nameOf = (key: string, name: string | null) => (key === 'unassigned' || !name ? t.unassigned : name);
  const unit = normalizeUnit(weightUnit);
  const rates = Object.fromEntries(data.feeds.map((feed) => [feed.key, feed.rate_per_kg]));
  const canAmount = showCost && data.feeds.some((feed) => feed.rate_per_kg != null);
  const amount = canAmount && view === 'amount';
  const unpriced = data.feeds.filter((feed) => feed.rate_per_kg == null).map((feed) => nameOf(feed.key, feed.name));
  const chart = data.weeks.map((week) => ({ week: week.week, ...(amount ? Object.fromEntries(Object.entries(week.feeds).map(([key, kg]) => [key, kg * (rates[key] ?? 0)])) : week.feeds) }));
  const overdue = data.batches.filter((batch) => batch.overdue).length;
  const noWeight = data.skipped.filter((entry) => entry.reason === 'no_weight').length;
  const noPlan = data.skipped.filter((entry) => entry.reason === 'no_plan').length;
  const noTable = data.skipped.filter((entry) => entry.reason === 'no_table').length;
  const onTemplate = data.batches.filter((batch) => batch.growth === 'template').length;
  const stocked = data.feeds.some((feed) => feed.on_hand_kg != null);
  const running = data.feeds.filter((feed) => feed.runs_out);
  const toBuy = (feed: FeedProjectionData['feeds'][number]) => (feed.on_hand_kg == null ? '—' : feed.units_short != null && feed.unit ? `${num(feed.units_short)} ${feed.unit}` : `${num(feed.short_kg ?? 0)} kg`);
  const fcrOdd = data.fcr != null && (data.fcr < 0.8 || data.fcr > 2.5);
  const single = data.batches.length === 1 && scope.startsWith('batch');

  return (
    <Box p={{ xs: 1, sm: 2 }}>
      <Box display='flex' justifyContent='space-between' alignItems='center' flexWrap='wrap' gap={1} mb={1.5}>
        <Typography variant='body2' color='text.secondary'>
          {t.period.replace('{from}', dayjs(data.from).format('D MMM YYYY')).replace('{to}', dayjs(data.to).format('D MMM YYYY'))}
          {data.batch_count != null && ` · ${t.batches.replace('{count}', String(data.batches.length))}`}
        </Typography>
        <Box display='flex' gap={1} flexWrap='wrap' sx={{ width: { xs: '100%', sm: 'auto' } }}>
          {canAmount && (
            <ButtonGroup variant='outlined' size='small' disableElevation sx={{ flex: { xs: 1, sm: 'none' } }}>
              <Button variant={view === 'kg' ? 'contained' : 'outlined'} onClick={() => setView('kg')}>{t.viewQuantity}</Button>
              <Button variant={view === 'amount' ? 'contained' : 'outlined'} onClick={() => setView('amount')}>{t.viewAmount}</Button>
            </ButtonGroup>
          )}
          <TextField select size='small' value={days} onChange={(event) => setDays(event.target.value === 'cycle' ? 'cycle' : Number(event.target.value))} sx={{ minWidth: 160, flex: { xs: 1, sm: 'none' } }}>
            {horizons.map((horizon) => (
              <MenuItem key={horizon} value={horizon}>{label(horizon)}</MenuItem>
            ))}
          </TextField>
        </Box>
      </Box>

      {data.total_kg === 0 ? (
        <Alert severity='info'>{t.nothing}</Alert>
      ) : (
        <>
          <Box display='flex' columnGap={{ xs: 3, sm: 4 }} rowGap={1} mb={1.5} flexWrap='wrap'>
            <Box><Typography variant='body2' color='text.secondary'>{t.totalFeed}</Typography><Typography variant='h4' mb={0} sx={{ fontSize: { xs: '1.35rem', sm: '1.75rem' } }}>{num(data.total_kg)} kg</Typography></Box>
            {data.fcr != null && <Box><Typography variant='body2' color='text.secondary'>{t.expectedFcr}</Typography><Typography variant='h4' mb={0} sx={{ fontSize: { xs: '1.35rem', sm: '1.75rem' } }}>{num(data.fcr, 2)}</Typography></Box>}
            {showCost && data.total_cost != null && <Box><Typography variant='body2' color='text.secondary'>{t.estimatedCost}</Typography><Typography variant='h4' mb={0} sx={{ fontSize: { xs: '1.35rem', sm: '1.75rem' } }}>{money(data.total_cost)}</Typography></Box>}
            {showCost && stocked && data.buy_cost != null && <Box><Typography variant='body2' color='text.secondary'>{t.buyValue}</Typography><Typography variant='h4' mb={0} color={data.buy_cost > 0 ? 'error.main' : undefined} sx={{ fontSize: { xs: '1.35rem', sm: '1.75rem' } }}>{money(data.buy_cost)}</Typography></Box>}
          </Box>

          <Box sx={{ height: { xs: 260, md: 280 } }}>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={chart} margin={{ top: 6, right: 6, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray='3 3' stroke={theme.palette.divider} vertical={false} />
                <XAxis dataKey='week' tickFormatter={(week) => dayjs(String(week)).format('D MMM')} tick={{ fontSize: 11 }} minTickGap={18} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => (amount ? num(Number(value), 0) : String(value))} />
                <Tooltip labelFormatter={(week) => t.weekOf.replace('{date}', dayjs(String(week)).format('D MMM YYYY'))} formatter={(value, name) => [amount ? money(Number(value)) : `${num(Number(value))} kg`, name]} />
                {data.feeds.length > 1 && <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />}
                {data.feeds.map((feed, index) => (
                  <Bar key={feed.key} dataKey={feed.key} name={nameOf(feed.key, feed.name)} stackId='feed' fill={palette[index % palette.length]} isAnimationActive={false} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </Box>

          {narrow ? (
            <Box mt={1.5}>
              {data.feeds.map((feed, index) => (
                <React.Fragment key={feed.key}>
                  {index > 0 && <Divider />}
                  <Box py={1}>
                    <Box display='flex' justifyContent='space-between' alignItems='baseline' gap={1}>
                      <Typography variant='body2' fontWeight={600}>{nameOf(feed.key, feed.name)}</Typography>
                      <Typography variant='body2' fontWeight={600} whiteSpace='nowrap'>{num(feed.kg)} kg</Typography>
                    </Box>
                    {stocked && feed.on_hand_kg != null && (
                      <Box display='flex' justifyContent='space-between' gap={1}>
                        <Typography variant='caption' color='text.secondary'>{t.inStock}: {num(feed.on_hand_kg)} · {feed.runs_out ? `${t.runsOut} ${dayjs(feed.runs_out).format('D MMM')}` : t.lasts}</Typography>
                        <Typography variant='caption' color={feed.runs_out ? 'error.main' : 'text.secondary'} whiteSpace='nowrap'>{t.toBuy}: {toBuy(feed)}{showCost && feed.buy_cost ? ` · ${money(feed.buy_cost)}` : ''}</Typography>
                      </Box>
                    )}
                    {showCost && (
                      <Box display='flex' justifyContent='space-between' gap={1}>
                        <Typography variant='caption' color='text.secondary'>{t.ratePerKg}: {feed.rate_per_kg != null ? money(feed.rate_per_kg) : '—'}</Typography>
                        <Typography variant='caption' color='text.secondary' whiteSpace='nowrap'>{t.cost}: {money(feed.cost)}</Typography>
                      </Box>
                    )}
                  </Box>
                </React.Fragment>
              ))}
            </Box>
          ) : (
          <Box sx={{ overflowX: 'auto', mt: 1.5 }}>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>{t.feed}</TableCell>
                    <TableCell align='right'>{t.quantityKg}</TableCell>
                    {stocked && <TableCell align='right'>{t.inStock}</TableCell>}
                  {stocked && <TableCell align='right'>{t.runsOut}</TableCell>}
                  {stocked && <TableCell align='right'>{t.toBuy}</TableCell>}
                  {stocked && showCost && <TableCell align='right'>{t.buyValue}</TableCell>}
                  {showCost && <TableCell align='right'>{t.ratePerKg}</TableCell>}
                    {showCost && <TableCell align='right'>{t.cost}</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.feeds.map((feed) => (
                    <TableRow key={feed.key}>
                      <TableCell>{nameOf(feed.key, feed.name)}</TableCell>
                      <TableCell align='right'>{num(feed.kg)}</TableCell>
                      {stocked && <TableCell align='right'>{feed.on_hand_kg != null ? num(feed.on_hand_kg) : '—'}</TableCell>}
                    {stocked && <TableCell align='right'>{feed.on_hand_kg == null ? '—' : feed.runs_out ? dayjs(feed.runs_out).format('D MMM') : t.lasts}</TableCell>}
                    {stocked && <TableCell align='right'>{toBuy(feed)}</TableCell>}
                    {stocked && showCost && <TableCell align='right'>{feed.buy_cost != null ? money(feed.buy_cost) : '—'}</TableCell>}
                    {showCost && <TableCell align='right'>{feed.rate_per_kg != null ? money(feed.rate_per_kg) : '—'}</TableCell>}
                      {showCost && <TableCell align='right'>{money(feed.cost)}</TableCell>}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

          {single && (
            narrow ? (
              <Box mt={2}>
                {data.batches[0].stages.map((stage, index) => (
                  <React.Fragment key={`${stage.stage}-${index}`}>
                    {index > 0 && <Divider />}
                    <Box py={1}>
                      <Box display='flex' justifyContent='space-between' alignItems='baseline' gap={1}>
                        <Typography variant='body2' fontWeight={600}>{stage.stage}</Typography>
                        <Typography variant='body2' fontWeight={600} whiteSpace='nowrap'>{num(stage.kg)} kg</Typography>
                      </Box>
                      <Typography variant='caption' color='text.secondary' display='block'>
                        {`${stage.days} ${t.days.toLowerCase()} · ${stage.rate_pct == null ? '—' : `${num(stage.rate_pct, 2)}%`}`}
                        {stage.weight_from_g != null && ` · ${num(fromGrams(stage.weight_from_g, unit), 2)} → ${num(fromGrams(stage.weight_to_g ?? stage.weight_from_g, unit), 2)} ${unit}`}
                      </Typography>
                    </Box>
                  </React.Fragment>
                ))}
              </Box>
            ) : (
            <Box sx={{ overflowX: 'auto', mt: 2 }}>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t.stage}</TableCell>
                      <TableCell align='right'>{t.days}</TableCell>
                      <TableCell align='right'>{`${t.weight} (${unit})`}</TableCell>
                      <TableCell align='right'>{t.rate}</TableCell>
                      <TableCell align='right'>{t.quantityKg}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.batches[0].stages.map((stage, index) => (
                      <TableRow key={`${stage.stage}-${index}`}>
                        <TableCell>{stage.stage}</TableCell>
                        <TableCell align='right'>{stage.days}</TableCell>
                        <TableCell align='right'>{stage.weight_from_g == null ? '—' : `${num(fromGrams(stage.weight_from_g, unit), 2)} → ${num(fromGrams(stage.weight_to_g ?? stage.weight_from_g, unit), 2)}`}</TableCell>
                        <TableCell align='right'>{stage.rate_pct == null ? '—' : `${num(stage.rate_pct, 2)}%`}</TableCell>
                        <TableCell align='right'>{num(stage.kg)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )
          )}
        </>
      )}

      {amount && unpriced.length > 0 && <Alert severity='info' sx={{ mt: 1.5 }}>{t.noRateAmount.replace('{feeds}', unpriced.join(', '))}</Alert>}
      {running.length > 0 && <Alert severity='warning' sx={{ mt: 1.5 }}>{t.runsOutWarning.replace('{feeds}', running.map((feed) => `${nameOf(feed.key, feed.name)} (${dayjs(feed.runs_out).format('D MMM')})`).join(', '))}</Alert>}
      {fcrOdd && <Alert severity='warning' sx={{ mt: 1.5 }}>{t.fcrCheck.replace('{fcr}', num(data.fcr as number, 2))}</Alert>}
      {data.batches.length > 0 && onTemplate > 0 && <Alert severity='info' sx={{ mt: 1 }}>{(single ? t.growthTemplate : t.growthTemplateMany.replace('{count}', String(onTemplate)))}</Alert>}
      {overdue > 0 && <Alert severity='info' sx={{ mt: 1 }}>{t.overdue.replace('{count}', String(overdue))}</Alert>}
      {(noWeight > 0 || noPlan > 0 || noTable > 0) && <Alert severity='warning' sx={{ mt: 1 }}>{t.skipped.replace('{noWeight}', String(noWeight)).replace('{noPlan}', String(noPlan)).replace('{noTable}', String(noTable))}</Alert>}
      <Typography variant='caption' color='text.secondary' display='block' mt={1}>{t.note}{canAmount ? ` ${t.amountNote}` : ''}{data.cycle ? ` ${t.cycleNote}` : ''} {t.rateHint}</Typography>
    </Box>
  );
};

export default FeedProjection;
