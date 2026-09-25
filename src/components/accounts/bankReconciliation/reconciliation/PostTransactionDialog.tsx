'use client';

import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import LedgerSelectProvider from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import bankReconciliationServices from '../bank-reconciliation-services';

interface Ledger {
  id: number;
  name: string;
}

interface StatementLine {
  id: number;
  line_date: string;
  description: string;
  amount: number;
}

interface Props {
  bankAccountId: number;
  line: StatementLine;
  open: boolean;
  onClose: () => void;
}

type TransactionType = 'payment' | 'receipt' | 'fund_transfer' | 'journal_voucher';

const TYPE_LABELS: Record<TransactionType, string> = {
  payment: 'Payment',
  receipt: 'Receipt',
  fund_transfer: 'Fund Transfer',
  journal_voucher: 'Journal Voucher',
};

const formatAmount = (amount: number) =>
  amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function PostTransactionDialogContent({ bankAccountId, line, open, onClose }: Props) {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { checkOrganizationPermission } = useJumboAuth();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const isOutflow = line.amount < 0;

  // A type only ever shows up if the user is both allowed to create that
  // transaction type at all, and it's the right direction for this line
  // (a Payment can't record money coming in, a Receipt can't record money
  // going out — Fund Transfer and Journal Voucher work either way).
  const availableTypes = useMemo(() => {
    const canReconcile = checkOrganizationPermission(PERMISSIONS.BANK_RECONCILIATION_CREATE);
    if (!canReconcile) return [];

    const candidates: { type: TransactionType; permissions: string[]; allowedForDirection: boolean }[] = [
      { type: 'payment', permissions: [PERMISSIONS.ACCOUNTS_TRANSACTIONS_CREATE, PERMISSIONS.PAYMENTS_CREATE], allowedForDirection: isOutflow },
      { type: 'receipt', permissions: [PERMISSIONS.ACCOUNTS_TRANSACTIONS_CREATE, PERMISSIONS.RECEIPTS_CREATE], allowedForDirection: !isOutflow },
      { type: 'fund_transfer', permissions: [PERMISSIONS.ACCOUNTS_TRANSACTIONS_CREATE, PERMISSIONS.FUND_TRANSFERS_CREATE], allowedForDirection: true },
      { type: 'journal_voucher', permissions: [PERMISSIONS.ACCOUNTS_TRANSACTIONS_CREATE, PERMISSIONS.JOURNAL_VOUCHERS_CREATE], allowedForDirection: true },
    ];

    return candidates
      .filter((c) => c.allowedForDirection && checkOrganizationPermission(c.permissions))
      .map((c) => c.type);
  }, [checkOrganizationPermission, isOutflow]);

  const [type, setType] = useState<TransactionType | null>(availableTypes[0] ?? null);
  const [otherLedger, setOtherLedger] = useState<Ledger | null>(null);
  const [narration, setNarration] = useState(line.description || '');
  const [reference, setReference] = useState('');

  const effectiveType = type && availableTypes.includes(type) ? type : availableTypes[0] ?? null;

  const postMutation = useMutation({
    mutationFn: () =>
      bankReconciliationServices.postTransaction(line.id, {
        type: effectiveType,
        other_ledger_id: otherLedger?.id,
        narration,
        reference: reference || undefined,
      }),
    onSuccess: (result) => {
      enqueueSnackbar(result.message || 'Posted and matched successfully', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['bank-reconciliation-workspace', bankAccountId] });
      onClose();
    },
    onError: (err: any) => enqueueSnackbar(err?.response?.data?.message || 'Failed to post transaction', { variant: 'error' }),
  });

  const canSubmit = !!effectiveType && !!otherLedger && !!narration.trim();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='sm'
      fullWidth
      fullScreen={belowLargeScreen}
      scroll={belowLargeScreen ? 'body' : 'paper'}
    >
      <DialogTitle>Post Transaction</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant='body2' color='text.secondary'>
            {new Date(line.line_date).toLocaleDateString()} — {line.description}
          </Typography>
          <Typography variant='h6' color={isOutflow ? 'error.main' : 'success.main'}>
            {formatAmount(Math.abs(line.amount))}
          </Typography>
        </Box>

        {availableTypes.length === 0 ? (
          <Alert severity='warning'>
            You don&apos;t have permission to post any transaction type against this statement line.
          </Alert>
        ) : (
          <Grid container spacing={2}>
            <Grid size={12}>
              <ToggleButtonGroup
                value={effectiveType}
                exclusive
                size='small'
                onChange={(e, value) => value && setType(value)}
                fullWidth
              >
                {availableTypes.map((t) => (
                  <ToggleButton key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Grid>
            <Grid size={12}>
              <LedgerSelect
                label={effectiveType === 'payment' ? 'Paid to / Expense Ledger' : effectiveType === 'receipt' ? 'Received from / Income Ledger' : 'Other Ledger'}
                value={otherLedger as any}
                onChange={(value) => setOtherLedger(value as Ledger | null)}
                notAllowedLedgers={[]}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                size='small'
                label='Narration'
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                size='small'
                label='Reference (optional)'
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <LoadingButton onClick={onClose}>Cancel</LoadingButton>
        {availableTypes.length > 0 && (
          <LoadingButton
            variant='contained'
            disabled={!canSubmit}
            loading={postMutation.isPending}
            onClick={() => postMutation.mutate()}
          >
            Post &amp; Match
          </LoadingButton>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default function PostTransactionDialog(props: Props) {
  if (!props.open) return null;
  return (
    <LedgerSelectProvider>
      <PostTransactionDialogContent {...props} />
    </LedgerSelectProvider>
  );
}
