'use client'

import React from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { Grid, TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { batchServices } from '../../bio-production-services';
import { DialogProps } from '../batchTypes';
import ActionDialog, { FormDate, useBatchAction } from './ActionDialog';
import { nowStamp } from '../../dateTime';
import UnitChoice from './UnitChoice';

const TransferDialog = ({ batch, open, onClose }: DialogProps) => {
  const text = useDictionary().bioProduction.batches;
  const dialog = text.dialogs.transfer;

  const schema = yup.object({
    to_unit_id: yup.number().typeError(text.validation.unitRequired).required(text.validation.unitRequired),
    transfer_date: yup.string().required(text.validation.dateRequired),
    remarks: yup.string().nullable(),
  });
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema) as any,
    defaultValues: { to_unit_id: '' as any, transfer_date: nowStamp(), remarks: '' },
  });

  const { mutate, isPending } = useBatchAction(batch.id, batchServices.transfer, () => { reset(); onClose(); });

  return (
    <ActionDialog open={open} title={dialog.title} help={dialog.help} loading={isPending} onClose={onClose}
      onSubmit={handleSubmit((data: any) => mutate({ id: batch.id, ...data }))}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Controller name='to_unit_id' control={control} render={({ field }) => (
            <UnitChoice batch={batch} label={dialog.toUnit} error={!!errors.to_unit_id} helperText={errors.to_unit_id?.message as string} {...field} />
          )} />
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <FormDate control={control} name='transfer_date' label={text.labels.date} minDate={batch.start_date} />
        </Grid>
        <Grid size={12}>
          <TextField size='small' fullWidth label={text.labels.remarks} {...register('remarks')} />
        </Grid>
      </Grid>
    </ActionDialog>
  );
};

export default TransferDialog;
