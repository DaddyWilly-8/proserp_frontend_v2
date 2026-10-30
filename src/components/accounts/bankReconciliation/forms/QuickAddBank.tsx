import React from 'react';
import { Box, Button, Grid, TextField, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useSnackbar } from 'notistack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import bankReconciliationServices from '../bank-reconciliation-services';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface BankFormData {
  name: string;
  short_name?: string;
  swift_code?: string;
}

interface Bank extends BankFormData {
  id: number;
}

interface QuickAddBankProps {
  onCancel: () => void;
  onCreated: (bank: Bank) => void;
}

export default function QuickAddBank({ onCancel, onCreated }: QuickAddBankProps) {
  const dictionary = useDictionary();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const addBankMutation = useMutation({
    mutationFn: (data: BankFormData) => bankReconciliationServices.addBank(data),
    onSuccess: (response: { data: Bank }) => {
      queryClient.invalidateQueries({ queryKey: ['banks-list'] });
      enqueueSnackbar(dictionary.forms.bankReconciliation.quickAddBank.messages.createSuccess, { variant: 'success' });
      onCreated(response.data);
    },
    onError: (err: any) => {
      enqueueSnackbar(err?.response?.data?.message || dictionary.forms.bankReconciliation.quickAddBank.messages.createFailed, { variant: 'error' });
    },
  });

  const validationSchema = yup.object({
    name: yup.string().required(dictionary.forms.bankReconciliation.quickAddBank.errors.validation.nameRequired),
    short_name: yup.string().nullable(),
    swift_code: yup.string().nullable(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BankFormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: { name: '', short_name: '', swift_code: '' },
  });

  return (
    <>
      <Typography variant='h6' textAlign='center'>
        {dictionary.forms.bankReconciliation.quickAddBank.title}
      </Typography>
      <Grid container spacing={1}>
        <Grid size={12}>
          <TextField
            fullWidth
            label={dictionary.forms.bankReconciliation.quickAddBank.labels.name}
            size='small'
            error={!!errors.name}
            helperText={errors.name?.message}
            {...register('name')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth label={dictionary.forms.bankReconciliation.quickAddBank.labels.shortName} size='small' {...register('short_name')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth label={dictionary.forms.bankReconciliation.quickAddBank.labels.swiftCode} size='small' {...register('swift_code')} />
        </Grid>
        <Grid size={12}>
          <Box display='flex' justifyContent='flex-end'>
            <Button size='small' type='button' onClick={onCancel}>
              {dictionary.forms.bankReconciliation.quickAddBank.buttons.cancel}
            </Button>
            <LoadingButton
              type='submit'
              variant='contained'
              size='small'
              onClick={handleSubmit((data) => addBankMutation.mutate(data))}
              loading={addBankMutation.isPending}
            >
              {dictionary.forms.bankReconciliation.quickAddBank.buttons.add}
            </LoadingButton>
          </Box>
        </Grid>
      </Grid>
    </>
  );
}
