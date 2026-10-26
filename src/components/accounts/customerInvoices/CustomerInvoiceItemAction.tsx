'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { MODULES } from '@/utilities/constants/modules';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import fuelStationServices from '@/components/fuelStation/fuelStationServices';
import { JumboDdMenu } from '@jumbo/components';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { MenuItemProps } from '@jumbo/types';
import {
  CheckCircleOutline,
  DeleteOutline,
  MoreHorizOutlined,
  RemoveCircleOutline,
  VisibilityOutlined,
} from '@mui/icons-material';
import { Dialog, Tooltip, useMediaQuery } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import customerInvoiceServices from '../invoices/customerInvoice-services';
import CustomerInvoiceDetailsDialog from './CustomerInvoiceDetailsDialog';
import FuelVoucherInvoiceDetailsDialog from './FuelVoucherInvoiceDetailsDialog';
import { CustomerInvoice } from './CustomerInvoiceType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const CustomerInvoiceItemAction = ({ invoice }: { invoice: CustomerInvoice }) => {
  const dictionary = useDictionary();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { checkOrganizationPermission, organizationHasSubscribed } = useJumboAuth();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);

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
      !invoice.manually_paid_at && {
        icon: <CheckCircleOutline />,
        title: 'Mark as Paid',
        action: 'markPaid',
      },
    canEdit &&
      !!invoice.manually_paid_at && {
        icon: <RemoveCircleOutline />,
        title: 'Unmark as Paid',
        action: 'unmarkPaid',
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
