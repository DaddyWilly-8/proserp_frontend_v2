'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { FactCheckOutlined, KeyboardReturnOutlined } from '@mui/icons-material';
import { IconButton, Tooltip, useMediaQuery } from '@mui/material';
import { useState } from 'react';
import CertificateApprovalDialog, {
  getNextPendingCertificateApprovalLevel,
} from './CertificateApprovalDialog';
import { Certificate } from './CertificateType';

interface CertificateApprovalsActionTailProps {
  certificate: Certificate;
}

const CertificateApprovalsActionTail = ({
  certificate,
}: CertificateApprovalsActionTailProps) => {
  const [openDialog, setOpenDialog] = useState(false);
  const { hasOrganizationRole, checkOrganizationPermission } = useJumboAuth();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const pendingLevel = getNextPendingCertificateApprovalLevel(certificate);
  const pendingRoleName = pendingLevel?.role?.name || '';
  const normalizedStatus = (certificate.status || '').toLowerCase();

  const canApproveCertificates = checkOrganizationPermission(
    PERMISSIONS.PROJECT_SUBCONTRACT_CERTIFICATES_APPROVE
  );

  // Record a new Approve/Hold/Reject decision at the next pending level - once the latest
  // decision is 'on hold' or 'returned' (no well-defined next level), this is unavailable; Return
  // below is the only way forward from either of those.
  const canApprove =
    !!certificate.approval_chain &&
    !!pendingLevel &&
    (!pendingRoleName || hasOrganizationRole(pendingRoleName)) &&
    normalizedStatus === 'in_review' &&
    canApproveCertificates;

  // Send it back to the requester for correction - an approval is a signature, so fixing a
  // mistake is a new decision on top (this), never a rewrite of one already recorded. Open to any
  // approver (not level-restricted, unlike canApprove above) since anyone reviewing may spot a
  // problem regardless of whose turn it technically is - matches the reasoning on
  // ProjectSubcontractCertificateApprovalController::store(). Available right up until a bill
  // exists; once invoiced, use an adjustment instead (see the matching backend guard).
  const canReturn =
    !!certificate.approval_chain &&
    ['in_review', 'approved'].includes(normalizedStatus) &&
    !certificate.supplier_invoice &&
    canApproveCertificates;

  return (
    <>
      <CertificateApprovalDialog
        open={openDialog}
        belowLargeScreen={belowLargeScreen}
        certificate={certificate}
        onClose={() => setOpenDialog(false)}
      />

      {canApprove && (
        <Tooltip title='Approve Certificate'>
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

export default CertificateApprovalsActionTail;
