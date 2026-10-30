'use client';

import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
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
import { getNextPendingLoanLevel } from './loanApprovalUtils';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

export type LoanApprovalDecisionStatus = 'approved' | 'rejected' | 'on hold';

interface LoanApprovalFormProps {
  open: boolean;
  belowLargeScreen: boolean;
  loanRequest: LoanRequestType;
  onClose: () => void;
}

// Chain-flow decision dialog only (this Approvals-tab flow is only ever
// reached when loanRequest.approval_chain_id is set — see
// LoanRequestsListItem/LoanApprovalsActionTail gating). Direct (no-chain)
// approve/reject is a separate, simpler action — not built yet, see notes.
const LoanApprovalForm = ({
  open,
  belowLargeScreen,
  loanRequest,
  onClose,
}: LoanApprovalFormProps) => {
  const dictionary = useDictionary();
  const approvals = loanRequest.approvals || [];
  const latestApproval = approvals[approvals.length - 1];
  const pendingLevel = getNextPendingLoanLevel(loanRequest);

  // Amount can only shrink from the previous decision (or the original
  // request, at the first level) — this is the ceiling shown/enforced.
  const ceilingAmount = latestApproval?.amount_approved ?? loanRequest.amount;

  const defaultInstallments =
    latestApproval?.installments_approved ?? loanRequest.installments;
  const defaultRecoveryMode =
    latestApproval?.recovery_mode ?? loanRequest.recovery_mode ?? 'installments';
  const defaultInstallmentAmount =
    latestApproval?.installment_amount_approved ??
    loanRequest.installment_amount_requested ??
    '';

  const [amountApproved, setAmountApproved] = useState<number | ''>(
    ceilingAmount
  );
  const [recoveryMode, setRecoveryMode] = useState<
    'installments' | 'fixed_amount'
  >(defaultRecoveryMode);
  const [installmentsApproved, setInstallmentsApproved] = useState<number | ''>(
    defaultInstallments
  );
  const [installmentAmountApproved, setInstallmentAmountApproved] = useState<
    number | ''
  >(defaultInstallmentAmount);
  const [remarks, setRemarks] = useState('');
  const [approvalDate, setApprovalDate] = useState(dayjs().toISOString());
  const [recoveryStartDate, setRecoveryStartDate] = useState<string | null>(
    loanRequest.recovery_start_date ?? null
  );
  const [amountError, setAmountError] = useState('');
  const [installmentsError, setInstallmentsError] = useState('');
  const [remarksError, setRemarksError] = useState('');

  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { showDialog, hideDialog } = useJumboDialog();

  useEffect(() => {
    if (!open) return;
    setAmountApproved(ceilingAmount);
    setRecoveryMode(defaultRecoveryMode);
    setInstallmentsApproved(defaultInstallments);
    setInstallmentAmountApproved(defaultInstallmentAmount);
    setRemarks('');
    setApprovalDate(dayjs().toISOString());
    setRecoveryStartDate(loanRequest.recovery_start_date ?? null);
    setAmountError('');
    setInstallmentsError('');
    setRemarksError('');
  }, [open]);

  const { mutate: submitDecision, isPending } = useMutation({
    mutationFn: humanResourcesServices.loanRequestChainDecision,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['showLoanRequest', loanRequest.id],
      });
      queryClient.invalidateQueries({ queryKey: ['loanRequests'] });
      enqueueSnackbar(dictionary.humanResources.loanRequests.approvalForm.messages.recorded, { variant: 'success' });
      onClose();
    },
    onError: (error: any) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  const handleDecision = (status: LoanApprovalDecisionStatus) => {
    if (status !== 'approved' && !remarks.trim()) {
      setRemarksError(dictionary.humanResources.loanRequests.approvalForm.errors.remarksRequired);
      return;
    }

    if (status === 'approved') {
      if (amountApproved === '' || Number(amountApproved) <= 0) {
        setAmountError(dictionary.humanResources.loanRequests.approvalForm.errors.amountRequired);
        return;
      }
      if (Number(amountApproved) > Number(ceilingAmount)) {
        setAmountError(
          dictionary.humanResources.loanRequests.approvalForm.errors.cannotExceed.replace(
            '{amount}',
            Number(ceilingAmount).toLocaleString()
          )
        );
        return;
      }
      if (recoveryMode === 'fixed_amount') {
        if (
          installmentAmountApproved === '' ||
          Number(installmentAmountApproved) <= 0
        ) {
          setInstallmentsError(
            dictionary.humanResources.loanRequests.approvalForm.errors.deductPerPeriodRequired
          );
          return;
        }
      } else if (
        installmentsApproved === '' ||
        Number(installmentsApproved) <= 0
      ) {
        setInstallmentsError(dictionary.humanResources.loanRequests.approvalForm.errors.installmentsRequired);
        return;
      }
    }

    setAmountError('');
    setInstallmentsError('');
    setRemarksError('');

    const chainLevelId = Number(pendingLevel?.id);
    if (!chainLevelId) {
      enqueueSnackbar(dictionary.humanResources.loanRequests.approvalForm.messages.pendingLevelNotFound, { variant: 'error' });
      return;
    }

    const submit = () =>
      submitDecision({
        id: loanRequest.id,
        loan_request_id: loanRequest.id,
        chain_level_id: chainLevelId,
        status,
        amount_approved:
          status === 'approved' ? Number(amountApproved) : undefined,
        recovery_mode: status === 'approved' ? recoveryMode : undefined,
        installments_approved:
          status === 'approved' && recoveryMode === 'installments'
            ? Number(installmentsApproved)
            : undefined,
        installment_amount_approved:
          status === 'approved' && recoveryMode === 'fixed_amount'
            ? Number(installmentAmountApproved)
            : undefined,
        remarks,
        approval_date: approvalDate || undefined,
        recovery_start_date:
          status === 'approved' ? recoveryStartDate || undefined : undefined,
      });

    // Rejection is a terminal, single-click decision (unlike Approve, which
    // just moves the request to the next level) — a confirm step guards
    // against a mis-click ending the request outright.
    if (status === 'rejected') {
      showDialog({
        title: dictionary.humanResources.loanRequests.approvalForm.dialog.rejectTitle,
        content: dictionary.humanResources.loanRequests.approvalForm.dialog.rejectContent,
        onYes: () => {
          hideDialog();
          submit();
        },
        onNo: () => hideDialog(),
        variant: 'confirm',
      });
      return;
    }

    submit();
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
      <DialogTitle>{dictionary.humanResources.loanRequests.approvalForm.title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {pendingLevel?.label && (
            <Alert severity='info' variant='outlined'>
              {dictionary.humanResources.loanRequests.approvalForm.decidingAs.replace(
                '{label}',
                pendingLevel.label
              )}
              {pendingLevel.role?.name ? ` (${pendingLevel.role.name})` : ''}
            </Alert>
          )}
          <TextField
            label={dictionary.humanResources.loanRequests.approvalForm.labels.amountApproved}
            size='small'
            fullWidth
            value={amountApproved}
            error={!!amountError}
            helperText={
              amountError ||
              dictionary.humanResources.loanRequests.approvalForm.helpers.max.replace(
                '{amount}',
                Number(ceilingAmount).toLocaleString()
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
            onChange={(e: any) => {
              setInstallmentsError('');
              setRecoveryMode(e.target.value);
            }}
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
              label={
                dictionary.humanResources.loanRequests.approvalForm.labels.amountToDeductPerPeriod
              }
              size='small'
              fullWidth
              value={installmentAmountApproved}
              error={!!installmentsError}
              helperText={
                installmentsError ||
                dictionary.humanResources.loanRequests.approvalForm.helpers.installmentsDerived
              }
              InputProps={{ inputComponent: CommaSeparatedField as any }}
              onChange={(e: any) => {
                setInstallmentsError('');
                setInstallmentAmountApproved(
                  e.target.value === '' ? '' : sanitizedNumber(e.target.value)
                );
              }}
            />
          ) : (
            <TextField
              label={dictionary.humanResources.loanRequests.approvalForm.labels.installmentsApproved}
              size='small'
              fullWidth
              value={installmentsApproved}
              error={!!installmentsError}
              helperText={installmentsError}
              onChange={(e: any) => {
                setInstallmentsError('');
                setInstallmentsApproved(
                  e.target.value === '' ? '' : sanitizedNumber(e.target.value)
                );
              }}
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
          <DateTimePicker
            label={dictionary.humanResources.loanRequests.approvalForm.labels.approvalDateTime}
            value={approvalDate ? dayjs(approvalDate) : null}
            onChange={(val) => setApprovalDate(val?.toISOString() || '')}
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
          color='error'
          size='small'
          onClick={() => handleDecision('rejected')}
        >
          {dictionary.humanResources.loanRequests.approvalForm.buttons.reject}
        </LoadingButton>
        <LoadingButton
          loading={isPending}
          variant='contained'
          color='warning'
          size='small'
          onClick={() => handleDecision('on hold')}
        >
          {dictionary.humanResources.loanRequests.approvalForm.buttons.hold}
        </LoadingButton>
        <LoadingButton
          loading={isPending}
          variant='contained'
          color='success'
          size='small'
          onClick={() => handleDecision('approved')}
        >
          {dictionary.humanResources.loanRequests.approvalForm.buttons.approve}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default LoanApprovalForm;
