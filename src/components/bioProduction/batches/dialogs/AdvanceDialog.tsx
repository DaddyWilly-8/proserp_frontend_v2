'use client'

import React from 'react';
import { toGrams, withUnit } from '../../weightUnit';
import { yupResolver } from '@hookform/resolvers/yup';
import { Grid, TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { batchServices } from '../../bio-production-services';
import { DialogProps } from '../batchTypes';
import ActionDialog, { FormDate, useBatchAction } from './ActionDialog';
import { nowStamp } from '../../dateTime';
import { useQuery } from '@tanstack/react-query';
import { speciesTemplateServices } from '../../bio-production-services';
import { unitSuits } from '../../unitSuitability';
import { BioSpeciesTemplate } from '../../types';
import UnitChoice, { useFarmUnits } from './UnitChoice';

const AdvanceDialog = ({ batch, open, onClose }: DialogProps) => {
  const text = useDictionary().bioProduction.batches;
  const dialog = text.dialogs.advance;

  const schema = yup.object({
    date: yup.string().required(text.validation.dateRequired),
    production_unit_id: yup.number().transform((value, original) => (original === '' ? null : value)).nullable(),
    average_weight_g: yup.number().transform((value, original) => (original === '' || original == null ? null : value))
      .nullable().moreThan(0, text.validation.numberInvalid).typeError(text.validation.numberInvalid),
    remarks: yup.string().nullable(),
  });
  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema) as any,
    defaultValues: { date: nowStamp(), production_unit_id: '' as any, average_weight_g: '' as any, remarks: '' },
  });

  const { mutate, isPending } = useBatchAction(batch.id, batchServices.advanceStage, () => { reset(); onClose(); });

  // The stage the batch moves into, and whether its unit suits it: if not, the batch has to move to a unit that does.
  const { data: template } = useQuery<BioSpeciesTemplate>({
    queryKey: ['bioSpeciesTemplate', batch.species_template_id],
    queryFn: () => speciesTemplateServices.get(batch.species_template_id),
    enabled: open,
  });
  const { data: units } = useFarmUnits(batch);
  const nextStage = [...(template?.stages ?? [])].sort((x, y) => (x.sequence ?? 0) - (y.sequence ?? 0)).find((stage) => (stage.sequence ?? 0) > (batch.current_stage?.sequence ?? 0));
  const currentUnit = units?.data.find((unit) => unit.id === batch.production_unit_id);
  const mustMove = !!nextStage && !unitSuits(currentUnit, batch.species_template_id, nextStage.name);
  const chosenUnit = watch('production_unit_id');

  return (
    <ActionDialog open={open} title={dialog.title} help={dialog.help} loading={isPending} disableSubmit={mustMove && !chosenUnit} onClose={onClose}
      onSubmit={handleSubmit((data: any) => mutate({ id: batch.id, ...data, average_weight_g: data.average_weight_g == null || data.average_weight_g === '' ? data.average_weight_g : toGrams(Number(data.average_weight_g), batch.species_template?.weight_unit) }))}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormDate control={control} name='date' label={text.labels.date} minDate={batch.start_date} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField type='number' size='small' fullWidth label={withUnit(dialog.closingWeight, batch.species_template?.weight_unit)} error={!!errors.average_weight_g}
            slotProps={{ htmlInput: { step: 'any' } }} helperText={errors.average_weight_g?.message as string} {...register('average_weight_g')} />
        </Grid>
        <Grid size={12}>
          <Controller name='production_unit_id' control={control} render={({ field }) => (
            <UnitChoice batch={batch} label={mustMove ? dialog.requiredUnit : dialog.optionalUnit} stageName={nextStage?.name} helperText={mustMove ? dialog.mustMove.replace('{unit}', currentUnit?.name ?? '').replace('{stage}', nextStage?.name ?? '') : undefined} error={mustMove && !chosenUnit} {...field} />
          )} />
        </Grid>
        <Grid size={12}>
          <TextField size='small' fullWidth label={text.labels.remarks} {...register('remarks')} />
        </Grid>
      </Grid>
    </ActionDialog>
  );
};

export default AdvanceDialog;
