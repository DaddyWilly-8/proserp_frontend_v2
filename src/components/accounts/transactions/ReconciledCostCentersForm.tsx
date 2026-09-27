'use client';

import React, { useState } from 'react';
import { Alert, Button, DialogActions, DialogContent, DialogTitle, Grid, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';

interface Props {
  voucherNo?: string;
  transactionDate?: string;
  narration?: string;
  currentCostCenters: CostCenter[];
  setOpen: (open: boolean) => void;
  updateCostCenters: (costCenters: { id: number }[]) => Promise<any>;
}

const formatDate = (date?: string) => (date ? new Date(date).toLocaleDateString() : '');

/**
 * Replaces the full edit form once a transaction has a journal reconciled in
 * bank matching — the backend rejects a full update() outright at that point
 * (Journal::blockingReconciliationMatch()), since it would tear down and
 * recreate the very journal the match points at. Cost centers are the one
 * exception: a dedicated updateCostCenters() endpoint syncs them in place
 * without touching amount/date/ledgers, so it's safe regardless of match
 * state — this is the only field this view exposes.
 */
export default function ReconciledCostCentersForm({
  voucherNo,
  transactionDate,
  narration,
  currentCostCenters,
  setOpen,
  updateCostCenters,
}: Props) {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [costCenters, setCostCenters] = useState<CostCenter[]>(currentCostCenters);

  const mutation = useMutation({
    mutationFn: () => updateCostCenters(costCenters.map((c) => ({ id: c.id }))),
    onSuccess: (data) => {
      enqueueSnackbar(data?.message || 'Cost centers updated successfully', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setOpen(false);
    },
    onError: (error: any) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  return (
    <>
      <DialogTitle textAlign='center'>{voucherNo || 'Transaction'}</DialogTitle>
      <DialogContent>
        <Alert severity='info' sx={{ mb: 2 }}>
          This transaction is matched in a bank reconciliation, so most fields are locked to protect that match.
          Only its cost centers can still be changed here.
        </Alert>
        <Grid container spacing={1} sx={{ mb: 2 }}>
          <Grid size={12}>
            <Typography variant='caption' color='text.secondary'>Date</Typography>
            <Typography variant='body2'>{formatDate(transactionDate)}</Typography>
          </Grid>
          <Grid size={12}>
            <Typography variant='caption' color='text.secondary'>Narration</Typography>
            <Typography variant='body2'>{narration}</Typography>
          </Grid>
        </Grid>
        <CostCenterSelector
          label='Cost Centers'
          defaultValue={costCenters}
          onChange={(value) => setCostCenters((Array.isArray(value) ? value : value ? [value] : []) as CostCenter[])}
        />
      </DialogContent>
      <DialogActions>
        <Button size='small' onClick={() => setOpen(false)}>Cancel</Button>
        <LoadingButton
          size='small'
          variant='contained'
          loading={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          Save
        </LoadingButton>
      </DialogActions>
    </>
  );
}
