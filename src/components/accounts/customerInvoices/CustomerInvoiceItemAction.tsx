'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { JumboDdMenu } from '@jumbo/components';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { MenuItemProps } from '@jumbo/types';
import {
  CheckCircleOutline,
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
import { CustomerInvoice } from './CustomerInvoiceType';

const CustomerInvoiceItemAction = ({ invoice }: { invoice: CustomerInvoice }) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { checkOrganizationPermission } = useJumboAuth();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);

  const onSettled = () => queryClient.invalidateQueries({ queryKey: ['customer-invoices'] });

  const markPaidMutation = useMutation({
    mutationFn: customerInvoiceServices.markPaid,
    onSuccess: (data: any) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      onSettled();
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to mark the invoice as paid', { variant: 'error' });
    },
  });

  const unmarkPaidMutation = useMutation({
    mutationFn: customerInvoiceServices.unmarkPaid,
    onSuccess: (data: any) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      onSettled();
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to unmark the invoice', { variant: 'error' });
    },
  });

  const canEdit = checkOrganizationPermission(PERMISSIONS.ACCOUNTS_TRANSACTIONS_CREATE);

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
        {openDetailsDialog && (
          <CustomerInvoiceDetailsDialog id={invoice.id} setOpenDialog={setOpenDetailsDialog} />
        )}
      </Dialog>

      <JumboDdMenu
        icon={
          <Tooltip title='Actions'>
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
