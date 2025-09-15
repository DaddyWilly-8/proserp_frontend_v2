import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  LinearProgress,
  useMediaQuery,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import posServices from '@/components/pos/pos-services';
import SalesInvoiceAdjustment from './SalesInvoiceAdjustment';

// ---------- Types ----------
interface Adjustment {
  id: number;
  invoiceNo?: string;
  voucherNo?: string;
  transaction_date?: string;
  internal_reference?: string;
  customer_reference?: string;
  narration?: string;
  adjustmentNo?: string;
  vfd_receipt?: string | null;
}

interface EditSaleAdjustmentProps {
  adjustment: Adjustment;
  toggleOpen: (open: boolean) => void;
}

interface SaleAdjustmentActionProps {
  selectedAdjustment: Adjustment | null;
  setSelectedAdjustment: React.Dispatch<React.SetStateAction<Adjustment | null>>;
  openAdjustmentEditDialog: boolean;
  setOpenAdjustmentEditDialog: React.Dispatch<React.SetStateAction<boolean>>;
  openAdjustmentDeleteDialog: boolean;
  setOpenAdjustmentDeleteDialog: React.Dispatch<React.SetStateAction<boolean>>;
}

// ---------- Edit Component ----------
function EditSaleAdjustment({ adjustment, toggleOpen }: EditSaleAdjustmentProps) {
  const { data: invoiceData, isFetching } = useQuery({
    queryKey: ['SaleAdjustments', { id: adjustment.id }],
    queryFn: () => posServices.invoiceAdjustmentDetails(adjustment.id),
  });

  if (isFetching) {
    return <LinearProgress />;
  }

  return (
    <SalesInvoiceAdjustment toggleOpen={toggleOpen} invoiceData={invoiceData} />
  );
}

// ---------- Action Component ----------
function SaleAdjustmentAction({
  selectedAdjustment,
  setSelectedAdjustment,
  openAdjustmentEditDialog,
  setOpenAdjustmentEditDialog,
  openAdjustmentDeleteDialog,
  setOpenAdjustmentDeleteDialog,
}: SaleAdjustmentActionProps) {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  // Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: deleteInvoice } = useMutation({
    mutationFn: (id: number) => posServices.deleteInvoice(id),
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['SaleAdjustments'] });
      queryClient.invalidateQueries({ queryKey: ['counterSales'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message ?? 'Failed to delete', {
        variant: 'error',
      });
    },
  });

  return (
    <React.Fragment>
      {/* Delete Confirmation Dialog */}
      <Dialog open={openAdjustmentDeleteDialog}>
        <DialogTitle>Delete Confirmation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to Delete this Adjustment?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setSelectedAdjustment(null);
              setOpenAdjustmentDeleteDialog(false);
            }}
            color="primary"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (selectedAdjustment) {
                deleteInvoice(selectedAdjustment.id);
                setSelectedAdjustment(null);
                setOpenAdjustmentDeleteDialog(false);
              }
            }}
            color="primary"
          >
            Yes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={openAdjustmentEditDialog}
        scroll={belowLargeScreen ? 'body' : 'paper'}
        fullWidth
        fullScreen={!!openAdjustmentEditDialog && belowLargeScreen}
        maxWidth="lg"
      >
        {selectedAdjustment && (
          <EditSaleAdjustment
            adjustment={selectedAdjustment}
            toggleOpen={setOpenAdjustmentEditDialog}
          />
        )}
      </Dialog>
    </React.Fragment>
  );
}

export default SaleAdjustmentAction;
