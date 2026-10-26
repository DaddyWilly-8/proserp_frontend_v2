'use client';

import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import { DatePicker, DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import { LoanRequestType } from './LoanRequestType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

export type LoanDirectDecisionMode = 'approve' | 'reject';

interface LoanDirectDecisionFormProps {
  open: boolean;
  mode: LoanDirectDecisionMode;
  belowLargeScreen: boolean;
  loanRequest: LoanRequestType;
  onClose: () => void;
}

const LoanDirectDecisionForm = ({
  open,
  mode,
  belowLargeScreen,
  loanRequest,
  onClose,
}: LoanDirectDecisionFormProps) => {
  const dictionary = useDictionary();
  const isApprove = mode === 'approve';

  const [amountApproved, setAmountApproved] = useState<number | ''>(
    loanRequest.amount
  );
  const [installmentsApproved, setInstallmentsApproved] = useState<number | ''>(
    loanRequest.installments
  );
  const [recoveryMode, setRecoveryMode] = useState<
    'installments' | 'fixed_amount'
  >(loanRequest.recovery_mode ?? 'installments');
  const [installmentAmountApproved, setInstallmentAmountApproved] = useState<
    number | ''
  >(loanRequest.installment_amount_requested ?? '');
  const [remarks, setRemarks] = useState('');
  const [reviewedAt, setReviewedAt] = useState(dayjs().toISOString());
  const [recoveryStartDate, setRecoveryStartDate] = useState<string | null>(
    loanRequest.recovery_start_date ?? null
  );
  const [amountError, setAmountError] = useState('');
  const [remarksError, setRemarksError] = useState('');

  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) return;
    setAmountApproved(loanRequest.amount);
    setInstallmentsApproved(loanRequest.installments);
    setRecoveryMode(loanRequest.recovery_mode ?? 'installments');
    setInstallmentAmountApproved(loanRequest.installment_amount_requested ?? '');
    setRemarks('');
    setReviewedAt(dayjs().toISOString());
    setRecoveryStartDate(loanRequest.recovery_start_date ?? null);
    setAmountError('');
    setRemarksError('');
  }, [open]);

  const { mutate: submit, isPending } = useMutation({
    mutationFn: isApprove
      ? humanResourcesServices.approveLoanRequest
      : humanResourcesServices.rejectLoanRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['showLoanRequest', loanRequest.id],
      });
      queryClient.invalidateQueries({ queryKey: ['loanRequests'] });
      enqueueSnackbar(
        isApprove
          ? dictionary.humanResources.loanRequests.directDecision.approvedMessage
          : dictionary.humanResources.loanRequests.directDecision.rejectedMessage,
        { variant: 'success' }
      );
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
    if (!isApprove && !remarks.trim()) {
      setRemarksError(dictionary.humanResources.loanRequests.approvalForm.errors.remarksRequired);
      return;
    }

    if (
      isApprove &&
      amountApproved !== '' &&
      Number(amountApproved) > Number(loanRequest.amount)
    ) {
      setAmountError(
        dictionary.humanResources.loanRequests.approvalForm.errors.cannotExceed.replace(
          '{amount}',
          Number(loanRequest.amount).toLocaleString()
        )
      );
      return;
    }

    setAmountError('');
    setRemarksError('');

    submit({
      id: loanRequest.id,
      amount_approved:
        isApprove && amountApproved !== '' ? Number(amountApproved) : undefined,
      recovery_mode: isApprove ? recoveryMode : undefined,
      installments_approved:
        isApprove &&
        recoveryMode === 'installments' &&
        installmentsApproved !== ''
          ? Number(installmentsApproved)
          : undefined,
      installment_amount_approved:
        isApprove &&
        recoveryMode === 'fixed_amount' &&
        installmentAmountApproved !== ''
          ? Number(installmentAmountApproved)
          : undefined,
      remarks: remarks || undefined,
      reviewed_at: reviewedAt || undefined,
      recovery_start_date: isApprove ? recoveryStartDate || undefined : undefined,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth='sm'
      fullScreen={belowLargeScreen}
      scroll={belowLargeScreen ? 'body' : 'paper'}
    >
      <DialogTitle>
        {isApprove
          ? dictionary.humanResources.loanRequests.directDecision.titleApprove
          : dictionary.humanResources.loanRequests.directDecision.titleReject}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {isApprove && (
            <>
              <TextField
                label={dictionary.humanResources.loanRequests.approvalForm.labels.amountApproved}
                size='small'
                fullWidth
                value={amountApproved}
                error={!!amountError}
                helperText={
                  amountError ||
                  dictionary.humanResources.loanRequests.directDecision.amountHelper.replace(
                    '{amount}',
                    Number(loanRequest.amount).toLocaleString()
                  )
                }
                InputProps={{ inputComponent: CommaSeparatedField as any }}
                onChange={(e: any) => {
                  setAmountError('');
                  setAmountApproved(
                    e.target.value === '' ? '' : sanitizedNumber(e.target.value)
                  );
                }}
              />
              <TextField
                select
                label={dictionary.humanResources.loanRequests.approvalForm.labels.recoveryMode}
                size='small'
                fullWidth
                value={recoveryMode}
                onChange={(e: any) => setRecoveryMode(e.target.value)}
              >
                <MenuItem value='installments'>
                  {dictionary.humanResources.loanRequests.approvalForm.labels.byInstallmentCount}
                </MenuItem>
                <MenuItem value='fixed_amount'>
                  {dictionary.humanResources.loanRequests.approvalForm.labels.byFixedAmount}
                </MenuItem>
              </TextField>
              {recoveryMode === 'fixed_amount' ? (
                <TextField
                  label={dictionary.humanResources.loanRequests.approvalForm.labels.amountToDeductPerPeriod}
                  size='small'
                  fullWidth
                  value={installmentAmountApproved}
                  helperText={dictionary.humanResources.loanRequests.approvalForm.helpers.installmentsDerived}
                  InputProps={{ inputComponent: CommaSeparatedField as any }}
                  onChange={(e: any) =>
                    setInstallmentAmountApproved(
                      e.target.value === '' ? '' : sanitizedNumber(e.target.value)
                    )
                  }
                />
              ) : (
                <TextField
                  label={dictionary.humanResources.loanRequests.approvalForm.labels.installmentsApproved}
                  size='small'
                  fullWidth
                  value={installmentsApproved}
                  onChange={(e: any) =>
                    setInstallmentsApproved(
                      e.target.value === '' ? '' : sanitizedNumber(e.target.value)
                    )
                  }
                />
              )}
              <DatePicker
                label={dictionary.humanResources.loanRequests.approvalForm.labels.recoveryStartOptional}
                views={['year', 'month']}
                minDate={dayjs().startOf('month')}
                value={recoveryStartDate ? dayjs(recoveryStartDate) : null}
                onChange={(val) =>
                  setRecoveryStartDate(
                    val ? val.startOf('month').format('YYYY-MM-DD') : null
                  )
                }
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    helperText: dictionary.humanResources.loanRequests.approvalForm.helpers.recoveryStartBlank,
                  },
                  field: { clearable: true },
                }}
              />
            </>
          )}
          <DateTimePicker
            label={
              isApprove
                ? dictionary.humanResources.loanRequests.directDecision.approvalDateTime
                : dictionary.humanResources.loanRequests.directDecision.rejectionDateTime
            }
            value={reviewedAt ? dayjs(reviewedAt) : null}
            onChange={(val) => setReviewedAt(val?.toISOString() || '')}
            slotProps={{
              textField: { size: 'small', fullWidth: true },
            }}
          />
          <TextField
            label={dictionary.humanResources.loanRequests.approvalForm.labels.remarks}
            size='small'
            fullWidth
            multiline
            minRows={2}
            required={!isApprove}
            value={remarks}
            error={!!remarksError}
            helperText={remarksError}
            onChange={(e: any) => {
              setRemarksError('');
              setRemarks(e.target.value);
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ flexWrap: 'wrap', gap: 1, rowGap: 1 }}>
        <Button onClick={onClose} disabled={isPending}>
          {dictionary.humanResources.loanRequests.common.cancel}
        </Button>
        <LoadingButton
          loading={isPending}
          variant='contained'
          color={isApprove ? 'success' : 'error'}
          size='small'
          onClick={handleSubmit}
        >
          {isApprove
            ? dictionary.humanResources.loanRequests.approvalForm.buttons.approve
            : dictionary.humanResources.loanRequests.approvalForm.buttons.reject}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default LoanDirectDecisionForm;
