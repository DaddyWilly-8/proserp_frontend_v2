'use client'

import React from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { Alert, Grid } from '@mui/material';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { animalText } from '../../animalText';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import { batchServices } from '../../bio-production-services';
import { DialogProps } from '../batchTypes';
import ActionDialog, { FormDate, useBatchAction } from './ActionDialog';
import { nowStamp } from '../../dateTime';

const CloseDialog = ({ batch, open, onClose }: DialogProps) => {
  const text = useDictionary().bioProduction.batches;
  const dialog = text.dialogs.close;
  const hasFish = batch.current_quantity > 0;

  const schema = yup.object({
    date: yup.string().required(text.validation.dateRequired),
    loss_ledger_id: yup.number().transform((value, original) => (original == null || original === '' ? null : value)).nullable(),
  });
  const { control, register, handleSubmit, setValue, reset, formState: { errors } } = useForm<any>({
    resolver: yupResolver(schema) as any,
    defaultValues: { date: nowStamp(), loss_ledger_id: null },
  });

  const { mutate, isPending } = useBatchAction(batch.id, batchServices.close, () => { reset(); onClose(); });

  return (
    <ActionDialog open={open} title={dialog.title} help={animalText(dialog.help, batch.species_template?.count_label)} loading={isPending} disableSubmit={hasFish} onClose={onClose}
      onSubmit={handleSubmit((data: any) => mutate({ id: batch.id, ...data }))}>
      {hasFish && (
        <Alert severity='warning' sx={{ mb: 2 }}>{animalText(dialog.fishLeft, batch.species_template?.count_label).replace('{count}', batch.current_quantity.toLocaleString())}</Alert>
      )}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormDate control={control} name='date' label={text.labels.date} minDate={batch.start_date} />
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <LedgerSelect
            label={dialog.lossLedger}
            allowedGroups={['Expenses']}
            onChange={(ledger: any) => setValue('loss_ledger_id', ledger?.id ?? null)}
          />
        </Grid>
      </Grid>
    </ActionDialog>
  );
};

export default CloseDialog;
