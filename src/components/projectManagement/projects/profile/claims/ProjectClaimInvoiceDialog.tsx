'use client';

import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import posServices from '@/components/pos/pos-services';
import projectsServices from '@/components/projectManagement/projects/project-services';
import { ProjectClaim } from './ProjectClaimType';

interface ProjectClaimInvoiceDialogProps {
  open: boolean;
  belowLargeScreen: boolean;
  claim: ProjectClaim;
  onClose: () => void;
}

/**
 * Collects due date / customer reference / terms & instructions before invoicing a claim -
 * shown instead of a plain confirm only when the organization generates a real Customer Invoice
 * for IPCs (ProjectClaimItemAction gates this), modeled on ProjectClaimApprovalDialog.
 */
const ProjectClaimInvoiceDialog = ({
  open,
  belowLargeScreen,
  claim,
  onClose,
}: ProjectClaimInvoiceDialogProps) => {
  const dictionary = useDictionary();
  const [dueDate, setDueDate] = useState<string>('');
  const [customerReference, setCustomerReference] = useState('');
  const [termsAndInstructions, setTermsAndInstructions] = useState('');

  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const { data: termsSuggestions } = useQuery<string[]>({
    queryKey: ['terms-and-instructions'],
    queryFn: posServices.getTermsandInstructions,
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;

    setDueDate('');
    setCustomerReference('');
    setTermsAndInstructions('');
  }, [open]);

  const { mutate: invoiceClaim, isPending: isSubmitting } = useMutation({
    mutationFn: projectsServices.invoiceClaim,
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['projectProjectClaims'] });
      enqueueSnackbar(data.message, { variant: 'success' });
      onClose();
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || dictionary.projectManagement.claims.actions.invoiceFailed, {
        variant: 'error',
      });
    },
  });

  const handleSubmit = () => {
    invoiceClaim({
      id: claim.id,
      due_date: dueDate || undefined,
      customer_reference: customerReference || undefined,
      terms_and_instructions: termsAndInstructions || undefined,
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
      <DialogTitle>{dictionary.projectManagement.claims.invoice.title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Alert severity='info'>
            {dictionary.projectManagement.claims.invoice.notice.replace('{claimNo}', claim.claimNo ?? '')}
          </Alert>
          <DateTimePicker
            label={dictionary.projectManagement.claims.invoice.dueDate}
            minDate={claim.claim_date ? dayjs(claim.claim_date) : undefined}
            value={dueDate ? dayjs(dueDate) : null}
            onChange={(val) => setDueDate(val?.toISOString() || '')}
            slotProps={{
              textField: { size: 'small', fullWidth: true },
            }}
          />
          <TextField
            label={dictionary.projectManagement.claims.invoice.customerReference}
            size='small'
            fullWidth
            value={customerReference}
            onChange={(e) => setCustomerReference(e.target.value)}
          />
          <Autocomplete
            freeSolo
            options={termsSuggestions || []}
            value={termsAndInstructions}
            getOptionLabel={(option) => option}
            renderInput={(params) => (
              <TextField {...params} label={dictionary.projectManagement.claims.invoice.termsAndInstructions} size='small' fullWidth multiline rows={2} />
            )}
            onChange={(_, newValue) => setTermsAndInstructions(newValue || '')}
            onInputChange={(_, newInputValue) => setTermsAndInstructions(newInputValue)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          {dictionary.projectManagement.claims.common.cancel}
        </Button>
        <LoadingButton
          loading={isSubmitting}
          variant='contained'
          color='primary'
          onClick={handleSubmit}
        >
          {dictionary.projectManagement.claims.invoice.createInvoice}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default ProjectClaimInvoiceDialog;
