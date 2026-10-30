'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { getLatestCurrentApproval } from '@/components/projectManagement/approvals/currentApprovalCycle';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import PDFContent from '@/components/pdf/PDFContent';
import projectsServices from '@/components/projectManagement/projects/project-services';
const FileExportGrid = dynamic(() => import('@/components/sharedComponents/FileExportGrid').then((mod) => mod.FileExportGrid), { ssr: false });
import PreviewTopBar from '@/components/sharedComponents/PreviewTopBar';
import { Organization } from '@/types/auth-types';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import {
  DeleteOutlined,
  EditOutlined,
  HighlightOff,
  ReceiptLongOutlined,
  UndoOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
const CertificateForm = dynamic(() => import('./form/CertificateForm'), { ssr: false });
const CertificateOnScreen = dynamic(() => import('./preview/CertificateOnScreen'), { ssr: false });
import CertificateInvoiceDialog from './CertificateInvoiceDialog';
import CertificatePDF from './preview/CertificatePDF';
import { Certificate } from './CertificateType';
import dynamic from 'next/dynamic';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const DocumentDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  certificateId: number | string;
  organization?: Organization;
}> = ({ open, onClose, certificateId, organization }) => {
  const dictionary = useDictionary();
  const { data: certificateDetails, isFetching } = useQuery({
    queryKey: ['CertificateDetails', { id: certificateId }],
    queryFn: () => projectsServices.getCertificateDetails(certificateId),
    enabled: open,
  });

  const [showOnScreen, setShowOnScreen] = useState(true);
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const [openDetails, setOpenDetails] = useState(false);

  const handleDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setOpenDetails(isChecked);
  };

  if (isFetching) {
    return (
      <Dialog open fullWidth fullScreen={belowLargeScreen} maxWidth='md'>
        <DialogContent>
          <div style={{ width: '100%', padding: '16px' }}>
            <Skeleton
              variant='text'
              width={180}
              height={32}
              style={{ borderRadius: 4, marginLeft: 'auto' }}
            />
            <Skeleton
              variant='rectangular'
              width='100%'
              height={48}
              style={{ borderRadius: 4 }}
            />
            <Skeleton
              variant='rectangular'
              width='100%'
              height={32}
              style={{ borderRadius: 4 }}
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={belowLargeScreen}
      maxWidth={showOnScreen ? 'lg' : 'md'}
      fullWidth
    >
      {!showOnScreen && (
        <DialogTitle>
          <Stack
            direction={'row'}
            justifyContent={'center'}
            alignItems={'center'}
          >
            <Typography>{dictionary.projectManagement.certificates.withCertifiedItems}</Typography>
            <Checkbox checked={openDetails} onChange={handleDetailsChange} />
          </Stack>
        </DialogTitle>
      )}
      <DialogContent>
        <PreviewTopBar
          fileExportGrid={
            <FileExportGrid
              exportPdf
              handlePdf={() => {
                setShowOnScreen((prev) => !prev);
              }}
            />
          }
          closeButton={
            <IconButton size='small' onClick={onClose}>
              <HighlightOff color='primary' />
            </IconButton>
          }
        />

        {showOnScreen ? (
          <CertificateOnScreen
            certificate={certificateDetails}
            organization={organization as Organization}
          />
        ) : (
          <PDFContent
            document={
              <CertificatePDF
                certificate={certificateDetails}
                organization={organization as Organization}
                openDetails={openDetails}
                dictionary={dictionary}
              />
            }
            fileName={certificateDetails?.certificateNo || dictionary.projectManagement.certificates.certificate}
          />
        )}

        {belowLargeScreen && (
          <Box textAlign='right' mt={5}>
            <Button
              variant='outlined'
              size='small'
              color='primary'
              onClick={onClose}
            >
              {dictionary.projectManagement.dashboard.close}
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

const EditCertificate: React.FC<{
  certificate: Certificate;
  setOpenDialog: (open: boolean) => void;
}> = ({ certificate, setOpenDialog }) => {
  const { data: certificateDetails, isFetching } = useQuery({
    queryKey: ['CertificateDetails', { id: certificate.id }],
    queryFn: () => projectsServices.getCertificateDetails(certificate.id),
  });

  if (isFetching)
    return (
      <div style={{ width: '100%', padding: '16px' }}>
        <Skeleton
          variant='text'
          width={180}
          height={32}
          style={{ borderRadius: 4, marginLeft: 'auto' }}
        />
        <Skeleton
          variant='rectangular'
          width='100%'
          height={48}
          style={{ borderRadius: 4 }}
        />
        <Skeleton
          variant='rectangular'
          width='100%'
          height={32}
          style={{ borderRadius: 4 }}
        />
      </div>
    );

  return (
    <CertificateForm
      setOpenDialog={setOpenDialog}
      certificate={certificateDetails}
    />
  );
};

const CertificateItemAction: React.FC<{ certificate: Certificate }> = ({
  certificate,
}) => {
  const dictionary = useDictionary();
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openPreviewDialog, setOpenPreviewDialog] = useState(false);
  const [openInvoiceDialog, setOpenInvoiceDialog] = useState(false);
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { authOrganization, authUser, checkOrganizationPermission } = useJumboAuth();
  const organization = authOrganization?.organization;

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: deleteCertificate } = useMutation({
    mutationFn: () => projectsServices.deleteCertificate(certificate.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['Certificates'] });
      enqueueSnackbar(dictionary.projectManagement.certificates.deleteSuccess, {
        variant: 'success',
      });
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || dictionary.projectManagement.certificates.deleteFailed,
        { variant: 'error' }
      );
    },
  });

  // Whether invoicing this certificate creates a real, documented Supplier Bill — if so, Create
  // Invoice collects its due date/reference instead of a plain yes/no confirm.
  const { mutate: withdrawCertificate } = useMutation({
    mutationFn: () => projectsServices.withdrawCertificate(certificate.id),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['Certificates'] });
      enqueueSnackbar(data.message, { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || dictionary.projectManagement.certificates.withdrawFailed, {
        variant: 'error',
      });
    },
  });

  const generatesBills = !!organization?.settings?.generate_invoices_for_project_certificates;

  const { mutate: invoiceCertificate } = useMutation({
    mutationFn: () => projectsServices.invoiceCertificate(certificate.id),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['Certificates'] });
      enqueueSnackbar(data.message, { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || dictionary.projectManagement.certificates.invoiceFailed,
        { variant: 'error' }
      );
    },
  });

  // Same rationale as ProjectClaimItemAction — the edit lock only applies
  // once invoiced AND the org actually defers invoicing; otherwise every
  // certificate is 'invoiced' immediately and has always stayed editable.
  const deferredInvoicing = !!organization?.settings?.defer_project_certificate_invoicing;
  const hasApprovalChain = !!certificate.approval_chain;
  const isDraft = certificate.status === 'draft';
  // 'in_review'/'approved' statuses are only ever set by the backend when an
  // approval chain is configured (see store()), so status alone is a
  // reliable signal here — this also holds on list items that omit the
  // `approval_chain` relation (e.g. the org-wide Approved Subcontract
  // Certificates list), where `hasApprovalChain` would otherwise read false.
  const isLocked =
    (deferredInvoicing && certificate.status === 'invoiced') ||
    ['in_review', 'approved'].includes(certificate.status || '') ||
    !!certificate.has_approved_payment_request;
  // Invoicing requires 'approved' status once a chain is configured; legacy
  // behavior (no chain) still only requires 'draft'. Checking status directly
  // for the 'approved' case (rather than gating on `hasApprovalChain`) keeps
  // this correct on list items that don't include the `approval_chain` relation.
  const canInvoice =
    certificate.status === 'approved' || (!hasApprovalChain && isDraft);

  const canEdit = !isLocked && checkOrganizationPermission(PERMISSIONS.PROJECT_SUBCONTRACTS_EDIT);
  const canCreateInvoice = canInvoice && checkOrganizationPermission(PERMISSIONS.PROJECT_SUBCONTRACTS_EDIT);
  // The submitter can pull their own certificate back until an approver has acted on it - the
  // backend enforces the same rules (ProjectSubcontractCertificateApprovalController::withdraw()).
  const canWithdraw =
    certificate.status === 'in_review' &&
    hasApprovalChain &&
    !!authUser?.user?.id &&
    String(certificate.created_by) === String(authUser.user.id) &&
    !getLatestCurrentApproval(certificate.approvals) &&
    checkOrganizationPermission(PERMISSIONS.PROJECT_SUBCONTRACTS_EDIT);
  // Same locks as editing (isLocked also covers an approved payment request) - the backend enforces
  // it too. Withdraw it or have it returned first.
  const canDelete = !isLocked && checkOrganizationPermission(PERMISSIONS.PROJECT_SUBCONTRACTS_DELETE);

  const handleInvoice = () => {
    if (generatesBills) {
      setOpenInvoiceDialog(true);
    } else {
      showDialog({
        title: dictionary.projectManagement.certificates.createInvoiceTitle,
        content: dictionary.projectManagement.certificates.createInvoiceConfirm,
        onYes: () => {
          invoiceCertificate();
          hideDialog();
        },
        onNo: hideDialog,
        variant: 'confirm',
      });
    }
  };

  const handleWithdraw = () => {
    showDialog({
      title: dictionary.projectManagement.certificates.withdrawTitle,
      content: dictionary.projectManagement.certificates.withdrawConfirm,
      variant: 'confirm',
      onYes: () => {
        hideDialog();
        withdrawCertificate();
      },
      onNo: hideDialog,
    });
  };

  const handleDelete = () => {
    showDialog({
      title: dictionary.projectManagement.common.confirmDelete,
      content: dictionary.projectManagement.certificates.confirmDeleteText,
      onYes: () => {
        deleteCertificate();
        hideDialog();
      },
      onNo: hideDialog,
      variant: 'confirm',
    });
  };

  return (
    <>
      <Dialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        fullWidth
        fullScreen={belowLargeScreen}
        maxWidth='lg'
        scroll={belowLargeScreen ? 'body' : 'paper'}
      >
        <EditCertificate
          certificate={certificate}
          setOpenDialog={setOpenEditDialog}
        />
      </Dialog>

      <DocumentDialog
        open={openPreviewDialog}
        onClose={() => setOpenPreviewDialog(false)}
        certificateId={certificate.id as number}
        organization={organization}
      />

      <CertificateInvoiceDialog
        open={openInvoiceDialog}
        belowLargeScreen={belowLargeScreen}
        certificate={certificate}
        onClose={() => setOpenInvoiceDialog(false)}
      />

      <Tooltip title={dictionary.tooltips.view}>
        <IconButton onClick={() => setOpenPreviewDialog(true)}>
          <VisibilityOutlined />
        </IconButton>
      </Tooltip>

      {canEdit && (
        <Tooltip title={dictionary.tooltips.edit}>
          <IconButton onClick={() => setOpenEditDialog(true)}>
            <EditOutlined />
          </IconButton>
        </Tooltip>
      )}

      {canWithdraw && (
        <Tooltip title={dictionary.tooltips.withdraw}>
          <IconButton onClick={handleWithdraw}>
            <UndoOutlined />
          </IconButton>
        </Tooltip>
      )}

      {canCreateInvoice && (
        <Tooltip title={dictionary.tooltips.createInvoice}>
          <IconButton onClick={handleInvoice}>
            <ReceiptLongOutlined />
          </IconButton>
        </Tooltip>
      )}

      {canDelete && (
        <Tooltip title={dictionary.tooltips.delete}>
          <IconButton onClick={handleDelete}>
            <DeleteOutlined color='error' />
          </IconButton>
        </Tooltip>
      )}
    </>
  );
};

export default CertificateItemAction;
