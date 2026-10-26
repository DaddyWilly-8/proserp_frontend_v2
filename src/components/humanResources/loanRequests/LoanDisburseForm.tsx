'use client';

import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import LedgerSelectProvider from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
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

interface LoanDisburseFormProps {
  open: boolean;
  belowLargeScreen: boolean;
  loanRequest: LoanRequestType;
  onClose: () => void;
}

const LoanDisburseForm = ({
  open,
  belowLargeScreen,
  loanRequest,
  onClose,
}: LoanDisburseFormProps) => {
  const dictionary = useDictionary();
  const [creditLedgerId, setCreditLedgerId] = useState(0);
  const [disbursedAt, setDisbursedAt] = useState(dayjs().toISOString());
  const [reference, setReference] = useState('');
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) return;
    setCreditLedgerId(0);
    setDisbursedAt(dayjs().toISOString());
    setReference('');
  }, [open]);

  const { mutate: disburse, isPending } = useMutation({
    mutationFn: humanResourcesServices.disburseLoanRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['showLoanRequest', loanRequest.id],
      });
      queryClient.invalidateQueries({ queryKey: ['loanRequests'] });
      enqueueSnackbar(dictionary.humanResources.loanRequests.disburseForm.messages.disbursed, { variant: 'success' });
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
    if (!creditLedgerId) return;
    disburse({
      id: loanRequest.id,
      credit_ledger_id: creditLedgerId,
      disbursed_at: disbursedAt || undefined,
      reference: reference || undefined,
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
      <DialogTitle>{dictionary.humanResources.loanRequests.disburseForm.title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <LedgerSelectProvider>
            <LedgerSelect
              label={dictionary.humanResources.loanRequests.disburseForm.labels.payFrom}
              allowedGroups={[
                'Current Assets',
                'Current Liabilities',
                'Cash and Cash Equivalents',
                'Banks',
                'Accounts Payable',
                'Accounts Receivable',
              ]}
              onChange={(ledger: any) => setCreditLedgerId(ledger?.id || 0)}
            />
          </LedgerSelectProvider>
          <DateTimePicker
            label={dictionary.humanResources.loanRequests.disburseForm.labels.paymentDateTime}
            value={disbursedAt ? dayjs(disbursedAt) : null}
            onChange={(val) => setDisbursedAt(val?.toISOString() || '')}
            slotProps={{
              textField: { size: 'small', fullWidth: true },
            }}
          />
          <TextField
            label={dictionary.humanResources.loanRequests.common.referenceOptional}
            placeholder={dictionary.humanResources.loanRequests.disburseForm.placeholders.reference}
            size='small'
            fullWidth
            value={reference}
            onChange={(e) => setReference(e.target.value)}
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
          disabled={!creditLedgerId}
          onClick={handleSubmit}
        >
          {dictionary.humanResources.loanRequests.disburseForm.buttons.disburse}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default LoanDisburseForm;
