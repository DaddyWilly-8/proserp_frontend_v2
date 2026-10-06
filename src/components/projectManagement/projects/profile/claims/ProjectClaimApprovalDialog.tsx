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
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import projectsServices from '@/components/projectManagement/projects/project-services';
import { ProjectClaim } from './ProjectClaimType';

export type ProjectClaimApprovalDecision = 'approved' | 'rejected' | 'on hold' | 'returned';

const DEFAULT_APPROVAL_DATE = () => new Date().toISOString();

interface ProjectClaimApprovalDialogProps {
  open: boolean;
  belowLargeScreen: boolean;
  claim: ProjectClaim;
  onClose: () => void;
}

export const getProjectClaimApprovalDecision = (
  approval: any
): ProjectClaimApprovalDecision | 'unknown' => {
  const status = String(approval?.status || '').toLowerCase();

  if (status === 'rejected') return 'rejected';
  if (status === 'on hold') return 'on hold';
  if (status === 'approved') return 'approved';
  if (status === 'returned') return 'returned';

  return 'unknown';
};

export const getNextPendingProjectClaimApprovalLevel = (
  claim: ProjectClaim | undefined
) => {
  if (!claim) return undefined;

  const levels = [...(claim.approval_chain?.levels || [])].sort(
    (a, b) => Number(a.position_index || 0) - Number(b.position_index || 0)
  );

  if (!levels.length) return undefined;

  const latestApproval = claim.approvals?.[claim.approvals.length - 1];
  if (!latestApproval) return levels[0];

  if (getProjectClaimApprovalDecision(latestApproval) !== 'approved') return undefined;

  const latestLevelId = Number(latestApproval.approval_chain_level_id);

  if (!latestLevelId) return levels[0];

  const latestLevelIndex = levels.findIndex(
    (level) => Number(level.id) === latestLevelId
  );

  if (latestLevelIndex < 0) return undefined;

  return levels[latestLevelIndex + 1];
};

const ProjectClaimApprovalDialog = ({
  open,
  belowLargeScreen,
  claim,
  onClose,
}: ProjectClaimApprovalDialogProps) => {
  const [remarks, setRemarks] = useState('');
  const [remarksError, setRemarksError] = useState('');
  const [approvalDate, setApprovalDate] = useState(DEFAULT_APPROVAL_DATE());

  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const pendingLevel = getNextPendingProjectClaimApprovalLevel(claim);
  const latestApproval = claim.approvals?.[claim.approvals.length - 1];

  useEffect(() => {
    if (!open) return;

    setRemarks('');
    setApprovalDate(DEFAULT_APPROVAL_DATE());
    setRemarksError('');
  }, [open]);

  const { mutate: addApproval, isPending: isSubmitting } = useMutation({
    mutationFn: projectsServices.addProjectPaymentClaimApproval,
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({
        queryKey: ['claimDetails', claim.id],
      });
      queryClient.invalidateQueries({
        queryKey: ['claim-details', claim.id],
      });
      queryClient.invalidateQueries({ queryKey: ['projectProjectClaims'] });
      enqueueSnackbar(data?.message || 'Claim approval recorded', { variant: 'success' });
      onClose();
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || 'Something went wrong',
        { variant: 'error' }
      );
    },
  });

  const handleDecision = (status: ProjectClaimApprovalDecision) => {
    if (status !== 'approved' && !remarks.trim()) {
      setRemarksError('Remarks are required');
      return;
    }

    setRemarksError('');

    // A return can happen from any point in the chain's progress (mid-review, on hold, or even
    // after a final approval) where there's no well-defined "next level" left - fall back to the
    // level the latest decision was made at, or the chain's first level, so there's always a
    // valid level id to submit.
    const chainLevelId =
      status === 'returned'
        ? Number(
            pendingLevel?.id ||
              latestApproval?.approval_chain_level_id ||
              claim.approval_chain?.levels?.[0]?.id
          )
        : Number(pendingLevel?.id);

    if (!chainLevelId) {
      enqueueSnackbar('Pending approval level not found', { variant: 'error' });
      return;
    }

    addApproval({
      claim_id: claim.id,
      chain_level_id: chainLevelId,
      status,
      remarks,
      approval_date: approvalDate || undefined,
    } as any);
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
      <DialogTitle>Claim Approval</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {!pendingLevel && (
            <Alert severity='info'>
              This claim isn't open for a new Approve/Hold/Reject decision right now - the only
              action available is sending it back to the requester for correction.
            </Alert>
          )}
          <DateTimePicker
            label='Approval Date & Time'
            value={approvalDate ? dayjs(approvalDate) : null}
            onChange={(val) => setApprovalDate(val?.toISOString() || '')}
            slotProps={{
              textField: { size: 'small', fullWidth: true },
            }}
          />
          <TextField
            label='Remarks'
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
          Cancel
        </Button>
        <LoadingButton
          loading={isSubmitting}
          variant='contained'
          color='info'
          size='small'
          onClick={() => handleDecision('returned')}
        >
          Return
        </LoadingButton>
        <LoadingButton
          loading={isSubmitting}
          variant='contained'
          color='warning'
          size='small'
          disabled={!pendingLevel}
          onClick={() => handleDecision('on hold')}
        >
          Hold
        </LoadingButton>
        <LoadingButton
          loading={isSubmitting}
          variant='contained'
          color='success'
          size='small'
          disabled={!pendingLevel}
          onClick={() => handleDecision('approved')}
        >
          Approve
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default ProjectClaimApprovalDialog;
