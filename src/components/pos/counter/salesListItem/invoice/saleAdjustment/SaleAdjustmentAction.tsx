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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import StakeholderSelectProvider from '@/components/masters/stakeholders/StakeholderSelectProvider';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import posServices from '@/components/pos/pos-services';
import SalesInvoiceAdjustment from './SalesInvoiceAdjustment';

interface Adjustment {
  id: number;
  type: 'debit' | 'credit' | string;
}

interface EditSaleAdjustmentProps {
  adjustment: Adjustment;
  toggleOpen: (open: boolean) => void;
  type: Adjustment['type'];
}

interface SaleAdjustmentActionProps {
  selectedAdjustment: Adjustment | null;
  setSelectedAdjustment: (adj: Adjustment | null) => void;
  openAdjustmentEditDialog: boolean;
  setOpenAdjustmentEditDialog: (open: boolean) => void;
  openAdjustmentDeleteDialog: boolean;
  setOpenAdjustmentDeleteDialog: (open: boolean) => void;
}

// ---------- Components ----------
function EditSaleAdjustment({
  adjustment,
  toggleOpen,
  type,
}: EditSaleAdjustmentProps) {
  const { data: adjustmentData, isFetching } = useQuery({
    queryKey: ['adjustmentdetails', { id: adjustment.id, type }],
    queryFn: () => posServices.invoiceAdjustmentDetails(adjustment.id, type),
  });

  if (isFetching) {
    return <LinearProgress />;
  }

  return (
    <StakeholderSelectProvider>
      <SalesInvoiceAdjustment
        toggleOpen={toggleOpen}
        invoiceData={adjustmentData}
        isEdit
      />
    </StakeholderSelectProvider>
  );
}

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

  const deleteSaleInvoiceAdjustment = useMutation({
    mutationFn: posServices.deleteSaleInvoiceAdjustment,
    onSuccess: (data: any) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['SaleAdjustments'] });
      queryClient.invalidateQueries({ queryKey: ['counterSales'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message, { variant: 'error' });
    },
  });

  return (
    <>
      {/* Delete Confirmation Dialog */}
      <Dialog open={openAdjustmentDeleteDialog}>
        <DialogTitle>Delete Confirmation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this Adjustment?
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
                deleteSaleInvoiceAdjustment.mutate({
                  id: selectedAdjustment.id,
                  type: selectedAdjustment.type,
                });
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
            type={selectedAdjustment.type}
          />
        )}
      </Dialog>
    </>
  );
}

export default SaleAdjustmentAction;
