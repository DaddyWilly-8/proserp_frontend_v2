import React, { useState } from 'react';
import {
  Dialog,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import {
  DeleteOutlined,
  EditOutlined,
  MoreHorizOutlined,
} from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { JumboDdMenu } from '@jumbo/components';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import { MenuItemProps } from '@jumbo/types';
import { Transaction, TransactionTypes } from '@/components/accounts/transactions/TransactionTypes';
import SalesInvoiceAdjustment from './SalesInvoiceAdjustment';
import posServices from '@/components/pos/pos-services';

interface SaleInvoiceAdjustmentItemActionProps {
  transaction: Transaction;
  type: TransactionTypes
}

const SaleInvoiceAdjustmentItemAction: React.FC<SaleInvoiceAdjustmentItemActionProps> = ({ transaction, type }) => {
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();
    const { showDialog, hideDialog } = useJumboDialog();
    const authObject = useJumboAuth();
    const checkPermission = authObject.checkOrganizationPermission;
    const [openEditDialog, setOpenEditDialog] = useState(false);

    const { theme } = useJumboTheme();
    const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

    const deleteMutation = useMutation({
        mutationFn: posServices.deleteSaleInvoiceAdjustment,
        onSuccess: (data) => {
            enqueueSnackbar(data.message, { variant: 'success' });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        },
        onError: (error: any) => {
            enqueueSnackbar(error?.response?.data?.message, { variant: 'error' });
        },
    });

    const menuItems: MenuItemProps[] = [
        // checkPermission([PERMISSIONS.ACCOUNTS_TRANSACTIONS_EDIT]) && {
        //     icon: <EditOutlined />,
        //     title: 'Edit',
        //     action: 'edit',
        // },
        checkPermission([PERMISSIONS.ACCOUNTS_TRANSACTIONS_DELETE]) && {
            icon: <DeleteOutlined color="error" />,
            title: 'Delete',
            action: 'delete',
        },
    ].filter(Boolean) as MenuItemProps[];

    const handleItemAction = (menuItem: MenuItemProps) => {
        switch (menuItem.action) {
        case 'delete':
            showDialog({
            title: 'Confirm Delete?',
            content: 'If you say yes, this Adjustment will be deleted',
            onYes: () => {
                hideDialog();
                deleteMutation.mutate({
                    id: transaction.id,
                    type: type,
                });
            },
            onNo: () => hideDialog(),
            variant: 'confirm',
            });
            break;
        case 'edit':
            setOpenEditDialog(true);
            break;
        }
    };

  return (
    <>
      <Dialog
        open={openEditDialog}
        scroll="paper"
        fullScreen={belowLargeScreen}
        fullWidth
        maxWidth={openEditDialog ? 'lg' : 'md'}
      >
        {openEditDialog &&
          (checkPermission([PERMISSIONS.ACCOUNTS_TRANSACTIONS_EDIT]) ? (
            <SalesInvoiceAdjustment invoiceData={transaction as any} toggleOpen={setOpenEditDialog}/>
          ) : (
            <UnauthorizedAccess />
          ))}
      </Dialog>

      <JumboDdMenu
        icon={
          <Tooltip title="Actions">
            <MoreHorizOutlined />
          </Tooltip>
        }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />
    </>
  );
};

export default SaleInvoiceAdjustmentItemAction;
