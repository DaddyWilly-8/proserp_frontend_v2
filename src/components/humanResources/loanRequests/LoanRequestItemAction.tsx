'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { MODULES } from '@/utilities/constants/modules';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import {
  CancelOutlined,
  CheckCircleOutlined,
  DeleteForeverOutlined,
  EditOutlined,
  HighlightOffOutlined,
  PaidOutlined,
  ReceiptLongOutlined,
  ReplayOutlined,
  RequestQuoteOutlined,
  UndoOutlined,
} from '@mui/icons-material';
import { faMoneyBill1 } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Dialog, IconButton, Tooltip, useMediaQuery } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import LoanDirectDecisionForm, {
  LoanDirectDecisionMode,
} from './LoanDirectDecisionForm';
import LoanDisburseForm from './LoanDisburseForm';
import LoanMarkDisbursedForm from './LoanMarkDisbursedForm';
import LoanReceiptForm from './LoanReceiptForm';
import LoanRepaymentInitiateForm from './LoanRepaymentInitiateForm';
import LoanRequestsForm from './LoanRequestsForm';
import { LoanRequestType } from './LoanRequestType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const LoanRequestItemAction = ({
  loanRequest,
}: {
  loanRequest: LoanRequestType;
}) => {
  const dictionary = useDictionary();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const { organizationHasSubscribed, checkOrganizationPermission, authUser } =
    useJumboAuth();
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const hasLoanEditPermission = checkOrganizationPermission(
    PERMISSIONS.LOANS_EDIT
  );

  const hasLoanDeletePermission = checkOrganizationPermission(
    PERMISSIONS.LOANS_DELETE
  );

  const hasLoanCreatePermission = checkOrganizationPermission(
    PERMISSIONS.LOANS_CREATE
  );

  const [decisionMode, setDecisionMode] =
    useState<LoanDirectDecisionMode | null>(null);
  const [openDisburseDialog, setOpenDisburseDialog] = useState(false);
  const [openMarkDisbursedDialog, setOpenMarkDisbursedDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openRepaymentInitiateDialog, setOpenRepaymentInitiateDialog] = useState(false);
  const [openReceiptDialog, setOpenReceiptDialog] = useState(false);

  const isDirectFlow = !loanRequest.approval_chain_id;
  const canDirectDecide =
    isDirectFlow && loanRequest.status === 'in_review' && hasLoanEditPermission;

  // Mirrors the backend's update() guard — only the creator, and only before
  // anyone has acted on it (chain decisions/a recovery deduction may already
  // depend on the original numbers once it moves past in_review).
  const canEdit =
    loanRequest.status === 'in_review' &&
    loanRequest.created_by === Number(authUser?.user?.id) &&
    hasLoanCreatePermission;

  const canCancel =
    ['in_review', 'approved'].includes(loanRequest.status) &&
    !loanRequest.disbursed_at &&
    hasLoanEditPermission;

  // Mirrors the backend's destroy() guard — an in-review or approved request
  // (which includes disbursed ones, still 'approved') must be cancelled first.
  const canDelete =
    !['in_review', 'approved'].includes(loanRequest.status) &&
    hasLoanDeletePermission;

  const isApprovedNotDisbursed =
    loanRequest.status === 'approved' && !loanRequest.disbursed_at;

  const orgHasAccountsAndFinance = organizationHasSubscribed(
    MODULES.ACCOUNTS_AND_FINANCE
  );

  const canDisburseWithLedger =
    isApprovedNotDisbursed &&
    orgHasAccountsAndFinance &&
    checkOrganizationPermission(PERMISSIONS.ACCOUNTS_TRANSACTIONS_CREATE) &&
    checkOrganizationPermission(PERMISSIONS.APPROVED_LOANS_DISBURSE);

  const canMarkDisbursed = isApprovedNotDisbursed && !orgHasAccountsAndFinance;

  // HR initiates a repayment for any loan Accounts actually disbursed (a
  // real receivable ledger balance exists to repay against) with something
  // left to repay. Not an approval request — just a fact-of-record; Accounts
  // turns it into a real posting separately (see below).
  const canInitiateRepayment =
    loanRequest.status === 'approved' &&
    !!loanRequest.payment_id &&
    (loanRequest.outstanding_balance ?? 0) > 0 &&
    hasLoanEditPermission;

  const initiatedRepaymentsCount =
    loanRequest.initiated_repayments_count ??
    (loanRequest.repayments || []).filter((r) => r.status === 'initiated').length;

  const canReceiptRepayment =
    initiatedRepaymentsCount > 0 &&
    orgHasAccountsAndFinance &&
    checkOrganizationPermission(PERMISSIONS.ACCOUNTS_TRANSACTIONS_CREATE) &&
    checkOrganizationPermission(PERMISSIONS.APPROVED_LOANS_RECEIPT);

  // Puts the request back to in_review for a corrected re-decision. Only the
  // person who approved it may reverse it (backend-enforced too). Blocked once
  // disbursed (reverse that first) — the backend also blocks it once payroll
  // has recovered against it, which isn't knowable client-side, so that case
  // surfaces as a 422 toast rather than the button just hiding.
  const canReverseApproval =
    loanRequest.status === 'approved' &&
    !loanRequest.disbursed_at &&
    hasLoanEditPermission &&
    Number(authUser?.user?.id) === loanRequest.reviewed_by;

  // Same idea as canReverseApproval, for the other terminal outcome — only
  // whoever rejected it can undo a mis-click or a wrong final decision.
  const canReverseRejection =
    loanRequest.status === 'rejected' &&
    hasLoanEditPermission &&
    Number(authUser?.user?.id) === loanRequest.reviewed_by;

  // Same idea again, for a cancellation — only whoever clicked Cancel can
  // undo it.
  const canReverseCancellation =
    loanRequest.status === 'cancelled' &&
    hasLoanEditPermission &&
    Number(authUser?.user?.id) === loanRequest.cancelled_by;

  // A real Payment behind the disbursement needs the same finance-side
  // permission disburse() itself requires; the HR-only mark-disbursed path
  // only needs the general loan-edit ability.
  const canReverseDisbursement =
    loanRequest.status === 'approved' &&
    !!loanRequest.disbursed_at &&
    hasLoanEditPermission &&
    (!loanRequest.payment_id ||
      checkOrganizationPermission(PERMISSIONS.ACCOUNTS_TRANSACTIONS_DELETE));

  const { mutate: cancelLoanRequest, isPending: isCancelling } = useMutation({
    mutationFn: humanResourcesServices.cancelLoanRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['showLoanRequest', loanRequest.id],
      });
      queryClient.invalidateQueries({ queryKey: ['loanRequests'] });
      enqueueSnackbar(dictionary.humanResources.loanRequests.itemAction.messages.cancelled, { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || dictionary.humanResources.loanRequests.common.somethingWentWrong,
        { variant: 'error' }
      );
    },
  });

  const { mutate: reverseApproval, isPending: isReversingApproval } =
    useMutation({
      mutationFn: humanResourcesServices.reverseLoanApproval,
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['showLoanRequest', loanRequest.id],
        });
        queryClient.invalidateQueries({ queryKey: ['loanRequests'] });
        enqueueSnackbar(dictionary.humanResources.loanRequests.itemAction.messages.approvalReversed, { variant: 'success' });
      },
      onError: (error: any) => {
        enqueueSnackbar(
          error?.response?.data?.message || dictionary.humanResources.loanRequests.common.somethingWentWrong,
          { variant: 'error' }
        );
      },
    });

  const { mutate: reverseRejection, isPending: isReversingRejection } =
    useMutation({
      mutationFn: humanResourcesServices.reverseLoanRejection,
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['showLoanRequest', loanRequest.id],
        });
        queryClient.invalidateQueries({ queryKey: ['loanRequests'] });
        enqueueSnackbar(dictionary.humanResources.loanRequests.itemAction.messages.rejectionReversed, { variant: 'success' });
      },
      onError: (error: any) => {
        enqueueSnackbar(
          error?.response?.data?.message || dictionary.humanResources.loanRequests.common.somethingWentWrong,
          { variant: 'error' }
        );
      },
    });

  const { mutate: reverseCancellation, isPending: isReversingCancellation } =
    useMutation({
      mutationFn: humanResourcesServices.reverseLoanCancellation,
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['showLoanRequest', loanRequest.id],
        });
        queryClient.invalidateQueries({ queryKey: ['loanRequests'] });
        enqueueSnackbar(dictionary.humanResources.loanRequests.itemAction.messages.cancellationReversed, { variant: 'success' });
      },
      onError: (error: any) => {
        enqueueSnackbar(
          error?.response?.data?.message || dictionary.humanResources.loanRequests.common.somethingWentWrong,
          { variant: 'error' }
        );
      },
    });

  const { mutate: reverseDisbursement, isPending: isReversingDisbursement } =
    useMutation({
      mutationFn: humanResourcesServices.reverseLoanDisbursement,
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['showLoanRequest', loanRequest.id],
        });
        queryClient.invalidateQueries({ queryKey: ['loanRequests'] });
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        enqueueSnackbar(dictionary.humanResources.loanRequests.itemAction.messages.disbursementReversed, { variant: 'success' });
      },
      onError: (error: any) => {
        enqueueSnackbar(
          error?.response?.data?.message || dictionary.humanResources.loanRequests.common.somethingWentWrong,
          { variant: 'error' }
        );
      },
    });

  const { mutate: deleteLoanRequest, isPending: isDeleting } = useMutation({
    mutationFn: humanResourcesServices.deleteLoanRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['showLoanRequest', loanRequest.id],
      });
      queryClient.invalidateQueries({ queryKey: ['loanRequests'] });
      enqueueSnackbar(dictionary.humanResources.loanRequests.itemAction.messages.deleted, { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || dictionary.humanResources.loanRequests.common.somethingWentWrong,
        { variant: 'error' }
      );
    },
  });

  const handleCancel = () => {
    showDialog({
      title: dictionary.humanResources.loanRequests.itemAction.dialog.cancelTitle,
      content:
        loanRequest.status === 'approved'
          ? dictionary.humanResources.loanRequests.itemAction.dialog.cancelContentApproved
          : dictionary.humanResources.loanRequests.itemAction.dialog.cancelContent,
      onYes: () => {
        hideDialog();
        cancelLoanRequest({ id: loanRequest.id });
      },
      onNo: () => hideDialog(),
      variant: 'confirm',
    });
  };

  const handleReverseApproval = () => {
    showDialog({
      title: dictionary.humanResources.loanRequests.itemAction.dialog.reverseApprovalTitle,
      content: dictionary.humanResources.loanRequests.itemAction.dialog.reverseApprovalContent,
      onYes: () => {
        hideDialog();
        reverseApproval(loanRequest.id);
      },
      onNo: () => hideDialog(),
      variant: 'confirm',
    });
  };

  const handleReverseRejection = () => {
    showDialog({
      title: dictionary.humanResources.loanRequests.itemAction.dialog.reverseRejectionTitle,
      content: dictionary.humanResources.loanRequests.itemAction.dialog.reverseRejectionContent,
      onYes: () => {
        hideDialog();
        reverseRejection(loanRequest.id);
      },
      onNo: () => hideDialog(),
      variant: 'confirm',
    });
  };

  const handleReverseCancellation = () => {
    showDialog({
      title: dictionary.humanResources.loanRequests.itemAction.dialog.reverseCancellationTitle,
      content: dictionary.humanResources.loanRequests.itemAction.dialog.reverseCancellationContent,
      onYes: () => {
        hideDialog();
        reverseCancellation(loanRequest.id);
      },
      onNo: () => hideDialog(),
      variant: 'confirm',
    });
  };

  const handleReverseDisbursement = () => {
    showDialog({
      title: dictionary.humanResources.loanRequests.itemAction.dialog.reverseDisbursementTitle,
      content: loanRequest.payment_id
        ? dictionary.humanResources.loanRequests.itemAction.dialog.reverseDisbursementContentPayment
        : dictionary.humanResources.loanRequests.itemAction.dialog.reverseDisbursementContent,
      onYes: () => {
        hideDialog();
        reverseDisbursement(loanRequest.id);
      },
      onNo: () => hideDialog(),
      variant: 'confirm',
    });
  };

  const handleDelete = () => {
    showDialog({
      title: dictionary.humanResources.loanRequests.itemAction.dialog.deleteTitle,
      content: dictionary.humanResources.loanRequests.itemAction.dialog.deleteContent,
      onYes: () => {
        hideDialog();
        deleteLoanRequest(loanRequest.id);
      },
      onNo: () => hideDialog(),
      variant: 'confirm',
    });
  };

  return (
    <>
      {decisionMode && (
        <LoanDirectDecisionForm
          open={!!decisionMode}
          mode={decisionMode}
          loanRequest={loanRequest}
          belowLargeScreen={belowLargeScreen}
          onClose={() => setDecisionMode(null)}
        />
      )}

      <LoanDisburseForm
        open={openDisburseDialog}
        loanRequest={loanRequest}
        belowLargeScreen={belowLargeScreen}
        onClose={() => setOpenDisburseDialog(false)}
      />

      <LoanMarkDisbursedForm
        open={openMarkDisbursedDialog}
        loanRequest={loanRequest}
        belowLargeScreen={belowLargeScreen}
        onClose={() => setOpenMarkDisbursedDialog(false)}
      />

      <LoanRepaymentInitiateForm
        open={openRepaymentInitiateDialog}
        loanRequest={loanRequest}
        belowLargeScreen={belowLargeScreen}
        onClose={() => setOpenRepaymentInitiateDialog(false)}
      />

      <LoanReceiptForm
        open={openReceiptDialog}
        loanRequest={loanRequest}
        belowLargeScreen={belowLargeScreen}
        onClose={() => setOpenReceiptDialog(false)}
      />

      <Dialog
        open={openEditDialog}
        fullWidth
        maxWidth='md'
        fullScreen={belowLargeScreen}
        onClose={() => setOpenEditDialog(false)}
      >
        <LoanRequestsForm
          setOpenDialog={setOpenEditDialog}
          loan={loanRequest}
        />
      </Dialog>

      {canEdit && (
        <Tooltip title={dictionary.tooltips.edit}>
          <IconButton size='small' onClick={() => setOpenEditDialog(true)}>
            <EditOutlined color='primary' />
          </IconButton>
        </Tooltip>
      )}

      {canDirectDecide && (
        <>
          <Tooltip title={dictionary.tooltips.approve}>
            <IconButton size='small' onClick={() => setDecisionMode('approve')}>
              <CheckCircleOutlined color='success' />
            </IconButton>
          </Tooltip>
          <Tooltip title={dictionary.tooltips.reject}>
            <IconButton size='small' onClick={() => setDecisionMode('reject')}>
              <HighlightOffOutlined color='error' />
            </IconButton>
          </Tooltip>
        </>
      )}

      {canDisburseWithLedger && (
        <Tooltip title={dictionary.tooltips.disburse}>
          <IconButton size='small' color='success' onClick={() => setOpenDisburseDialog(true)}>
            <FontAwesomeIcon icon={faMoneyBill1} size='lg' />
          </IconButton>
        </Tooltip>
      )}

      {canMarkDisbursed && (
        <Tooltip title={dictionary.tooltips.markAsDisbursed}>
          <IconButton
            size='small'
            onClick={() => setOpenMarkDisbursedDialog(true)}
          >
            <PaidOutlined color='success' />
          </IconButton>
        </Tooltip>
      )}

      {canInitiateRepayment && (
        <Tooltip title={dictionary.tooltips.initiateRepayment}>
          <IconButton
            size='small'
            onClick={() => setOpenRepaymentInitiateDialog(true)}
          >
            <RequestQuoteOutlined color='primary' />
          </IconButton>
        </Tooltip>
      )}

      {canReceiptRepayment && (
        <Tooltip title={dictionary.tooltips.receiptRepayment}>
          <IconButton size='small' onClick={() => setOpenReceiptDialog(true)}>
            <ReceiptLongOutlined color='success' />
          </IconButton>
        </Tooltip>
      )}

      {canReverseApproval && (
        <Tooltip title={dictionary.tooltips.reverseApproval}>
          <IconButton
            size='small'
            disabled={isReversingApproval}
            onClick={handleReverseApproval}
          >
            <UndoOutlined color='warning' />
          </IconButton>
        </Tooltip>
      )}

      {canReverseRejection && (
        <Tooltip title={dictionary.tooltips.reverseRejection}>
          <IconButton
            size='small'
            disabled={isReversingRejection}
            onClick={handleReverseRejection}
          >
            <UndoOutlined color='warning' />
          </IconButton>
        </Tooltip>
      )}

      {canReverseCancellation && (
        <Tooltip title={dictionary.tooltips.reverseCancellation}>
          <IconButton
            size='small'
            disabled={isReversingCancellation}
            onClick={handleReverseCancellation}
          >
            <UndoOutlined color='warning' />
          </IconButton>
        </Tooltip>
      )}

      {canReverseDisbursement && (
        <Tooltip title={dictionary.tooltips.reverseDisbursement}>
          <IconButton
            size='small'
            disabled={isReversingDisbursement}
            onClick={handleReverseDisbursement}
          >
            <ReplayOutlined color='warning' />
          </IconButton>
        </Tooltip>
      )}

      {canCancel && (
        <Tooltip title={dictionary.tooltips.cancel}>
          <IconButton
            size='small'
            disabled={isCancelling}
            onClick={handleCancel}
          >
            <CancelOutlined color='warning' />
          </IconButton>
        </Tooltip>
      )}

      {canDelete && (
        <Tooltip title={dictionary.tooltips.delete}>
          <IconButton size='small' disabled={isDeleting} onClick={handleDelete}>
            <DeleteForeverOutlined color='error' />
          </IconButton>
        </Tooltip>
      )}
    </>
  );
};

export default LoanRequestItemAction;
