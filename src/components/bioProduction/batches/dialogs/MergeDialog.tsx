'use client'

import React, { useEffect, useRef, useState } from 'react';
import { AddOutlined, DeleteOutlined } from '@mui/icons-material';
import { Alert, Box, Button, Checkbox, FormControlLabel, Grid, IconButton, Stack, TextField, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { batchServices } from '../../bio-production-services';
import InfoHint from '../../InfoHint';
import BioSelect from '../../BioSelect';
import { animalText } from '../../animalText';
import { nowStamp } from '../../dateTime';
import { useBioMoney } from '../../useBioMoney';
import { fromGrams, toGrams, withUnit } from '../../weightUnit';
import { DialogProps, MergePreview } from '../batchTypes';
import ActionDialog, { FormDate, useBatchAction } from './ActionDialog';
import UnitChoice from './UnitChoice';

type Target = { id: number; batchNo: string; unit: string | null; current_quantity: number; stage: string | null };
type Line = { key: number; target: string | number; unit: number | ''; quantity: string; weight: string };

const NEW = 'new';
const num = (value: number | null | undefined, digits = 2) => (value == null ? '—' : Number(value).toLocaleString(undefined, { maximumFractionDigits: digits }));

/**
 * Sends the batch's fish to other batches on the same stage: all of them (the batch is dissolved) or some (a split,
 * the batch carries on with the rest). Each line is an open batch, which takes the fish in its cage, or a new batch
 * started for them in a cage. Shows what each ends up with first, and asks to confirm when average weights are far apart.
 */
const MergeDialog = ({ batch, open, onClose }: DialogProps) => {
  const text = useDictionary().bioProduction.batches;
  const label = batch.species_template?.count_label;
  // The strings say {animals}, which reads as what this species is counted as (fish, birds, ...).
  const dialog = Object.fromEntries(Object.entries(text.dialogs.merge).map(([key, value]) => [key, animalText(value as string, label)])) as typeof text.dialogs.merge;
  const money = useBioMoney();
  const unit = batch.species_template?.weight_unit;
  const [confirmed, setConfirmed] = useState(false);
  const counter = useRef(1);
  const blank = (): Line => ({ key: counter.current++, target: '', unit: '', quantity: '', weight: '' });
  const [lines, setLines] = useState<Line[]>([blank()]);

  const { control, register, handleSubmit, reset, watch } = useForm<any>({ defaultValues: { date: nowStamp(), from_weight: '', remarks: '' } });
  const [date, fromWeight] = watch(['date', 'from_weight']);
  const grams = (value: unknown) => (value === '' || value == null || Number(value) <= 0 ? undefined : toGrams(Number(value), unit));
  const alive = batch.current_quantity;

  const { data: targets, isLoading: loadingTargets } = useQuery<{ data: Target[] }>({
    queryKey: ['bioBatchMergeTargets', batch.id],
    queryFn: () => batchServices.mergeTargets(batch.id),
    enabled: open,
  });

  // What the lines say, for the server: a batch or a cage for a new one, the fish it takes (none: what is left) and its weight if typed.
  const payload = lines.flatMap((line) => {
    if (line.target === '' || (line.target === NEW && line.unit === '')) return [];
    const quantity = line.quantity === '' ? undefined : Number(line.quantity);

    return [{ ...(line.target === NEW ? { new_unit_id: line.unit } : { into_batch_id: line.target }), quantity, into_weight_g: line.target === NEW ? undefined : grams(line.weight) }];
  });
  const complete = payload.length === lines.length;
  const params = { id: batch.id, date: date || undefined, from_weight_g: grams(fromWeight), targets: payload };
  const { data: preview, error: previewError } = useQuery<{ preview: MergePreview }>({
    queryKey: ['bioBatchMergePreview', params],
    queryFn: () => batchServices.mergePreview(params),
    enabled: open && complete && !!date,
    retry: false,
  });
  const plan = complete ? preview?.preview : undefined;
  const refused = complete && previewError ? (previewError as any)?.response?.data?.message ?? null : null;

  // A different choice of fish or weights starts a fresh decision.
  const signature = JSON.stringify([payload, fromWeight]);
  useEffect(() => setConfirmed(false), [signature]);

  const { mutate, isPending } = useBatchAction(batch.id, batchServices.merge, () => { reset(); setLines([blank()]); onClose(); });
  const gram = (value: number | null | undefined) => (value == null ? '—' : `${num(fromGrams(value, unit), 3)} ${unit === 'kg' ? 'kg' : 'g'}`);
  const taken = new Set(lines.map((line) => line.target));
  const optionsFor = (line: Line) => [
    ...(targets?.data ?? []).filter((target) => target.id === line.target || !taken.has(target.id))
      .map((target) => ({ value: target.id as string | number, label: `${target.batchNo} · ${target.unit ?? '—'}`, hint: `${target.current_quantity.toLocaleString()} · ${target.stage ?? ''}` })),
    { value: NEW as string | number, label: dialog.newBatch, hint: dialog.newBatchHint },
  ];
  const change = (key: number, patch: Partial<Line>) => setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  const placed = lines.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0);
  const blanks = lines.filter((line) => line.quantity === '').length;
  const left = alive - placed;

  return (
    <ActionDialog open={open} title={dialog.title} maxWidth='md' loading={isPending} disableSubmit={!plan || (plan.warning && !confirmed)} onClose={onClose}
      onSubmit={handleSubmit((data: any) => mutate({
        id: batch.id, date: data.date, remarks: data.remarks || undefined, from_weight_g: grams(data.from_weight), targets: payload, confirm_weight_gap: confirmed || undefined,
      }))}>
      <Grid container spacing={2}>
        <Grid size={12}>
          <Stack direction='row' alignItems='center' spacing={0.5}>
            <Typography variant='subtitle2'>{dialog.heading.replace('{batch}', batch.batchNo)}</Typography>
            <InfoHint text={dialog.help} />
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormDate control={control} name='date' label={text.labels.date} minDate={batch.start_date} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Stack direction='row' alignItems='flex-start' spacing={0.5}>
            <TextField type='number' size='small' fullWidth label={withUnit(dialog.fromWeight.replace('{batch}', batch.batchNo), unit)} slotProps={{ htmlInput: { step: 'any', min: 0 } }} {...register('from_weight')} />
            <InfoHint text={dialog.weightHelp} />
          </Stack>
        </Grid>

        {lines.map((line, index) => (
          <Grid key={line.key} size={12}>
            <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
              <Grid container spacing={1.5} alignItems='flex-start'>
                <Grid size={{ xs: 12, md: line.target === NEW ? 4 : 5 }}>
                  <BioSelect label={dialog.into} options={optionsFor(line)} value={line.target} onChange={(value) => change(line.key, { target: value, unit: '' })} loading={loadingTargets} required />
                </Grid>
                {line.target === NEW && (
                  <Grid size={{ xs: 12, md: 4 }}>
                    <UnitChoice batch={batch} label={dialog.cage} stageName={batch.current_stage?.name} value={line.unit} onChange={(value) => change(line.key, { unit: value })} />
                  </Grid>
                )}
                <Grid size={{ xs: 6, md: line.target === NEW ? 3 : 3 }}>
                  <TextField type='number' size='small' fullWidth label={dialog.quantity} placeholder={blanks === 1 && line.quantity === '' ? dialog.rest : undefined} value={line.quantity}
                    onChange={(event) => change(line.key, { quantity: event.target.value })} slotProps={{ htmlInput: { step: 1, min: 1 }, inputLabel: { shrink: true } }} />
                </Grid>
                {line.target !== NEW && (
                  <Grid size={{ xs: 6, md: 3 }}>
                    <TextField type='number' size='small' fullWidth label={withUnit(dialog.intoWeight, unit)} value={line.weight} onChange={(event) => change(line.key, { weight: event.target.value })} slotProps={{ htmlInput: { step: 'any', min: 0 } }} />
                  </Grid>
                )}
                <Grid size={{ xs: 12, md: 'auto' }} sx={{ ml: 'auto' }}>
                  {lines.length > 1 && (
                    <IconButton size='small' aria-label={dialog.remove} onClick={() => setLines((current) => current.filter((each) => each.key !== line.key))}><DeleteOutlined fontSize='small' /></IconButton>
                  )}
                </Grid>
              </Grid>
              {plan?.targets[index] && (
                <Typography variant='caption' color='text.secondary' display='block' mt={1}>
                  {dialog.line.replace('{count}', plan.targets[index].quantity.toLocaleString()).replace('{total}', plan.targets[index].total_quantity.toLocaleString())
                    .replace('{weights}', plan.targets[index].new ? gram(plan.targets[index].merged_weight_g) : `${gram(plan.targets[index].weight_g)} + ${gram(plan.from.weight_g)} = ${gram(plan.targets[index].merged_weight_g)}`)}
                  {plan.targets[index].cost_amount != null ? ` · ${dialog.cost.replace('{amount}', money(plan.targets[index].cost_amount)).replace('{perFish}', money(plan.targets[index].cost_per_fish_after))}` : ''}
                  {!plan.targets[index].new && plan.targets[index].merged_weight_g == null && <InfoHint text={dialog.noWeight} />}
                </Typography>
              )}
            </Box>
          </Grid>
        ))}
        <Grid size={12}>
          <Box display='flex' alignItems='center' gap={1} flexWrap='wrap'>
            <Button size='small' startIcon={<AddOutlined />} disabled={blanks > 0 && left <= 0} onClick={() => setLines((current) => [...current, blank()])}>{dialog.add}</Button>
            <Typography variant='body2' color={left < 0 ? 'error' : 'text.secondary'}>
              {left < 0 ? dialog.tooMany.replace('{alive}', alive.toLocaleString()) : blanks > 0 ? dialog.restShort : dialog.remaining.replace('{left}', left.toLocaleString()).replace('{alive}', alive.toLocaleString())}
            </Typography>
          </Box>
        </Grid>
        {!loadingTargets && (targets?.data ?? []).length === 0 && <Grid size={12}><Typography variant='caption' color='text.secondary'>{dialog.noTargets}</Typography></Grid>}

        {refused && <Grid size={12}><Alert severity='error'>{refused}</Alert></Grid>}
        {plan && (
          <Grid size={12}>
            <Stack direction='row' alignItems='center' spacing={0.5} flexWrap='wrap'>
              <Typography variant='body2'>
                {plan.remaining === 0 ? dialog.dissolves.replace('{batch}', plan.from.batchNo) : dialog.splits.replace('{count}', plan.remaining.toLocaleString()).replace('{batch}', plan.from.batchNo)}
                {plan.cost_amount != null ? ` · ${dialog.costTotal.replace('{amount}', money(plan.cost_amount))}` : ''}
              </Typography>
              <InfoHint text={plan.remaining === 0 ? dialog.dissolvesHelp : dialog.splitsHelp} />
            </Stack>
          </Grid>
        )}
        {plan?.warning && (
          <Grid size={12}>
            <Alert severity='warning'>
              {dialog.gapWarning.replace('{limit}', String(plan.gap_limit_pct)).replace('{batches}', plan.targets.filter((target) => target.warning).map((target) => `${target.batchNo ?? dialog.newBatch}: ${num(target.gap_pct, 1)}%`).join(', '))}
              <FormControlLabel sx={{ display: 'block', mt: 0.5 }} control={<Checkbox size='small' checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />} label={dialog.confirmGap} />
            </Alert>
          </Grid>
        )}
        <Grid size={12}>
          <Controller name='remarks' control={control} render={({ field }) => <TextField size='small' fullWidth label={text.labels.remarks} {...field} />} />
        </Grid>
      </Grid>
    </ActionDialog>
  );
};

export default MergeDialog;
