'use client'

import React from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { Alert, Grid, LinearProgress, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { animalText } from '../../animalText';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import { batchServices } from '../../bio-production-services';
import { DialogProps } from '../batchTypes';
import ActionDialog, { FormDate, useBatchAction } from './ActionDialog';
import { nowStamp } from '../../dateTime';
import { useBioAccess } from '../../useBioAccess';

export interface WriteOffPreview {
  quantity: number;
  wip_balance: number;
  cost_per_fish: number;
  amount: number;
  stages: { batch_stage_id: number; name: string; quantity: number; amount: number }[];
}

export const useWriteOffPreview = (batchId: number, enabled: boolean) =>
  useQuery<WriteOffPreview>({
    queryKey: ['bioWriteOffPreview', batchId],
    queryFn: () => batchServices.getWriteOffPreview(batchId),
    enabled,
  });

const money = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 2 });

const WriteOffDialog = ({ batch, open, onClose }: DialogProps) => {
  const text = useDictionary().bioProduction.batches;
  const { finance } = useBioAccess();
  const dialog = text.dialogs.writeOff;
  const { data: preview, isFetching } = useWriteOffPreview(batch.id, open);

  const schema = yup.object({
    date: yup.string().required(text.validation.dateRequired),
    loss_ledger_id: yup.number().typeError(text.validation.ledgerRequired).required(text.validation.ledgerRequired),
  });
  const { control, register, handleSubmit, setValue, reset, formState: { errors } } = useForm<any>({
    resolver: yupResolver(schema) as any,
    defaultValues: { date: nowStamp(), loss_ledger_id: null },
  });

  const { mutate, isPending } = useBatchAction(batch.id, batchServices.writeOffMortality, () => { reset(); onClose(); });
  const nothing = !isFetching && preview?.quantity === 0;

  return (
    <ActionDialog open={open} title={dialog.title} help={dialog.help} loading={isPending} disableSubmit={!preview || nothing} onClose={onClose}
      onSubmit={handleSubmit((data: any) => mutate({ id: batch.id, ...data }))}>
      {isFetching && <LinearProgress sx={{ mb: 2 }} />}
      {nothing && <Alert severity='success' sx={{ mb: 2 }}>{dialog.nothing}</Alert>}
      {preview && preview.quantity > 0 && (
        <Grid container spacing={1} mb={2}>
          {!finance && <Grid size={12}><Typography>{animalText('{quantity} {animals}', batch.species_template?.count_label).replace('{quantity}', preview.quantity.toLocaleString())}</Typography></Grid>}
          {finance && <>
          <Grid size={12}>
            <Typography>{animalText(dialog.summary, batch.species_template?.count_label).replace('{quantity}', preview.quantity.toLocaleString()).replace('{rate}', money(preview.cost_per_fish))}</Typography>
          </Grid>
          <Grid size={6}>
            <Typography variant='body2' color='text.secondary'>{dialog.balance}</Typography>
            <Typography variant='h5'>{money(preview.wip_balance)}</Typography>
          </Grid>
          <Grid size={6}>
            <Typography variant='body2' color='text.secondary'>{dialog.total}</Typography>
            <Typography variant='h5' color='error'>{money(preview.amount)}</Typography>
          </Grid>
          {preview.stages.map((stage) => (
            <Grid size={12} key={stage.batch_stage_id}>
              <Typography variant='body2'>{stage.name}: {stage.quantity.toLocaleString()} → {money(stage.amount)}</Typography>
            </Grid>
          ))}
          </>}
        </Grid>
      )}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormDate control={control} name='date' label={text.labels.date} minDate={batch.start_date} />
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <LedgerSelect
            label={dialog.lossLedger}
            allowedGroups={['Expenses']}
            frontError={errors.loss_ledger_id as any}
            onChange={(ledger: any) => setValue('loss_ledger_id', ledger?.id ?? null, { shouldValidate: true })}
          />
        </Grid>
      </Grid>
    </ActionDialog>
  );
};

export default WriteOffDialog;
