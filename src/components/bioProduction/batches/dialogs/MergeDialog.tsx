'use client'

import React, { useEffect, useState } from 'react';
import { Alert, Box, Checkbox, FormControlLabel, Grid, TextField, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { batchServices } from '../../bio-production-services';
import BioSelect from '../../BioSelect';
import { nowStamp } from '../../dateTime';
import { useBioMoney } from '../../useBioMoney';
import { fromGrams, toGrams, withUnit } from '../../weightUnit';
import { DialogProps, MergePreview } from '../batchTypes';
import ActionDialog, { FormDate, useBatchAction } from './ActionDialog';

type Target = { id: number; batchNo: string; unit: string | null; current_quantity: number; stage: string | null };

const num = (value: number | null | undefined, digits = 2) => (value == null ? '—' : Number(value).toLocaleString(undefined, { maximumFractionDigits: digits }));

/**
 * Dissolves the batch into another open batch on the same stage: its fish join that batch's cage and the cost
 * it still carries goes with them. Shows what the cage ends up with first, and asks to confirm when the two
 * groups' average weights are far apart.
 */
const MergeDialog = ({ batch, open, onClose }: DialogProps) => {
  const text = useDictionary().bioProduction.batches;
  const dialog = text.dialogs.merge;
  const money = useBioMoney();
  const unit = batch.species_template?.weight_unit;
  const [confirmed, setConfirmed] = useState(false);

  const { control, register, handleSubmit, reset, watch } = useForm<any>({
    defaultValues: { into_batch_id: '', date: nowStamp(), from_weight: '', into_weight: '', remarks: '' },
  });
  const [intoId, date, fromWeight, intoWeight] = watch(['into_batch_id', 'date', 'from_weight', 'into_weight']);
  const grams = (value: unknown) => (value === '' || value == null || Number(value) <= 0 ? undefined : toGrams(Number(value), unit));

  const { data: targets, isLoading: loadingTargets } = useQuery<{ data: Target[] }>({
    queryKey: ['bioBatchMergeTargets', batch.id],
    queryFn: () => batchServices.mergeTargets(batch.id),
    enabled: open,
  });

  const params = { id: batch.id, into_batch_id: intoId || undefined, date: date || undefined, from_weight_g: grams(fromWeight), into_weight_g: grams(intoWeight) };
  const { data: preview, error: previewError } = useQuery<{ preview: MergePreview }>({
    queryKey: ['bioBatchMergePreview', params],
    queryFn: () => batchServices.mergePreview(params),
    enabled: open && !!intoId && !!date,
    retry: false,
  });
  const plan = intoId ? preview?.preview : undefined;
  const refused = intoId && previewError ? (previewError as any)?.response?.data?.message ?? null : null;

  // Another cage or another size to merge starts a fresh decision.
  useEffect(() => setConfirmed(false), [intoId, fromWeight, intoWeight]);

  const { mutate, isPending } = useBatchAction(batch.id, batchServices.merge, () => { reset(); onClose(); });
  const gram = (value: number | null | undefined) => (value == null ? '—' : `${num(fromGrams(value, unit), 3)} ${unit === 'kg' ? 'kg' : 'g'}`);
  const options = (targets?.data ?? []).map((target) => ({
    value: target.id,
    label: `${target.batchNo} · ${target.unit ?? '—'}`,
    hint: `${target.current_quantity.toLocaleString()} · ${target.stage ?? ''}`,
  }));

  return (
    <ActionDialog open={open} title={dialog.title} help={dialog.help} loading={isPending} disableSubmit={!plan || (plan.warning && !confirmed)} onClose={onClose}
      onSubmit={handleSubmit((data: any) => mutate({
        id: batch.id, into_batch_id: data.into_batch_id, date: data.date, remarks: data.remarks || undefined,
        from_weight_g: grams(data.from_weight), into_weight_g: grams(data.into_weight), confirm_weight_gap: confirmed || undefined,
      }))}>
      <Grid container spacing={2}>
        {!loadingTargets && options.length === 0 && <Grid size={12}><Alert severity='warning'>{dialog.noTargets}</Alert></Grid>}
        <Grid size={{ xs: 12, md: 7 }}>
          <Controller name='into_batch_id' control={control} render={({ field }) => (
            <BioSelect label={dialog.into} options={options} value={field.value} onChange={field.onChange} loading={loadingTargets} required />
          )} />
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <FormDate control={control} name='date' label={text.labels.date} minDate={batch.start_date} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField type='number' size='small' fullWidth label={withUnit(dialog.fromWeight.replace('{batch}', batch.batchNo), unit)} slotProps={{ htmlInput: { step: 'any', min: 0 } }} {...register('from_weight')} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField type='number' size='small' fullWidth label={withUnit(dialog.intoWeight.replace('{batch}', plan?.into.batchNo ?? ''), unit)} slotProps={{ htmlInput: { step: 'any', min: 0 } }} {...register('into_weight')} />
        </Grid>
        <Grid size={12}><Typography variant='caption' color='text.secondary'>{dialog.weightHint}</Typography></Grid>

        {refused && <Grid size={12}><Alert severity='error'>{refused}</Alert></Grid>}
        {plan && (
          <Grid size={12}>
            <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
              <Typography variant='subtitle2' mb={0.5}>{dialog.after.replace('{batch}', plan.into.batchNo)}</Typography>
              <Typography variant='body2'>{dialog.moving.replace('{count}', plan.from.quantity.toLocaleString()).replace('{from}', plan.from.batchNo)}</Typography>
              <Typography variant='body2'>{dialog.total.replace('{count}', plan.total_quantity.toLocaleString())}</Typography>
              <Typography variant='body2'>
                {dialog.weights.replace('{from}', gram(plan.from.weight_g)).replace('{into}', gram(plan.into.weight_g)).replace('{merged}', gram(plan.merged_weight_g))}
              </Typography>
              {plan.cost_amount != null && (
                <Typography variant='body2'>{dialog.cost.replace('{amount}', money(plan.cost_amount)).replace('{perFish}', money(plan.cost_per_fish_after))}</Typography>
              )}
            </Box>
          </Grid>
        )}
        {plan?.warning && (
          <Grid size={12}>
            <Alert severity='warning'>
              {dialog.gapWarning.replace('{gap}', num(plan.gap_pct, 1)).replace('{limit}', String(plan.gap_limit_pct)).replace('{from}', gram(plan.from.weight_g)).replace('{into}', gram(plan.into.weight_g))}
              <FormControlLabel sx={{ display: 'block', mt: 0.5 }} control={<Checkbox size='small' checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />} label={dialog.confirmGap} />
            </Alert>
          </Grid>
        )}
        {plan && plan.merged_weight_g == null && <Grid size={12}><Alert severity='info'>{dialog.noWeight}</Alert></Grid>}
        <Grid size={12}>
          <TextField size='small' fullWidth label={text.labels.remarks} {...register('remarks')} />
        </Grid>
      </Grid>
    </ActionDialog>
  );
};

export default MergeDialog;
