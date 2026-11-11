'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { MODULES } from '@/utilities/constants/modules';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import fuelStationServices from '@/components/fuelStation/fuelStationServices';
import { JumboDdMenu } from '@jumbo/components';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { MenuItemProps } from '@jumbo/types';
import {
  BlockOutlined,
  CheckCircleOutline,
  DeleteOutline,
  MoreHorizOutlined,
  RemoveCircleOutline,
  RestoreOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import customerInvoiceServices from '../invoices/customerInvoice-services';
import CustomerInvoiceDetailsDialog from './CustomerInvoiceDetailsDialog';
import FuelVoucherInvoiceDetailsDialog from './FuelVoucherInvoiceDetailsDialog';
import { CustomerInvoice } from './CustomerInvoiceType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

// Cancelling reverses the invoice's revenue and VAT with offsetting entries dated on the
// cancellation date; the invoice itself stays on record.
const CancelInvoiceDialog = ({
  invoice,
  setOpenCancelDialog,
}: {
  invoice: CustomerInvoice;
  setOpenCancelDialog: (open: boolean) => void;
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { checkOrganizationPermission, authOrganization } = useJumboAuth();
  const [reason, setReason] = useState('');
  const [cancellationDate, setCancellationDate] = useState<Dayjs>(dayjs());

  const canBackdate = checkOrganizationPermission(PERMISSIONS.ACCOUNTS_TRANSACTIONS_BACKDATE);
  const canPostdate = checkOrganizationPermission(PERMISSIONS.ACCOUNTS_TRANSACTIONS_POSTDATE);

  const cancelInvoice = useMutation({
    mutationFn: (vars: { reason: string; cancellation_date: string }) =>
      customerInvoiceServices.cancel(invoice.id, vars),
    onSuccess: (data: any) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['customer-invoices'] });
      setOpenCancelDialog(false);
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to cancel the invoice', {
        variant: 'error',
      });
    },
  });

  return (
    <>
      <DialogTitle>Cancel {invoice.invoiceNo}</DialogTitle>
      <DialogContent>
        <Grid container columnSpacing={1} rowSpacing={2} sx={{ mt: 0.5 }}>
          <Grid size={12}>
            <Alert severity='info'>
              {invoice.source?.type === 'ProjectPaymentClaim'
                ? `This reverses the invoice's revenue, adjustments and VAT on the date below, so the customer no longer owes it. The invoice stays on record. ${invoice.source.no ?? 'The claim'} is freed to be corrected and invoiced again, which raises a new invoice with a new number.`
                : `This reverses the invoice's revenue and VAT on the date below, so the customer no longer owes it. The invoice stays on record, and the delivered stock and its cost are not changed. Its sale or delivery notes cannot be invoiced again.`}
            </Alert>
          </Grid>
          <Grid size={12}>
            <TextField
              label='Reason for cancellation'
              fullWidth
              multiline
              minRows={2}
              size='small'
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </Grid>
          <Grid size={12}>
            <DateTimePicker
              label='Cancellation Date'
              value={cancellationDate}
              minDate={
                canBackdate
                  ? dayjs(authOrganization?.organization?.recording_start_date)
                  : dayjs().startOf('day')
              }
              maxDate={canPostdate ? dayjs().add(10, 'year').endOf('year') : dayjs().endOf('day')}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
              onChange={(newValue) => newValue && setCancellationDate(newValue)}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button size='small' onClick={() => setOpenCancelDialog(false)}>
          Close
        </Button>
        <LoadingButton
          size='small'
          variant='contained'
          color='error'
          loading={cancelInvoice.isPending}
          disabled={!reason.trim()}
          onClick={() =>
            cancelInvoice.mutate({
              reason,
              cancellation_date: cancellationDate.toISOString(),
            })
          }
        >
          Cancel Invoice
        </LoadingButton>
      </DialogActions>
    </>
  );
};

