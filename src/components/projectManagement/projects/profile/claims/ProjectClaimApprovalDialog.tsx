'use client';

import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
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
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { getLatestCurrentApproval } from '@/components/projectManagement/approvals/currentApprovalCycle';
import projectsServices from '@/components/projectManagement/projects/project-services';
import { ProjectClaim, ProjectClaimApproval } from './ProjectClaimType';

export type ProjectClaimApprovalDecision = 'approved' | 'rejected' | 'on hold' | 'returned';

const DEFAULT_APPROVAL_DATE = () => new Date().toISOString();

interface ProjectClaimApprovalDialogProps {
  open: boolean;
  belowLargeScreen: boolean;
  claim: ProjectClaim;
  // When given, the dialog edits that existing decision (the signed-in user's own latest one)
  // instead of recording a new one.
  approval?: ProjectClaimApproval;
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

  // Only the current review cycle counts - a return that's been superseded by a resubmit means
  // the chain starts again from its first level.
  const latestApproval = getLatestCurrentApproval(claim.approvals);
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
  approval,
  onClose,
}: ProjectClaimApprovalDialogProps) => {
  const dictionary = useDictionary();
  const [remarks, setRemarks] = useState('');
  const [remarksError, setRemarksError] = useState('');
  const [approvalDate, setApprovalDate] = useState(DEFAULT_APPROVAL_DATE());

  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { hasOrganizationRole } = useJumboAuth();
  const pendingLevel = getNextPendingProjectClaimApprovalLevel(claim);
  // Approve / Hold are a signature at the pending level, so only someone holding that level's role
  // may record them (the backend refuses anyone else). Anyone who can open this dialog can still
  // Return - that's open to any approver.
  // Editing one of your own decisions acts at the level that decision was made at, not the pending
  // one - so that's whose role matters then.
  const decisionLevel = approval
    ? claim.approval_chain?.levels?.find(
        (level) => Number(level.id) === Number(approval.approval_chain_level_id)
      )
    : pendingLevel;
  const pendingRoleName = decisionLevel?.role?.name || '';
  const canDecide = !!decisionLevel && (!pendingRoleName || hasOrganizationRole(pendingRoleName));
  const latestApproval = getLatestCurrentApproval(claim.approvals);

  useEffect(() => {
    if (!open) return;

    setRemarks(approval?.remarks || '');
    setApprovalDate(DEFAULT_APPROVAL_DATE());
    setRemarksError('');
  }, [open]);

  const { mutate: addApproval, isPending: isSubmitting } = useMutation({
    mutationFn: (payload: any) =>
      approval
        ? projectsServices.updateProjectPaymentClaimApproval(approval.id, payload)
        : projectsServices.addProjectPaymentClaimApproval(payload),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({
        queryKey: ['claimDetails', claim.id],
      });
      queryClient.invalidateQueries({
        queryKey: ['claim-details', claim.id],
      });
      queryClient.invalidateQueries({ queryKey: ['projectProjectClaims'] });
      enqueueSnackbar(data?.message || dictionary.projectManagement.claims.approval.recorded, { variant: 'success' });
      onClose();
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || dictionary.projectManagement.claims.common.somethingWentWrong,
        { variant: 'error' }
      );
    },
  });

  const handleDecision = (status: ProjectClaimApprovalDecision) => {
    if (status !== 'returned' && !canDecide) return;
    // A return isn't a change to a decision - it's the requester's to act on.
    if (approval && status === 'returned') return;

    if (status !== 'approved' && !remarks.trim()) {
      setRemarksError(dictionary.projectManagement.claims.approval.remarksRequired);
      return;
    }

    setRemarksError('');

    if (approval) {
      if (status !== 'approved' && !remarks.trim()) {
        setRemarksError(dictionary.projectManagement.claims.approval.remarksRequired);
        return;
      }

      addApproval({
        status,
        remarks: remarks.trim() || undefined,
        approval_date: approvalDate || undefined,
      } as any);
      return;
    }

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
      enqueueSnackbar(dictionary.projectManagement.claims.approval.levelNotFound, { variant: 'error' });
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
      <DialogTitle>{approval ? dictionary.projectManagement.claims.approval.changeMyDecision : dictionary.projectManagement.claims.approval.claimApproval}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {!!decisionLevel && !canDecide && (
            <Alert severity='warning'>
              {dictionary.projectManagement.claims.approval.onlyRoleCanApprove.replace('{role}', pendingRoleName)}
            </Alert>
          )}
          {!approval && !pendingLevel && (
            <Alert severity='info'>
              {dictionary.projectManagement.claims.approval.notOpen}
            </Alert>
          )}
          <DateTimePicker
            label={dictionary.projectManagement.claims.approval.dateTime}
            value={approvalDate ? dayjs(approvalDate) : null}
            onChange={(val) => setApprovalDate(val?.toISOString() || '')}
            slotProps={{
              textField: { size: 'small', fullWidth: true },
            }}
          />
          <TextField
            label={dictionary.projectManagement.claims.approval.remarks}
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
          {dictionary.projectManagement.claims.common.cancel}
        </Button>
        {!approval && (
          <LoadingButton
            loading={isSubmitting}
            variant='contained'
            color='info'
            size='small'
            onClick={() => handleDecision('returned')}
          >
            {dictionary.projectManagement.claims.approval.return}
          </LoadingButton>
        )}
        {canDecide && (
          <LoadingButton
            loading={isSubmitting}
            variant='contained'
            color='warning'
            size='small'
            onClick={() => handleDecision('on hold')}
          >
            {dictionary.projectManagement.claims.approval.hold}
          </LoadingButton>
        )}
        {canDecide && (
          <LoadingButton
            loading={isSubmitting}
            variant='contained'
            color='success'
            size='small'
            onClick={() => handleDecision('approved')}
          >
            {dictionary.projectManagement.claims.approval.approve}
          </LoadingButton>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ProjectClaimApprovalDialog;
