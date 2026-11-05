'use client'

import React from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { Grid } from '@mui/material';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { batchServices } from '../../bio-production-services';
import { BatchStage, DialogProps } from '../batchTypes';
import ActionDialog, { FormDate, useBatchAction } from './ActionDialog';

/** Corrects when one stage of an open batch began; the server checks it against the neighbouring stages and the records made. */
const StageDateDialog = ({ batch, stage, open, onClose }: DialogProps & { stage: BatchStage }) => {
  const text = useDictionary().bioProduction.batches;
  const dialog = text.dialogs.stageDate;

  const schema = yup.object({ start_date: yup.string().required(text.validation.dateRequired) });
  const { control, handleSubmit } = useForm<any>({ resolver: yupResolver(schema) as any, defaultValues: { start_date: stage.start_date } });

  const { mutate, isPending } = useBatchAction(batch.id, batchServices.updateStage, onClose);

  return (
    <ActionDialog open={open} title={dialog.title.replace('{stage}', stage.name)} help={dialog.help} loading={isPending} onClose={onClose}
      onSubmit={handleSubmit((data: any) => mutate({ id: batch.id, stageId: stage.id, ...data }))}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormDate control={control} name='start_date' label={dialog.label} />
        </Grid>
      </Grid>
    </ActionDialog>
  );
};

export default StageDateDialog;
