'use client';

import React from 'react';
import { Alert, Grid, Paper, Typography } from '@mui/material';

interface Props {
  closingBalance: number;
  bookBalance: number;
  difference: number;
  // The backend's own AMOUNT_TOLERANCE, so this box and the Complete button agree.
  tolerance?: number;
  isCompleted?: boolean;
}

const formatAmount = (amount: number) =>
  amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function DifferenceSummary({ closingBalance, bookBalance, difference, tolerance = 0.01, isCompleted = false }: Props) {
  // Round to cents first — a stored 0.0100000003 would otherwise fail a "<= 0.01" check.
  const isBalanced = Math.abs(Math.round(difference * 100) / 100) <= tolerance;

  return (
    <Paper variant='outlined' sx={{ p: 2, mb: 2 }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 4 }}>
          <Typography variant='caption' color='text.secondary' display='block'>
            Statement Closing Balance
          </Typography>
          <Typography variant='h6'>{formatAmount(closingBalance)}</Typography>
        </Grid>
        <Grid size={{ xs: 4 }}>
          <Typography variant='caption' color='text.secondary' display='block'>
            Book Balance
          </Typography>
          <Typography variant='h6'>{formatAmount(bookBalance)}</Typography>
        </Grid>
        <Grid size={{ xs: 4 }}>
          <Typography variant='caption' color='text.secondary' display='block'>
            Difference
          </Typography>
          <Typography variant='h6' color={isBalanced ? 'success.main' : 'error.main'}>
            {formatAmount(difference)}
          </Typography>
        </Grid>
      </Grid>
      {isCompleted && (
        <Alert severity={isBalanced ? 'success' : 'info'} sx={{ mt: 2 }}>
          This reconciliation has been completed.
        </Alert>
      )}
      {!isCompleted && !isBalanced && (
        <Alert severity='warning' sx={{ mt: 2 }}>
          Match or ignore the remaining statement lines, and match or mark as outstanding the remaining book entries, to bring the difference to zero before completing this reconciliation.
        </Alert>
      )}
      {!isCompleted && isBalanced && (
        <Alert severity='success' sx={{ mt: 2 }}>
          Balanced — ready to complete this reconciliation.
        </Alert>
      )}
    </Paper>
  );
}
