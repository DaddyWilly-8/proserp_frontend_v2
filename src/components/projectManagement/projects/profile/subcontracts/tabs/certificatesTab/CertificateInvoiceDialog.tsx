'use client';

import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import projectsServices from '@/components/projectManagement/projects/project-services';
import { Certificate } from './CertificateType';

interface CertificateInvoiceDialogProps {
  open: boolean;
  belowLargeScreen: boolean;
  certificate: Certificate;
  onClose: () => void;
}

/**
 * Collects due date / supplier reference before invoicing a certificate - shown instead of a
 * plain confirm only when the organization generates a real Supplier Bill for certificates
 * (CertificateItemAction gates this), modeled on CertificateApprovalDialog.
 */
const CertificateInvoiceDialog = ({
  open,
  belowLargeScreen,
  certificate,
  onClose,
}: CertificateInvoiceDialogProps) => {
  const [dueDate, setDueDate] = useState<string>('');
  const [supplierReference, setSupplierReference] = useState('');

  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) return;

    setDueDate('');
    setSupplierReference('');
  }, [open]);

  const { mutate: invoiceCertificate, isPending: isSubmitting } = useMutation({
    mutationFn: projectsServices.invoiceCertificate,
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['Certificates'] });
      enqueueSnackbar(data.message, { variant: 'success' });
      onClose();
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to create invoice', {
        variant: 'error',
      });
    },
  });

  const handleSubmit = () => {
    invoiceCertificate({
      id: certificate.id,
      due_date: dueDate || undefined,
      supplier_reference: supplierReference || undefined,
    } as any);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth='sm'
      fullScreen={belowLargeScreen}
      scroll={belowLargeScreen ? 'body' : 'paper'}
    >
      <DialogTitle>Create Supplier Bill</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Alert severity='info'>
            This will post {certificate.certificateNo} to the subcontractor&apos;s account as a
            real bill and it can no longer be edited directly.
          </Alert>
          <DateTimePicker
            label='Bill Due Date'
            minDate={certificate.certificate_date ? dayjs(certificate.certificate_date) : undefined}
            value={dueDate ? dayjs(dueDate) : null}
            onChange={(val) => setDueDate(val?.toISOString() || '')}
            slotProps={{
              textField: { size: 'small', fullWidth: true },
            }}
          />
          <TextField
            label='Supplier Reference'
            size='small'
            fullWidth
            inputProps={{ maxLength: 20 }}
            value={supplierReference}
            onChange={(e) => setSupplierReference(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <LoadingButton
          loading={isSubmitting}
          variant='contained'
          color='primary'
          onClick={handleSubmit}
        >
          Create Invoice
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default CertificateInvoiceDialog;
