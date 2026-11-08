'use client'

import React from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { Grid, Stack, TextField } from '@mui/material';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { batchServices } from '../../bio-production-services';
import { fromGrams, toGrams, withUnit } from '../../weightUnit';
import InfoHint from '../../InfoHint';
import { BatchStage, DialogProps } from '../batchTypes';
import ActionDialog, { FormDate, useBatchAction } from './ActionDialog';

/** Corrects when one stage of an open batch began, and the weight it began at; the server checks the date against the neighbouring stages and the records made. */
const StageDateDialog = ({ batch, stage, open, onClose }: DialogProps & { stage: BatchStage }) => {
  const text = useDictionary().bioProduction.batches;
  const dialog = text.dialogs.stageDate;

  const unit = batch.species_template?.weight_unit;
  const schema = yup.object({
    start_date: yup.string().required(text.validation.dateRequired),
    average_weight_g: yup.number().transform((value, original) => (original === '' || original == null ? null : value))
      .nullable().moreThan(0, text.validation.numberInvalid).typeError(text.validation.numberInvalid),
  });
  const { control, handleSubmit, register, formState: { errors } } = useForm<any>({
    resolver: yupResolver(schema) as any,
    defaultValues: { start_date: stage.start_date, average_weight_g: stage.opening_avg_weight_g == null ? '' : fromGrams(Number(stage.opening_avg_weight_g), unit) },
  });

  const { mutate, isPending } = useBatchAction(batch.id, batchServices.updateStage, onClose);

  return (
    <ActionDialog open={open} title={dialog.title.replace('{stage}', stage.name)} loading={isPending} onClose={onClose}
      onSubmit={handleSubmit((data: any) => mutate({ id: batch.id, stageId: stage.id, ...data, average_weight_g: data.average_weight_g == null || data.average_weight_g === '' ? null : toGrams(Number(data.average_weight_g), unit) }))}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Stack direction='row' alignItems='center' spacing={0.5}>
            <FormDate control={control} name='start_date' label={dialog.label} />
            <InfoHint text={dialog.help} />
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Stack direction='row' alignItems='center' spacing={0.5}>
            <TextField type='number' size='small' fullWidth label={withUnit(dialog.weight, unit)} error={!!errors.average_weight_g}
              slotProps={{ htmlInput: { step: 'any' } }} helperText={errors.average_weight_g?.message as string} {...register('average_weight_g')} />
            <InfoHint text={dialog.weightHelp} />
          </Stack>
        </Grid>
      </Grid>
    </ActionDialog>
  );
};

export default StageDateDialog;
