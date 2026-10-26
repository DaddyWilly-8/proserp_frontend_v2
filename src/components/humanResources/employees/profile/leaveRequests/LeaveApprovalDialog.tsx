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
import { DatePicker, DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import humanResourcesServices from '../../../humanResourcesServices';
import { computeLeaveDays } from '../../../leaveTypes/leaveDayCount';
import { LeaveRequestType } from './LeaveRequestType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

export type LeaveApprovalDecision = 'approved' | 'rejected' | 'on hold';

const DEFAULT_APPROVAL_DATE = () => new Date().toISOString();

interface LeaveApprovalDialogProps {
  open: boolean;
  isEditMode: boolean;
  belowLargeScreen: boolean;
  leaveRequest: LeaveRequestType;
  approval?: NonNullable<LeaveRequestType['approvals']>[number];
  onClose: () => void;
}

export const getLeaveApprovalDecision = (
  approval: any
): LeaveApprovalDecision | 'unknown' => {
  const status = String(approval?.status || '').toLowerCase();
  const label = String(
    approval?.label || approval?.status_label || ''
  ).toLowerCase();

  if (status === 'rejected' || label === 'rejected') return 'rejected';
  if (status === 'on hold' || label === 'on hold') return 'on hold';
  if (status === 'approved' || label === 'approved') return 'approved';
  if (status === 'active' && label === 'approved') return 'approved';

  return 'unknown';
};

export const getNextPendingLeaveLevel = (
  leaveRequest: LeaveRequestType | undefined
) => {
  if (!leaveRequest) return undefined;

  const levels = [...(leaveRequest.approval_chain?.levels || [])].sort(
    (a: any, b: any) =>
      Number(a.position_index || a.level || 0) -
      Number(b.position_index || b.level || 0)
  );

  if (!levels.length) return undefined;

  const latestApproval =
    leaveRequest.approvals?.[leaveRequest.approvals.length - 1];
  if (!latestApproval) return levels[0];

  if (getLeaveApprovalDecision(latestApproval) !== 'approved') return undefined;

  const latestLevelId = Number(
    latestApproval.chain_level_id || latestApproval.approval_chain_level_id
  );

  if (!latestLevelId) return levels[0];

  const latestLevelIndex = levels.findIndex(
    (level) => Number(level.id) === latestLevelId
  );

  if (latestLevelIndex < 0) return undefined;

  return levels[latestLevelIndex + 1];
};

const formatBalancePeriod = (
  balance: NonNullable<LeaveRequestType['leave_balance']>
) => {
  const startYear = balance.start_date
    ? new Date(balance.start_date).getFullYear()
    : undefined;
  const endYear = balance.end_date
    ? new Date(balance.end_date).getFullYear()
    : startYear;

  if (!startYear) return '';
  return startYear !== endYear ? `${startYear} – ${endYear}` : `${startYear}`;
};

const LeaveApprovalDialog = ({
  open,
  isEditMode,
  belowLargeScreen,
  leaveRequest,
  approval,
  onClose,
}: LeaveApprovalDialogProps) => {
  const dictionary = useDictionary();
  const formatDays = (n: number | null | undefined) =>
    (Number(n) === 1
      ? dictionary.humanResources.leaveRequests.dayCountOne
      : dictionary.humanResources.leaveRequests.dayCountMany
    ).replace('{n}', String(n ?? 0));
  // An approver may reschedule the leave to whatever dates suit operations
  // best — the dates aren't confined to the request's own range. What IS
  // still bounded, same idea as loans' ceilingAmount: the day COUNT may only
  // shrink from one level to the next. When editing a decision (always the
  // latest one — see LeaveApprovalItemAction's canEdit), the ceiling is
  // whatever the level before it granted, not the decision being edited
  // itself. For a fresh decision, it's simply the latest decision so far.
  const approvals = leaveRequest.approvals || [];
  const priorApproval = isEditMode
    ? approvals[approvals.length - 2]
    : approvals[approvals.length - 1];
  const ceilingDays = priorApproval?.days_approved ?? leaveRequest.days_requested;
  // Pre-fill with whatever's currently on the table — just a starting
  // point, not a bound; the approver can move the dates anywhere.
  const defaultStartDate = priorApproval?.approved_start_date ?? leaveRequest.start_date;
  const defaultEndDate = priorApproval?.approved_end_date ?? leaveRequest.end_date;

  const [startDate, setStartDate] = useState<string>(
    approval?.approved_start_date || defaultStartDate
  );
  const [endDate, setEndDate] = useState<string>(
    approval?.approved_end_date || defaultEndDate
  );
  const [remarks, setRemarks] = useState('');
  const [remarksError, setRemarksError] = useState('');
  const [datesError, setDatesError] = useState('');
  const [approvalDate, setApprovalDate] = useState(DEFAULT_APPROVAL_DATE());

  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const pendingLevel = getNextPendingLeaveLevel(leaveRequest);

  // Days approved is derived from the chosen dates, the same way
  // days_requested is derived when the request is first submitted — never
  // typed in directly, so it can't disagree with the range.
  const daysApproved = computeLeaveDays(
    startDate,
    endDate,
    !!leaveRequest.leave_type?.excludes_saturday,
    !!leaveRequest.leave_type?.excludes_sunday
  );

  const balance = leaveRequest.leave_balance;
  const remainingDays = balance?.remaining_days ?? null;
  const wouldExceedBalance =
    balance?.has_allocation &&
    daysApproved != null &&
    daysApproved > (remainingDays ?? 0);

  useEffect(() => {
    if (!open) return;

    setStartDate(approval?.approved_start_date || defaultStartDate);
    setEndDate(approval?.approved_end_date || defaultEndDate);
    setRemarks(approval?.remarks || '');
    setApprovalDate(
      approval?.approval_date
        ? String(approval.approval_date)
        : DEFAULT_APPROVAL_DATE()
    );
    setRemarksError('');
    setDatesError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    approval?.approval_date,
    approval?.approved_start_date,
    approval?.approved_end_date,
    approval?.remarks,
    defaultStartDate,
    defaultEndDate,
    open,
  ]);

  const { mutate: addApproval, isPending: isAdding } = useMutation({
    mutationFn: humanResourcesServices.addLeaveRequestApproval,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['showLeaveRequest', leaveRequest.id],
      });
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      enqueueSnackbar(dictionary.humanResources.leaveRequests.messages.approvalRecorded, {
        variant: 'success',
      });
      onClose();
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message ||
          dictionary.humanResources.profileSectionsCommon.somethingWentWrong,
        { variant: 'error' }
      );
    },
  });

  const { mutate: editApproval, isPending: isEditing } = useMutation({
    mutationFn: ({ id, ...payload }: any) =>
      humanResourcesServices.updateLeaveRequestApproval(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['showLeaveRequest', leaveRequest.id],
      });
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      enqueueSnackbar(dictionary.humanResources.leaveRequests.messages.approvalUpdated, {
        variant: 'success',
      });
      onClose();
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message ||
          dictionary.humanResources.profileSectionsCommon.somethingWentWrong,
        { variant: 'error' }
      );
    },
  });

  const isSubmitting = isAdding || isEditing;

  const handleDecision = (status: LeaveApprovalDecision) => {
    if (status === 'rejected' && !remarks.trim()) {
      setRemarksError(dictionary.humanResources.leaveRequests.decision.remarksRequired);
      return;
    }

    if (status === 'approved') {
      if (!startDate || !endDate) {
        setDatesError(dictionary.humanResources.leaveRequests.approvalDialog.datesRequired);
        return;
      }
      if (dayjs(endDate).isBefore(dayjs(startDate))) {
        setDatesError(dictionary.humanResources.leaveRequests.approvalDialog.endBeforeStart);
        return;
      }
      if (!daysApproved || daysApproved <= 0) {
        setDatesError(dictionary.humanResources.leaveRequests.approvalDialog.noDaysGranted);
        return;
      }
      if (daysApproved > Number(ceilingDays)) {
        setDatesError(
          dictionary.humanResources.leaveRequests.approvalDialog.exceedsMax.replace('{max}', String(ceilingDays))
        );
        return;
      }
    }

    setRemarksError('');
    setDatesError('');

    if (isEditMode) {
      if (!approval?.id) {
        enqueueSnackbar(dictionary.humanResources.leaveRequests.messages.approvalNotFound, {
          variant: 'error',
        });
        return;
      }

      editApproval({
        id: approval.id,
        status,
        days_approved: status === 'approved' ? daysApproved : undefined,
        approved_start_date: status === 'approved' ? startDate : undefined,
        approved_end_date: status === 'approved' ? endDate : undefined,
        remarks,
        approval_date: approvalDate || undefined,
      });
      return;
    }

    const chainLevelId = Number(pendingLevel?.id);

    if (!chainLevelId) {
      enqueueSnackbar(dictionary.humanResources.leaveRequests.messages.pendingLevelNotFound, {
        variant: 'error',
      });
      return;
    }

    addApproval({
      leave_request_id: leaveRequest.id,
      chain_level_id: chainLevelId,
      status,
      days_approved: status === 'approved' ? daysApproved : undefined,
      approved_start_date: status === 'approved' ? startDate : undefined,
      approved_end_date: status === 'approved' ? endDate : undefined,
      remarks,
      approval_date: approvalDate || undefined,
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
        {isEditMode ? dictionary.humanResources.leaveRequests.decision.editTitle : dictionary.humanResources.leaveRequests.decision.title}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {balance && (
            <Alert severity={balance.has_allocation ? 'info' : 'warning'}>
              {balance.has_allocation ? (
                <>
                  {
                    dictionary.humanResources.leaveRequests.approvalDialog.balance
                      .replace('{period}', formatBalancePeriod(balance))
                      .replace('{used}', String(balance.used_days))
                      .replace('{allocated}', String(balance.allocated_days))
                      .split('{remaining}')[0]
                  }
                  <strong>{formatDays(balance.remaining_days)}</strong>
                  {
                    dictionary.humanResources.leaveRequests.approvalDialog.balance
                      .replace('{period}', formatBalancePeriod(balance))
                      .replace('{used}', String(balance.used_days))
                      .replace('{allocated}', String(balance.allocated_days))
                      .split('{remaining}')[1]
                  }
                  {balance.carried_forward_days > 0 && (
                    <>
                      {' '}
                      {dictionary.humanResources.leaveRequests.approvalDialog.carryIncludes.replace(
                        '{days}',
                        formatDays(balance.carried_forward_days)
                      )}
                      {balance.carry_forward_expires_at
                        ? dictionary.humanResources.leaveRequests.approvalDialog.carryUntil.replace(
                            '{date}',
                            balance.carry_forward_expires_at
                          )
                        : ''}
                    </>
                  )}
                </>
              ) : (
                <>
                  {dictionary.humanResources.leaveRequests.approvalDialog.noAllocation.replace(
                    '{date}',
                    String(leaveRequest.start_date)
                  )}
                </>
              )}
            </Alert>
          )}
          {wouldExceedBalance && (
            <Alert severity='error'>
              {dictionary.humanResources.leaveRequests.approvalDialog.exceedsBalance
                .replace('{days}', formatDays(daysApproved))
                .replace('{remaining}', String(remainingDays))}
            </Alert>
          )}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <DatePicker
              label={dictionary.humanResources.leaveRequests.approvalDialog.approvedStartDate}
              value={startDate ? dayjs(startDate) : null}
              onChange={(val: Dayjs | null) => {
                setDatesError('');
                setStartDate(val?.format('YYYY-MM-DD') || '');
              }}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                  error: !!datesError,
                },
              }}
            />
            <DatePicker
              label={dictionary.humanResources.leaveRequests.approvalDialog.approvedEndDate}
              value={endDate ? dayjs(endDate) : null}
              onChange={(val: Dayjs | null) => {
                setDatesError('');
                setEndDate(val?.format('YYYY-MM-DD') || '');
              }}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                  error: !!datesError,
                },
              }}
            />
          </Stack>
          <Typography
            variant='caption'
            color={datesError ? 'error' : 'text.secondary'}
          >
            {datesError ||
              dictionary.humanResources.leaveRequests.approvalDialog.daysHint
                .replace('{days}', formatDays(daysApproved ?? 0))
                .replace('{max}', formatDays(ceilingDays))}
          </Typography>
          <DateTimePicker
            label={dictionary.humanResources.leaveRequests.decision.approvalDateTime}
            value={approvalDate ? dayjs(approvalDate) : null}
            onChange={(val) => setApprovalDate(val?.toISOString() || '')}
            slotProps={{
              textField: { size: 'small', fullWidth: true },
            }}
          />
          <TextField
            label={dictionary.humanResources.leaveRequests.decision.remarks}
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
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          {dictionary.humanResources.leaveRequests.decision.cancel}
        </Button>
        <LoadingButton
          loading={isSubmitting}
          variant='contained'
          color='error'
          size='small'
          onClick={() => handleDecision('rejected')}
        >
          {dictionary.humanResources.leaveRequests.decision.reject}
        </LoadingButton>
        <LoadingButton
          loading={isSubmitting}
          disabled={wouldExceedBalance}
          variant='contained'
          color='success'
          size='small'
          onClick={() => handleDecision('approved')}
        >
          {dictionary.humanResources.leaveRequests.decision.approve}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default LeaveApprovalDialog;
