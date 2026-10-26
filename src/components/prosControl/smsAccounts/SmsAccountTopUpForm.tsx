'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { Button, DialogActions, DialogContent, DialogTitle, Grid, TextField, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { Div } from '@jumbo/shared';
import smsAccountsServices from './smsAccounts-services';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface SmsAccount {
  id: number;
  balance: number;
  organization?: { name: string };
}

interface FormData {
  amount: number;
  notes: string;
}

const SmsAccountTopUpForm = ({
  account,
  setOpenDialog,
}: {
  account: SmsAccount;
  setOpenDialog: (open: boolean) => void;
}) => {
  const dictionary = useDictionary();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const validationSchema = yup.object({
    amount: yup.number().min(1, dictionary.forms.smsAccounts.form.errors.min1).required(dictionary.forms.smsAccounts.form.errors.amountRequired),
    notes: yup.string().default(''),
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: { amount: 0, notes: '' },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) => smsAccountsServices.topUp({ id: account.id, ...data }),
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar(dictionary.forms.smsAccounts.form.messages.toppedUp, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['sms-accounts'] });
    },
    onError: (error) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  const onSubmit = handleSubmit((data) => mutate(data));

  return (
    <>
      <DialogTitle>{dictionary.forms.smsAccounts.form.topUpTitle}</DialogTitle>
      <DialogContent>
        <Typography color='text.secondary' mb={2}>
          {dictionary.forms.smsAccounts.form.summary.replace('{name}', String(account.organization?.name ?? '')).replace('{balance}', String(account.balance))}
        </Typography>
        <form autoComplete='off' onSubmit={onSubmit}>
          <Grid container spacing={2}>
            <Grid size={12}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='amount'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={dictionary.forms.smsAccounts.form.labels.amount}
                      type='number'
                      fullWidth
                      size='small'
                      autoFocus
                      error={!!errors.amount}
                      helperText={errors.amount?.message}
                    />
                  )}
                />
              </Div>
            </Grid>
            <Grid size={12}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='notes'
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label={dictionary.forms.smsAccounts.form.labels.notes} fullWidth multiline minRows={2} size='small' />
                  )}
                />
              </Div>
            </Grid>
          </Grid>
          <DialogActions>
            <Button size='small' onClick={() => setOpenDialog(false)}>
              {dictionary.forms.smsAccounts.form.buttons.cancel}
            </Button>
            <LoadingButton type='submit' variant='contained' size='small' loading={isPending}>
              {dictionary.forms.smsAccounts.form.buttons.topUp}
            </LoadingButton>
          </DialogActions>
        </form>
      </DialogContent>
    </>
  );
};

export default SmsAccountTopUpForm;
