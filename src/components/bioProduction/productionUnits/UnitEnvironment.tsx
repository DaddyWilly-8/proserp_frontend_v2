'use client'

import React, { useState } from 'react';
import { HighlightOff } from '@mui/icons-material';
import { Box, Card, CardContent, Chip, Dialog, DialogContent, DialogTitle, Grid, IconButton, LinearProgress, Stack, Tooltip, Typography, useMediaQuery } from '@mui/material';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from 'recharts';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import BioSelect from '../BioSelect';
import { productionUnitServices } from '../bio-production-services';
import { rangeText, statusColor } from '../measurementParameters/rangeText';
import { BioMeasurementParameter, BioProductionUnit, MeasurementStatus } from '../types';

interface EnvironmentParameter extends BioMeasurementParameter {
  latest: { value: number; measured_at: string; status: MeasurementStatus } | null;
  readings_count: number;
  out_of_range: number;
  series: { measured_at: string; value: number }[];
}

interface Environment {
  unit: { id: number; name: string; type: string };
  days: number;
  parameters: EnvironmentParameter[];
}

const ParameterCard = ({ parameter }: { parameter: EnvironmentParameter }) => {
  const text = useDictionary().bioProduction.productionUnits.environment;
  const { theme } = useJumboTheme();
  const data = parameter.series.map((point) => ({ t: dayjs(point.measured_at).valueOf(), value: point.value }));
  const limits: { value: number; color: string }[] = [
    ...(parameter.watch_min != null ? [{ value: parameter.watch_min, color: theme.palette.warning.main }] : []),
    ...(parameter.watch_max != null ? [{ value: parameter.watch_max, color: theme.palette.warning.main }] : []),
    ...(parameter.critical_min != null ? [{ value: parameter.critical_min, color: theme.palette.error.main }] : []),
    ...(parameter.critical_max != null ? [{ value: parameter.critical_max, color: theme.palette.error.main }] : []),
  ];
  const latestColor = parameter.latest ? statusColor(parameter.latest.status) : 'default';

  return (
    <Card variant='outlined' sx={{ height: '100%' }}>
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Stack direction='row' justifyContent='space-between' alignItems='flex-start' spacing={1}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant='body2' color='text.secondary'>{parameter.name}</Typography>
            <Typography variant='h4' mb={0} color={parameter.latest && parameter.latest.status !== 'ok' ? `${latestColor}.main` : undefined} sx={{ fontSize: { xs: '1.3rem', sm: '1.6rem' } }}>
              {parameter.latest ? `${parameter.latest.value.toLocaleString(undefined, { maximumFractionDigits: parameter.decimals })} ${parameter.unit_label ?? ''}` : '—'}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {parameter.latest ? dayjs(parameter.latest.measured_at).format('D MMM, HH:mm') : text.noReadings}
            </Typography>
          </Box>
          {parameter.out_of_range > 0 && (
            <Tooltip title={text.outOfRangeHint.replace('{count}', String(parameter.out_of_range)).replace('{total}', String(parameter.readings_count))}>
              <Chip size='small' color={parameter.latest?.status === 'critical' ? 'error' : 'warning'} variant='outlined' label={`${parameter.out_of_range}/${parameter.readings_count}`} />
            </Tooltip>
          )}
        </Stack>
        {data.length > 1 && (
          <Box sx={{ height: 140, mt: 1 }}>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
                <CartesianGrid strokeDasharray='3 3' stroke={theme.palette.divider} />
                <XAxis dataKey='t' type='number' scale='time' domain={['dataMin', 'dataMax']} tickFormatter={(value) => dayjs(value).format('D MMM')} tick={{ fontSize: 11 }} minTickGap={24} />
                <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                <ChartTooltip labelFormatter={(value) => dayjs(value as number).format('D MMM, HH:mm')} formatter={(value) => [`${value} ${parameter.unit_label ?? ''}`, parameter.name]} />
                {limits.map((limit, index) => (
                  <ReferenceLine key={index} y={limit.value} stroke={limit.color} strokeDasharray='4 4' />
                ))}
                <Line type='monotone' dataKey='value' stroke={theme.palette.primary.main} strokeWidth={2} dot={data.length < 30} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        )}
        <Typography variant='caption' color='text.secondary' display='block' mt={0.5}>
          {text.limits.replace('{watch}', rangeText(parameter.watch_min, parameter.watch_max)).replace('{critical}', rangeText(parameter.critical_min, parameter.critical_max))}
        </Typography>
      </CardContent>
    </Card>
  );
};

/** A unit's conditions: the latest reading of each parameter, how it stands against its limits, and a trend. */
const UnitEnvironment = ({ unit, open, onClose }: { unit: BioProductionUnit; open: boolean; onClose: () => void }) => {
  const dictionary = useDictionary().bioProduction;
  const text = dictionary.productionUnits.environment;
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const [days, setDays] = useState<string | number>(30);

  const { data, isLoading } = useQuery<Environment>({
    queryKey: ['bioUnitEnvironment', unit.id, days],
    queryFn: () => productionUnitServices.getEnvironment(unit.id, { days }),
    enabled: open,
  });

  return (
    <Dialog open={open} fullWidth maxWidth='lg' fullScreen={belowLargeScreen} onClose={onClose}>
      <DialogTitle>
        <Stack direction='row' alignItems='center' justifyContent='space-between' spacing={1}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant='h4' mb={0} noWrap>{text.title.replace('{name}', unit.name)}</Typography>
          </Box>
          <Stack direction='row' alignItems='center' spacing={1}>
            <Box sx={{ width: 150 }}>
              <BioSelect
                label={text.period}
                options={[7, 14, 30, 90].map((count) => ({ value: count, label: text.days.replace('{count}', String(count)) }))}
                value={days}
                onChange={(value) => setDays(value || 30)}
              />
            </Box>
            <Tooltip title={dictionary.common.cancel}>
              <IconButton size='small' onClick={onClose}><HighlightOff color='primary' /></IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </DialogTitle>
      <DialogContent>
        {isLoading && <LinearProgress />}
        {data && data.parameters.length === 0 && <Typography color='text.secondary'>{text.none}</Typography>}
        <Grid container spacing={1.5}>
          {data?.parameters.map((parameter) => (
            <Grid key={parameter.id} size={{ xs: 12, md: 6, xl: 4 }}>
              <ParameterCard parameter={parameter} />
            </Grid>
          ))}
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default UnitEnvironment;
