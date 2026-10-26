'use client';

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
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import humanResourcesServices from '../humanResourcesServices';
import { LoanRequestType } from './LoanRequestType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface LoanRepaymentInitiateFormProps {
  open: boolean;
  belowLargeScreen: boolean;
  loanRequest: LoanRequestType;
  onClose: () => void;
}

/**
 * HR's side of a repayment — just the amount and why, no ledger. Not an
 * approval request: it's a plain fact-of-record ("this amount is on its way
 * in"). Accounts picks the ledger separately once this lands on their
 * Approved Loans list (see LoanReceiptForm), since they're the ones who
 * actually know where the money arrived.
 */
const LoanRepaymentInitiateForm = ({
  open,
  belowLargeScreen,
  loanRequest,
  onClose,
}: LoanRepaymentInitiateFormProps) => {
  const dictionary = useDictionary();
  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('');
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) return;
    setAmount('');
    setNarration('');
  }, [open]);

  const { mutate: initiateRepayment, isPending } = useMutation({
    mutationFn: humanResourcesServices.initiateLoanRepayment,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['showLoanRequest', loanRequest.id],
      });
      queryClient.invalidateQueries({ queryKey: ['loanRequests'] });
      queryClient.invalidateQueries({ queryKey: ['loanStatement', loanRequest.id] });
      enqueueSnackbar(dictionary.humanResources.loanRequests.repaymentInitiate.messages.initiated, {
        variant: 'success',
      });
      onClose();
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || dictionary.humanResources.loanRequests.common.somethingWentWrong,
        { variant: 'error' }
      );
    },
  });

  // Same ceiling the backend enforces: outstanding balance net of anything
  // already initiated and awaiting receipt — HR shouldn't be able to
  // initiate more repayment than is actually left.
  const alreadyInitiated = (loanRequest.repayments || [])
    .filter((r) => r.status === 'initiated')
    .reduce((sum, r) => sum + Number(r.amount), 0);
  const requestable = Math.max(
    0,
    (loanRequest.outstanding_balance ?? Infinity) - alreadyInitiated
  );

  const numericAmount = Number(amount);
  const exceedsRequestable =
    Number.isFinite(requestable) && numericAmount > requestable + 0.01;
  const canSubmit = numericAmount > 0 && !exceedsRequestable;

  const handleSubmit = () => {
    if (!canSubmit) return;
    initiateRepayment({
      id: loanRequest.id,
      amount: numericAmount,
      narration: narration || undefined,
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
      <DialogTitle>{dictionary.humanResources.loanRequests.repaymentInitiate.title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {typeof loanRequest.outstanding_balance === 'number' && (
            <Alert severity='info'>
              {dictionary.humanResources.loanRequests.repaymentInitiate.outstandingBalance}{' '}
              {loanRequest.outstanding_balance.toLocaleString()}
              {alreadyInitiated > 0 && (
                <>
                  {' '}
                  {dictionary.humanResources.loanRequests.repaymentInitiate.alreadyInitiated
                    .replace('{initiated}', alreadyInitiated.toLocaleString())
                    .replace('{left}', requestable.toLocaleString())}
                </>
              )}
            </Alert>
          )}
          <TextField
            label={dictionary.humanResources.loanRequests.common.amount}
            size='small'
            fullWidth
            value={amount}
            error={exceedsRequestable}
            helperText={
              exceedsRequestable
                ? dictionary.humanResources.loanRequests.repaymentInitiate.cannotExceed.replace(
                    '{amount}',
                    requestable.toLocaleString()
                  )
                : ' '
            }
            InputProps={{ inputComponent: CommaSeparatedField as any }}
            onChange={(e: any) =>
              setAmount(e.target.value === '' ? '' : sanitizedNumber(e.target.value))
            }
          />
          <TextField
            label={dictionary.humanResources.loanRequests.repaymentInitiate.labels.narrationOptional}
            placeholder={
              dictionary.humanResources.loanRequests.repaymentInitiate.placeholders.narration
            }
            size='small'
            fullWidth
            multiline
            minRows={2}
            value={narration}
            onChange={(e) => setNarration(e.target.value)}
          />
          <Typography variant='caption' color='text.secondary'>
            {dictionary.humanResources.loanRequests.repaymentInitiate.note}
          </Typography>
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
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {dictionary.humanResources.loanRequests.repaymentInitiate.title}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default LoanRepaymentInitiateForm;
