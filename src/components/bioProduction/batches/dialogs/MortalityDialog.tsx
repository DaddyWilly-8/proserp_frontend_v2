'use client'

import React from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { Grid, TextField } from '@mui/material';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { batchServices } from '../../bio-production-services';
import { DialogProps } from '../batchTypes';
import ActionDialog, { FormDate, useBatchAction } from './ActionDialog';
import { nowStamp } from '../../dateTime';
import { FormNumber } from '../../NumberField';

const MortalityDialog = ({ batch, open, onClose }: DialogProps) => {
  const text = useDictionary().bioProduction.batches;
  const dialog = text.dialogs.mortality;

  const schema = yup.object({
    event_date: yup.string().required(text.validation.dateRequired),
    quantity: yup.number().typeError(text.validation.quantityRequired).integer(text.validation.quantityRequired)
      .min(1, text.validation.quantityRequired).max(batch.current_quantity, text.validation.tooMany).required(text.validation.quantityRequired),
    cause: yup.string().nullable(),
    remarks: yup.string().nullable(),
  });
  const { control, register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema) as any,
    defaultValues: { event_date: nowStamp(), quantity: undefined as number | undefined, cause: '', remarks: '' },
  });

  const { mutate, isPending } = useBatchAction(batch.id, batchServices.recordMortality, () => { reset(); onClose(); });

  return (
    <ActionDialog open={open} title={dialog.title} help={dialog.help} loading={isPending} onClose={onClose}
      onSubmit={handleSubmit((data: any) => mutate({ id: batch.id, ...data }))}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormDate control={control} name='event_date' label={text.labels.date} minDate={batch.start_date} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormNumber control={control} name='quantity' integer label={text.labels.quantity} error={!!errors.quantity} helperText={errors.quantity?.message} />
        </Grid>
        <Grid size={12}>
          <TextField size='small' fullWidth label={dialog.cause} {...register('cause')} />
        </Grid>
        <Grid size={12}>
          <TextField size='small' fullWidth label={text.labels.remarks} {...register('remarks')} />
        </Grid>
      </Grid>
    </ActionDialog>
  );
};

export default MortalityDialog;
