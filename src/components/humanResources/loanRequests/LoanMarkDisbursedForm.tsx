'use client';

import { LoadingButton } from '@mui/lab';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import { LoanRequestType } from './LoanRequestType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface LoanMarkDisbursedFormProps {
  open: boolean;
  belowLargeScreen: boolean;
  loanRequest: LoanRequestType;
  onClose: () => void;
}

const LoanMarkDisbursedForm = ({
  open,
  belowLargeScreen,
  loanRequest,
  onClose,
}: LoanMarkDisbursedFormProps) => {
  const dictionary = useDictionary();
  const [reference, setReference] = useState('');
  const [disbursedAt, setDisbursedAt] = useState(dayjs().toISOString());
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) return;
    setReference('');
    setDisbursedAt(dayjs().toISOString());
  }, [open]);

  const { mutate: markDisbursed, isPending } = useMutation({
    mutationFn: humanResourcesServices.markLoanRequestDisbursed,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['showLoanRequest', loanRequest.id],
      });
      queryClient.invalidateQueries({ queryKey: ['loanRequests'] });
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] }); // see known-issues-cleanup.md
      enqueueSnackbar(dictionary.humanResources.loanRequests.markDisbursed.messages.marked, { variant: 'success' });
      onClose();
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || dictionary.humanResources.loanRequests.common.somethingWentWrong,
        { variant: 'error' }
      );
    },
  });

  const handleSubmit = () => {
    markDisbursed({
      id: loanRequest.id,
      reference: reference || undefined,
      disbursed_at: disbursedAt || undefined,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth='xs'
      fullScreen={belowLargeScreen}
      scroll={belowLargeScreen ? 'body' : 'paper'}
    >
      <DialogTitle>{dictionary.humanResources.loanRequests.markDisbursed.title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label={dictionary.humanResources.loanRequests.common.referenceOptional}
            placeholder={dictionary.humanResources.loanRequests.markDisbursed.placeholders.reference}
            size='small'
            fullWidth
            multiline
            minRows={2}
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
          <DateTimePicker
            label={dictionary.humanResources.loanRequests.markDisbursed.labels.paymentDateTime}
            value={disbursedAt ? dayjs(disbursedAt) : null}
            onChange={(val) => setDisbursedAt(val?.toISOString() || '')}
            slotProps={{
              textField: { size: 'small', fullWidth: true },
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isPending}>
          {dictionary.humanResources.loanRequests.common.cancel}
        </Button>
        <LoadingButton
          loading={isPending}
          variant='contained'
          color='success'
          size='small'
          onClick={handleSubmit}
        >
          {dictionary.humanResources.loanRequests.markDisbursed.buttons.markAsDisbursed}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default LoanMarkDisbursedForm;