const CustomerInvoiceItemAction = ({ invoice }: { invoice: CustomerInvoice }) => {
  const dictionary = useDictionary();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { checkOrganizationPermission, organizationHasSubscribed } = useJumboAuth();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);

  const onSettled = () => queryClient.invalidateQueries({ queryKey: ['customer-invoices'] });

  // Fuel Voucher invoices share this list but have their own endpoints
  const isFuelVoucherInvoice = invoice.kind === 'fuel_voucher_invoice';

  const markPaidMutation = useMutation({
    mutationFn: isFuelVoucherInvoice ? customerInvoiceServices.markFuelVoucherInvoicePaid : customerInvoiceServices.markPaid,
    onSuccess: (data: any) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      onSettled();
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to mark the invoice as paid', { variant: 'error' });
    },
  });

  const unmarkPaidMutation = useMutation({
    mutationFn: isFuelVoucherInvoice ? customerInvoiceServices.unmarkFuelVoucherInvoicePaid : customerInvoiceServices.unmarkPaid,
    onSuccess: (data: any) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      onSettled();
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to unmark the invoice', { variant: 'error' });
    },
  });

  const reverseCancellationMutation = useMutation({
    mutationFn: customerInvoiceServices.reverseCancellation,
    onSuccess: (data: any) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      onSettled();
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to reverse the cancellation', {
        variant: 'error',
      });
    },
  });

  const deleteFuelInvoiceMutation = useMutation({
    mutationFn: fuelStationServices.deleteFuelVoucherInvoice,
    onSuccess: () => {
      enqueueSnackbar('Fuel Voucher invoice deleted', { variant: 'success' });
      onSettled();
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to delete the invoice', { variant: 'error' });
    },
  });

  const canEdit = checkOrganizationPermission(PERMISSIONS.ACCOUNTS_TRANSACTIONS_CREATE);
  const canCancel = checkOrganizationPermission(PERMISSIONS.ACCOUNTS_TRANSACTIONS_CANCEL);
  const isCancelled = !!invoice.cancelled_at;
  // Fuel Voucher invoices are raised and removed with the same access as the fuel reports,
  // but once a receipt is linked to one it is part of the payment record and stays
  const canDeleteFuelInvoice =
    isFuelVoucherInvoice &&
    !invoice.has_receipts &&
    organizationHasSubscribed(MODULES.FUEL_STATION) &&
    checkOrganizationPermission([PERMISSIONS.STORES_REPORTS, PERMISSIONS.FUEL_STATIONS_REPORTS]);

  const menuItems: MenuItemProps[] = [
    { icon: <VisibilityOutlined />, title: 'View', action: 'view' },
    canEdit &&
      !isCancelled &&
      !invoice.manually_paid_at && {
        icon: <CheckCircleOutline />,
        title: 'Mark as Paid',
        action: 'markPaid',
      },
    canEdit &&
      !isCancelled &&
      !!invoice.manually_paid_at && {
        icon: <RemoveCircleOutline />,
        title: 'Unmark as Paid',
        action: 'unmarkPaid',
      },
    // Fuel Voucher invoices have no cancel - they are deleted and their vouchers re-invoiced
    canCancel &&
      !isFuelVoucherInvoice &&
      !isCancelled &&
      invoice.cancellable !== false && {
        icon: <BlockOutlined />,
        title: 'Cancel',
        action: 'cancel',
      },
    canCancel &&
      !isFuelVoucherInvoice &&
      isCancelled && {
        icon: <RestoreOutlined />,
        title: 'Reverse Cancellation',
        action: 'reverse-cancellation',
      },
    canDeleteFuelInvoice && {
      icon: <DeleteOutline />,
      title: 'Delete',
      action: 'delete',
    },
  ].filter(Boolean) as MenuItemProps[];

  const handleItemAction = (menuItem: MenuItemProps) => {
    switch (menuItem.action) {
      case 'view':
        setOpenDetailsDialog(true);
        break;
      case 'markPaid':
        markPaidMutation.mutate(invoice.id);
        break;
      case 'unmarkPaid':
        unmarkPaidMutation.mutate(invoice.id);
        break;
      case 'cancel':
        setOpenCancelDialog(true);
        break;
      case 'reverse-cancellation':
        reverseCancellationMutation.mutate(invoice.id);
        break;
      case 'delete':
        if (
          window.confirm(
            `Delete ${invoice.invoiceNo}? Its fuel vouchers will become available for invoicing again.`
          )
        ) {
          deleteFuelInvoiceMutation.mutate(invoice.id);
        }
        break;
    }
  };

  return (
    <>
      <Dialog
        open={openDetailsDialog}
        onClose={() => setOpenDetailsDialog(false)}
        fullScreen={belowLargeScreen}
        fullWidth
        maxWidth='md'
        scroll='paper'
      >
        {openDetailsDialog && !isFuelVoucherInvoice && (
          <CustomerInvoiceDetailsDialog id={invoice.id} setOpenDialog={setOpenDetailsDialog} />
        )}
        {openDetailsDialog && isFuelVoucherInvoice && (
          <FuelVoucherInvoiceDetailsDialog id={invoice.id} setOpenDialog={setOpenDetailsDialog} />
        )}
      </Dialog>

      <Dialog
        open={openCancelDialog}
        onClose={() => setOpenCancelDialog(false)}
        fullScreen={belowLargeScreen}
        fullWidth
        maxWidth='sm'
      >
        {openCancelDialog && (
          <CancelInvoiceDialog invoice={invoice} setOpenCancelDialog={setOpenCancelDialog} />
        )}
      </Dialog>

      <JumboDdMenu
        icon={
          <Tooltip title={dictionary.tooltips.actions}>
            <MoreHorizOutlined />
          </Tooltip>
        }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />
    </>
  );
};

export default CustomerInvoiceItemAction;
