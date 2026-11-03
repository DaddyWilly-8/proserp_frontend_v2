'use client'

import React from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { Grid, TextField, Typography } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import { batchServices } from '../../bio-production-services';
import { DialogProps } from '../batchTypes';
import ActionDialog, { FormDate, useBatchAction } from './ActionDialog';
import { nowStamp } from '../../dateTime';
import NumberField from '../../NumberField';
import { BIO_WIP_LEDGER_ID } from '../batchConstants';
import { FormNumber } from '../../NumberField';

const ExpenseDialog = ({ batch, open, onClose }: DialogProps) => {
  const text = useDictionary().bioProduction.batches;
  const dialog = text.dialogs.expense;

  const schema = yup.object({
    expense_date: yup.string().required(text.validation.dateRequired),
    ledger_id: yup.number().typeError(text.validation.ledgerRequired).required(text.validation.ledgerRequired),
    quantity: yup.number().typeError(text.validation.numberInvalid).moreThan(0, text.validation.numberInvalid).required(text.validation.numberInvalid),
    rate: yup.number().typeError(text.validation.numberInvalid).moreThan(0, text.validation.numberInvalid).required(text.validation.numberInvalid),
    remarks: yup.string().nullable(),
  });
  const { control, register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<any>({
    resolver: yupResolver(schema) as any,
    defaultValues: { expense_date: nowStamp(), ledger_id: null, quantity: 1, rate: undefined, remarks: '' },
  });

  const { mutate, isPending } = useBatchAction(batch.id, batchServices.addExpense, () => { reset(); onClose(); });
  const total = Number(watch('quantity') || 0) * Number(watch('rate') || 0);

  return (
    <ActionDialog open={open} title={dialog.title} help={dialog.help} loading={isPending} onClose={onClose}
      onSubmit={handleSubmit((data: any) => mutate({ id: batch.id, ...data }))}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <LedgerSelect
            label={dialog.ledger}
            allowedGroups={['Expenses']}
            notAllowedLedgers={[BIO_WIP_LEDGER_ID]}
            frontError={errors.ledger_id as any}
            onChange={(ledger: any) => setValue('ledger_id', ledger?.id ?? null, { shouldValidate: true })}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormDate control={control} name='expense_date' label={text.labels.date} minDate={batch.start_date} />
        </Grid>
        <Grid size={{ xs: 6, md: 4 }}>
          <FormNumber control={control} name='quantity' label={dialog.quantity} error={!!errors.quantity} helperText={errors.quantity?.message as string} />
        </Grid>
        <Grid size={{ xs: 6, md: 4 }}>
          <Controller name='rate' control={control} render={({ field }) => (
            <NumberField label={dialog.rate} error={!!errors.rate} helperText={errors.rate?.message as string} value={field.value} onChange={field.onChange} />
          )} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }} alignContent='center'>
          <Typography variant='body2' color='text.secondary'>{dialog.total}</Typography>
          <Typography variant='h5'>{total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Typography>
        </Grid>
        <Grid size={12}>
          <TextField size='small' fullWidth label={text.labels.remarks} {...register('remarks')} />
        </Grid>
      </Grid>
    </ActionDialog>
  );
};

export default ExpenseDialog;
