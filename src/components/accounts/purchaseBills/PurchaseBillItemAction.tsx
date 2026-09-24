'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { JumboDdMenu } from '@jumbo/components';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { MenuItemProps } from '@jumbo/types';
import {
  DeleteOutlined,
  EditOutlined,
  MoreHorizOutlined,
  RestoreOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import { useSnackbar } from 'notistack';
import { lazy, useState } from 'react';
import purchaseBillServices from '../../procurement/grns/purchaseBill-services';
import PurchaseBillDetailsDialog from './PurchaseBillDetailsDialog';
import { PurchaseBill } from './PurchaseBillType';

const PurchaseBillFormDialog = lazy(
  () => import('../../procurement/grns/PurchaseBillFormDialog')
);

const CancelBillDialog = ({
  purchaseBill,
  setOpenCancelDialog,
}: {
  purchaseBill: PurchaseBill;
  setOpenCancelDialog: (open: boolean) => void;
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { checkOrganizationPermission, authOrganization } = useJumboAuth();
  const [reason, setReason] = useState('');
  const [cancellationDate, setCancellationDate] = useState<Dayjs>(dayjs());

  const canBackdate = checkOrganizationPermission([
    PERMISSIONS.ACCOUNTS_TRANSACTIONS_BACKDATE,
    PERMISSIONS.PURCHASES_BACKDATE,
  ]);
  const canPostdate = checkOrganizationPermission([
    PERMISSIONS.ACCOUNTS_TRANSACTIONS_POSTDATE,
    PERMISSIONS.PURCHASES_POSTDATE,
  ]);

  const cancelBill = useMutation({
    mutationFn: (vars: { reason: string; cancellation_date: string }) =>
      purchaseBillServices.cancel(purchaseBill.id, vars),
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['purchase-bills'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-bill-details', purchaseBill.id] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrderGrns'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      setOpenCancelDialog(false);
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to cancel Purchase Bill', {
        variant: 'error',
      });
    },
  });

  return (
    <>
      <DialogTitle>Cancel {purchaseBill.invoiceNo}</DialogTitle>
      <DialogContent>
        <Grid container columnSpacing={1} rowSpacing={2} sx={{ mt: 0.5 }}>
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
          loading={cancelBill.isPending}
          disabled={!reason.trim()}
          onClick={() =>
            cancelBill.mutate({
              reason,
              cancellation_date: cancellationDate.toISOString(),
            })
          }
        >
          Cancel Bill
        </LoadingButton>
      </DialogActions>
    </>
  );
};

const PurchaseBillItemAction = ({ purchaseBill }: { purchaseBill: PurchaseBill }) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { showDialog, hideDialog } = useJumboDialog();
  const { checkOrganizationPermission } = useJumboAuth();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);

  const { data: editableBill, isFetching: isFetchingEditableBill } = useQuery({
    queryKey: ['purchase-bill-details', purchaseBill.id],
    queryFn: () => purchaseBillServices.details(purchaseBill.id),
    enabled: openEditDialog,
  });

  const deleteMutation = useMutation({
    mutationFn: purchaseBillServices.delete,
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['purchase-bills'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to delete Purchase Bill', {
        variant: 'error',
      });
    },
  });

  const reverseCancellation = useMutation({
    mutationFn: purchaseBillServices.reverseCancellation,
    onSuccess: (data: any) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['purchase-bills'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-bill-details', purchaseBill.id] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrderGrns'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || 'Failed to reverse the cancellation',
        { variant: 'error' }
      );
    },
  });

  const canEdit = checkOrganizationPermission(PERMISSIONS.SUPPLIER_BILLS_EDIT);
  const canCancel = checkOrganizationPermission(PERMISSIONS.SUPPLIER_BILLS_CANCEL);
  const canDelete = checkOrganizationPermission(PERMISSIONS.SUPPLIER_BILLS_DELETE);

  const menuItems: MenuItemProps[] = [
    {
      icon: <VisibilityOutlined />,
      title: 'View',
      action: 'view',
    },
    canEdit &&
      !purchaseBill.cancelled_at && {
        icon: <EditOutlined />,
        title: 'Edit',
        action: 'edit',
      },
    canCancel &&
      purchaseBill.cancellable !== false &&
      !purchaseBill.cancelled_at && {
        icon: <DeleteOutlined color='error' />,
        title: 'Cancel',
        action: 'cancel',
      },
    canCancel &&
      !!purchaseBill.cancelled_at && {
        icon: <RestoreOutlined />,
        title: 'Reverse Cancellation',
        action: 'reverse-cancellation',
      },
    canDelete &&
      !purchaseBill.cancelled_at && {
        icon: <DeleteOutlined color='error' />,
        title: 'Delete',
        action: 'delete',
      },
  ].filter(Boolean) as MenuItemProps[];

  const handleItemAction = (menuItem: MenuItemProps) => {
    switch (menuItem.action) {
      case 'view':
        setOpenDetailsDialog(true);
        break;
      case 'edit':
        setOpenEditDialog(true);
        break;
      case 'cancel':
        setOpenCancelDialog(true);
        break;
      case 'reverse-cancellation':
        reverseCancellation.mutate(purchaseBill.id);
        break;
      case 'delete':
        showDialog({
          title: 'Confirm Delete?',
          content: `If you click yes, ${purchaseBill.invoiceNo} will be deleted and its journals reversed.`,
          onYes: () => {
            hideDialog();
            deleteMutation.mutate(purchaseBill.id);
          },
          onNo: () => hideDialog(),
          variant: 'confirm',
        });
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
          <PurchaseBillDetailsDialog id={purchaseBill.id} setOpenDialog={setOpenDetailsDialog} />
        )}
      </Dialog>

      <Dialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        fullScreen={belowLargeScreen}
        fullWidth
        maxWidth='lg'
        scroll='paper'
      >
        {openEditDialog && !isFetchingEditableBill && editableBill && (
          <PurchaseBillFormDialog
            grn={editableBill.source?.grnNo ? editableBill.source : undefined}
            order={editableBill.source?.orderNo ? editableBill.source : undefined}
            existingBill={editableBill}
            setOpenDialog={setOpenEditDialog}
          />
        )}
      </Dialog>

      <Dialog
        open={openCancelDialog}
        onClose={() => setOpenCancelDialog(false)}
        fullWidth
        maxWidth='sm'
      >
        {openCancelDialog && (
          <CancelBillDialog purchaseBill={purchaseBill} setOpenCancelDialog={setOpenCancelDialog} />
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

export default PurchaseBillItemAction;
