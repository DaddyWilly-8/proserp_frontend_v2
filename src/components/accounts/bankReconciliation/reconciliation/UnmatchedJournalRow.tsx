'use client';

import React, { useState } from 'react';
import { Autocomplete, Box, Chip, Grid, IconButton, TextField, Tooltip, Typography } from '@mui/material';
import { BlockOutlined, CheckCircleOutlined, DeleteOutlined, LinkOffOutlined, MoreVert, PauseCircleOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { IconButton as MuiIconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import bankReconciliationServices from '../bank-reconciliation-services';
import { descriptionIncludesVoucher } from './journal-display';
import { formatDate } from './date-format';
import { quickActionsFor } from './transaction-quick-actions';
import CancelTransactionDialog from './CancelTransactionDialog';

interface StatementLine {
  id: number;
  line_date: string;
  description: string;
  amount: number;
}

interface UnmatchedLineOption {
  line: StatementLine;
  remaining_amount: number;
}

interface ExistingMatch {
  id: number;
  matched_amount: number;
  statement_line: StatementLine;
}

interface Journal {
  id: number;
  journal_date: string;
  description: string;
  comparable_amount: number;
  voucher_no?: string | null;
  counterparty?: string | null;
  credit_ledger?: { name: string };
  debit_ledger?: { name: string };
  journalable_type?: string | null;
  journalable_id?: number | null;
}

interface Props {
  bankAccountId: number;
  journal: Journal;
  allUnmatchedLines: UnmatchedLineOption[];
  existingMatches: ExistingMatch[];
  remainingAmount: number;
  tolerance?: number;
}

const formatAmount = (amount: number) =>
  amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function UnmatchedJournalRow({
  bankAccountId,
  journal,
  allUnmatchedLines,
  existingMatches,
  remainingAmount,
  tolerance = 0.01,
}: Props) {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { showDialog, hideDialog } = useJumboDialog();
  const { checkOrganizationPermission } = useJumboAuth();
  const [selectedLines, setSelectedLines] = useState<UnmatchedLineOption[]>([]);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['bank-reconciliation-workspace', bankAccountId] });
  };

  const quickActions = quickActionsFor(journal.journalable_type);
  const canMarkOutstanding = checkOrganizationPermission(PERMISSIONS.BANK_RECONCILIATION_EDIT);
  const canCancel = quickActions && checkOrganizationPermission(quickActions.cancelPermissions);
  const canDelete = quickActions && checkOrganizationPermission(quickActions.deletePermissions);
  const hasAnyRowAction = canMarkOutstanding || canCancel || canDelete;

  const selectedTotal = selectedLines.reduce((sum, option) => sum + option.remaining_amount, 0);
  const isBalanced = Math.abs(selectedTotal - remainingAmount) <= tolerance;

  const matchMutation = useMutation({
    mutationFn: () => bankReconciliationServices.matchJournal(bankAccountId, journal.id, selectedLines.map((o) => o.line.id)),
    onSuccess: (data) => {
      enqueueSnackbar(data.message || 'Matched successfully', { variant: 'success' });
      setSelectedLines([]);
      invalidate();
    },
    onError: (err: any) => enqueueSnackbar(err?.response?.data?.message || 'Failed to match', { variant: 'error' }),
  });

  const removeMatchMutation = useMutation({
    mutationFn: (matchId: number) => bankReconciliationServices.removeMatch(matchId),
    onSuccess: (data) => {
      enqueueSnackbar(data.message || 'Removed successfully', { variant: 'success' });
      invalidate();
    },
    onError: (err: any) => enqueueSnackbar(err?.response?.data?.message || 'Failed to remove', { variant: 'error' }),
  });

  const markOutstandingMutation = useMutation({
    mutationFn: () => bankReconciliationServices.markOutstanding(bankAccountId, journal.id),
    onSuccess: (data) => {
      enqueueSnackbar(data.message || 'Marked as outstanding', { variant: 'success' });
      invalidate();
    },
    onError: (err: any) => enqueueSnackbar(err?.response?.data?.message || 'Failed to mark as outstanding', { variant: 'error' }),
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => quickActions!.cancel(journal.journalable_id!, { reason, cancellation_date: undefined }),
    onSuccess: (data) => {
      enqueueSnackbar(data.message || 'Transaction cancelled', { variant: 'success' });
      setCancelDialogOpen(false);
      invalidate();
    },
    onError: (err: any) => enqueueSnackbar(err?.response?.data?.message || 'Failed to cancel transaction', { variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => quickActions!.delete(journal.journalable_id!),
    onSuccess: (data) => {
      enqueueSnackbar(data.message || 'Transaction deleted', { variant: 'success' });
      hideDialog();
      invalidate();
    },
    onError: (err: any) => enqueueSnackbar(err?.response?.data?.message || 'Failed to delete transaction', { variant: 'error' }),
  });

  const confirmDelete = () => {
    setMenuAnchor(null);
    showDialog({
      title: `Delete this ${quickActions?.label.toLowerCase()}?`,
      content: 'This permanently deletes the transaction and its book entry. This cannot be undone. Continue?',
      variant: 'confirm',
      onYes: () => deleteMutation.mutate(),
      onNo: () => hideDialog(),
    });
  };

  return (
    <Grid container spacing={1} alignItems='center' sx={{ py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
      <Grid size={{ xs: 12, md: 3 }}>
        <Typography variant='body2' color='text.secondary'>
          {formatDate(journal.journal_date)}
          {!descriptionIncludesVoucher(journal) && journal.voucher_no && ` — ${journal.voucher_no}`}
        </Typography>
        <Typography variant='body2'>{journal.description}</Typography>
        {journal.counterparty && (
          <Typography variant='caption' color='text.secondary'>{journal.counterparty}</Typography>
        )}
      </Grid>
      <Grid size={{ xs: 12, md: 2 }}>
        <Typography variant='body1' fontWeight={600}>
          {formatAmount(journal.comparable_amount)}
        </Typography>
        {existingMatches.length > 0 && (
          <Typography variant='caption' color='text.secondary' display='block'>
            Remaining: {formatAmount(remainingAmount)}
          </Typography>
        )}
      </Grid>
      <Grid size={{ xs: 12, md: 5 }}>
        {existingMatches.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
            {existingMatches.map((match) => (
              <Chip
                key={match.id}
                size='small'
                label={`${match.statement_line.description} — ${formatAmount(match.matched_amount)}`}
                onDelete={() => removeMatchMutation.mutate(match.id)}
                deleteIcon={<LinkOffOutlined fontSize='small' />}
              />
            ))}
          </Box>
        )}
        <Autocomplete
          multiple
          size='small'
          options={allUnmatchedLines}
          value={selectedLines}
          getOptionLabel={(option: UnmatchedLineOption) =>
            `${formatDate(option.line.line_date)} — ${option.line.description} — ${formatAmount(option.remaining_amount)}`
          }
          isOptionEqualToValue={(option, value) => option.line.id === value.line.id}
          onChange={(e, newValue) => setSelectedLines(newValue)}
          renderInput={(params) => (
            <TextField {...params} label='Combine statement lines' placeholder='Search statement lines…' />
          )}
        />
        {selectedLines.length > 0 && (
          <Box sx={{ mt: 0.5 }}>
            <Typography variant='caption' color={isBalanced ? 'success.main' : 'warning.main'}>
              Selected: {formatAmount(selectedTotal)} / Remaining: {formatAmount(remainingAmount)}
              {isBalanced ? ' ✓' : ''}
            </Typography>
          </Box>
        )}
      </Grid>
      <Grid size={{ xs: 12, md: 2 }} textAlign='end'>
        <Tooltip title='Match selected statement lines to this book entry'>
          <span>
            <LoadingButton
              size='small'
              variant='contained'
              startIcon={<CheckCircleOutlined />}
              disabled={selectedLines.length === 0 || !isBalanced}
              loading={matchMutation.isPending}
              onClick={() => matchMutation.mutate()}
              sx={{ mr: hasAnyRowAction ? 1 : 0 }}
            >
              Match
            </LoadingButton>
          </span>
        </Tooltip>
        {hasAnyRowAction && (
          <>
            <Tooltip title='More actions'>
              <MuiIconButton size='small' onClick={(e) => setMenuAnchor(e.currentTarget)}>
                <MoreVert fontSize='small' />
              </MuiIconButton>
            </Tooltip>
            <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
              {canMarkOutstanding && (
                <MenuItem
                  onClick={() => {
                    setMenuAnchor(null);
                    markOutstandingMutation.mutate();
                  }}
                >
                  <ListItemIcon><PauseCircleOutlined fontSize='small' /></ListItemIcon>
                  <ListItemText>Mark as Outstanding (timing difference)</ListItemText>
                </MenuItem>
              )}
              {canCancel && (
                <MenuItem
                  onClick={() => {
                    setMenuAnchor(null);
                    setCancelDialogOpen(true);
                  }}
                >
                  <ListItemIcon><BlockOutlined fontSize='small' /></ListItemIcon>
                  <ListItemText>Cancel {quickActions?.label}</ListItemText>
                </MenuItem>
              )}
              {canDelete && (
                <MenuItem onClick={confirmDelete}>
                  <ListItemIcon><DeleteOutlined fontSize='small' color='error' /></ListItemIcon>
                  <ListItemText>Delete {quickActions?.label}</ListItemText>
                </MenuItem>
              )}
            </Menu>
          </>
        )}
      </Grid>
      {cancelDialogOpen && (
        <CancelTransactionDialog
          open={cancelDialogOpen}
          loading={cancelMutation.isPending}
          onClose={() => setCancelDialogOpen(false)}
          onConfirm={(reason) => cancelMutation.mutate(reason)}
        />
      )}
    </Grid>
  );
}
