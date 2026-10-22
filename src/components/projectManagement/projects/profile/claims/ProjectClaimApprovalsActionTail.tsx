'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { getLatestCurrentApproval } from '@/components/projectManagement/approvals/currentApprovalCycle';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import projectsServices from '@/components/projectManagement/projects/project-services';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import {
  EditOutlined,
  FactCheckOutlined,
  KeyboardReturnOutlined,
  ReplayOutlined,
} from '@mui/icons-material';
import { IconButton, Tooltip, useMediaQuery } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import ProjectClaimApprovalDialog, {
  getNextPendingProjectClaimApprovalLevel,
} from './ProjectClaimApprovalDialog';
import { ProjectClaim } from './ProjectClaimType';

interface ProjectClaimApprovalsActionTailProps {
  claim: ProjectClaim;
}

const ProjectClaimApprovalsActionTail = ({
  claim,
}: ProjectClaimApprovalsActionTailProps) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const { authUser, hasOrganizationRole, checkOrganizationPermission } = useJumboAuth();
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const pendingLevel = getNextPendingProjectClaimApprovalLevel(claim);
  const pendingRoleName = pendingLevel?.role?.name || '';
  const normalizedStatus = (claim.status || '').toLowerCase();

  // Who the buttons are for. While a level is waiting that's the holder of its role; once there's
  // no waiting level (on hold, or fully approved and not yet invoiced) it's whoever holds the role
  // at the level that made the latest decision - otherwise nobody could ever Return it from there.
  const latestApproval = getLatestCurrentApproval(claim.approvals);
  const latestLevel = claim.approval_chain?.levels?.find(
    (level) => Number(level.id) === Number(latestApproval?.approval_chain_level_id)
  );
  const actingRoleName = (pendingLevel ?? latestLevel)?.role?.name || '';
  const holdsActingRole = !actingRoleName || hasOrganizationRole(actingRoleName);

  const canApproveClaims = checkOrganizationPermission(
    PERMISSIONS.PROJECT_PAYMENT_CLAIMS_APPROVE
  );

  // Record a new Approve/Hold/Reject decision at the next pending level - once the latest
  // decision is 'on hold' or 'returned' (no well-defined next level), this is unavailable; Return
  // below is the only way forward from either of those.
  const canApprove =
    !!claim.approval_chain &&
    !!pendingLevel &&
    (!pendingRoleName || hasOrganizationRole(pendingRoleName)) &&
    normalizedStatus === 'in_review' &&
    canApproveClaims;

  // Send it back to the requester for correction - an approval is a signature, so fixing a
  // mistake is a new decision on top (this), never a rewrite of one already recorded. Offered to the
  // same person the decision is currently with (see above), so the icon doesn't show for people it
  // isn't for. The backend still lets any approver return - see
  // ProjectPaymentClaimApprovalController::store(). Available right up until an invoice exists;
  // once invoiced, use an adjustment instead (see the matching backend guard).
  const canReturn =
    !!claim.approval_chain &&
    ['in_review', 'approved'].includes(normalizedStatus) &&
    !claim.customer_invoice &&
    canApproveClaims &&
    holdsActingRole;

  // Take back or change your own latest decision - e.g. release a hold you put on. Only while it's
  // still the latest one and nothing has been raised from the approval yet (the backend enforces
  // the same). It's the signer's own call, so it's offered to them alone, and only if they still
  // hold the level's role.
  const latestDecision = String(latestApproval?.status || '').toLowerCase();
  const holdsLatestLevelRole =
    !latestLevel?.role?.name || hasOrganizationRole(latestLevel.role.name);
  const canChangeOwnDecision =
    !!claim.approval_chain &&
    !!latestApproval &&
    ['approved', 'on hold'].includes(latestDecision) &&
    ['in_review', 'approved'].includes(normalizedStatus) &&
    !claim.customer_invoice &&
    !!authUser?.user?.id &&
    String(latestApproval.created_by) === String(authUser.user.id) &&
    holdsLatestLevelRole &&
    canApproveClaims;

  const { mutate: removeDecision } = useMutation({
    mutationFn: (id: number) => projectsServices.deleteProjectPaymentClaimApproval(id),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['claimDetails', claim.id] });
      queryClient.invalidateQueries({ queryKey: ['claim-details', claim.id] });
      queryClient.invalidateQueries({ queryKey: ['projectProjectClaims'] });
      enqueueSnackbar(data?.message || 'Your decision was removed', { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || 'Something went wrong', {
        variant: 'error',
      });
    },
  });

  const handleUndo = () => {
    showDialog({
      title: 'Undo My Decision',
      content:
        'This removes your latest decision so the claim goes back to where it stood before it. Continue?',
      variant: 'confirm',
      onYes: () => {
        hideDialog();
        if (latestApproval?.id) removeDecision(latestApproval.id);
      },
      onNo: hideDialog,
    });
  };

  return (
    <>
      <ProjectClaimApprovalDialog
        open={openDialog}
        belowLargeScreen={belowLargeScreen}
        claim={claim}
        onClose={() => setOpenDialog(false)}
      />

      {canChangeOwnDecision && (
        <ProjectClaimApprovalDialog
          open={openEditDialog}
          belowLargeScreen={belowLargeScreen}
          claim={claim}
          approval={latestApproval}
          onClose={() => setOpenEditDialog(false)}
        />
      )}

      {canApprove && (
        <Tooltip title='Approve Claim'>
          <IconButton onClick={() => setOpenDialog(true)}>
            <FactCheckOutlined />
          </IconButton>
        </Tooltip>
      )}
      {canReturn && !canApprove && (
        <Tooltip title='Return To Requester'>
          <IconButton onClick={() => setOpenDialog(true)}>
            <KeyboardReturnOutlined />
          </IconButton>
        </Tooltip>
      )}
      {canChangeOwnDecision && (
        <Tooltip title='Change My Decision'>
          <IconButton onClick={() => setOpenEditDialog(true)}>
            <EditOutlined />
          </IconButton>
        </Tooltip>
      )}
      {canChangeOwnDecision && (
        <Tooltip title='Undo My Decision'>
          <IconButton onClick={handleUndo}>
            <ReplayOutlined />
          </IconButton>
        </Tooltip>
      )}
    </>
  );
};

export default ProjectClaimApprovalsActionTail;
