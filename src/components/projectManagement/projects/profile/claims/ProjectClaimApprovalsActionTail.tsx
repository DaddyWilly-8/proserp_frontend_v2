'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { FactCheckOutlined, KeyboardReturnOutlined } from '@mui/icons-material';
import { IconButton, Tooltip, useMediaQuery } from '@mui/material';
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
  const { hasOrganizationRole, checkOrganizationPermission } = useJumboAuth();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const pendingLevel = getNextPendingProjectClaimApprovalLevel(claim);
  const pendingRoleName = pendingLevel?.role?.name || '';
  const normalizedStatus = (claim.status || '').toLowerCase();

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
  // mistake is a new decision on top (this), never a rewrite of one already recorded. Open to any
  // approver (not level-restricted, unlike canApprove above) since anyone reviewing may spot a
  // problem regardless of whose turn it technically is - matches the reasoning on
  // ProjectPaymentClaimApprovalController::store(). Available right up until an invoice exists;
  // once invoiced, use an adjustment instead (see the matching backend guard).
  const canReturn =
    !!claim.approval_chain &&
    ['in_review', 'approved'].includes(normalizedStatus) &&
    !claim.customer_invoice &&
    canApproveClaims;

  return (
    <>
      <ProjectClaimApprovalDialog
        open={openDialog}
        belowLargeScreen={belowLargeScreen}
        claim={claim}
        onClose={() => setOpenDialog(false)}
      />

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
    </>
  );
};

export default ProjectClaimApprovalsActionTail;
