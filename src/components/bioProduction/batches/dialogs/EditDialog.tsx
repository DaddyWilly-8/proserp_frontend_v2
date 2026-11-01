'use client'

import React from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { Grid, TextField } from '@mui/material';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { batchServices } from '../../bio-production-services';
import { DialogProps } from '../batchTypes';
import ActionDialog, { FormDate, useBatchAction } from './ActionDialog';

/** Corrects when a batch started, and its remarks. */
const EditDialog = ({ batch, open, onClose }: DialogProps) => {
  const text = useDictionary().bioProduction.batches;
  const dialog = text.dialogs.edit;
  const { authOrganization } = useJumboAuth();
  const recordingStart = authOrganization?.organization?.recording_start_date;

  const schema = yup.object({
    start_date: yup.string().required(text.validation.dateRequired),
    remarks: yup.string().nullable(),
  });
  const { control, register, handleSubmit, reset, formState: { errors } } = useForm<any>({
    resolver: yupResolver(schema) as any,
    defaultValues: { start_date: batch.start_date, remarks: batch.remarks ?? '' },
  });
  // Start from what the batch holds now each time the dialog opens.
  React.useEffect(() => {
    if (open) reset({ start_date: batch.start_date, remarks: batch.remarks ?? '' });
  }, [open, batch.start_date, batch.remarks, reset]);

  const { mutate, isPending } = useBatchAction(batch.id, batchServices.update, onClose);

  return (
    <ActionDialog open={open} title={dialog.title} help={dialog.help} loading={isPending} onClose={onClose}
      onSubmit={handleSubmit((data: any) => mutate({ id: batch.id, ...data }))}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 5 }}>
          <FormDate control={control} name='start_date' label={text.labels.startDate} minDate={recordingStart} />
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <TextField size='small' fullWidth label={text.labels.remarks} error={!!errors.remarks} {...register('remarks')} />
        </Grid>
      </Grid>
    </ActionDialog>
  );
};

export default EditDialog;
