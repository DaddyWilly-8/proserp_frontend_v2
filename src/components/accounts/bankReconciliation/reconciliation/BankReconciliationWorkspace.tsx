'use client';

import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  Divider,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import { CheckCircleOutlined, DeleteOutlined, SearchOutlined, UploadOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import bankReconciliationServices from '../bank-reconciliation-services';
import ImportStatementDialog from '../statementImport/ImportStatementDialog';
import DifferenceSummary from './DifferenceSummary';
import MatchedLineGroup from './MatchedLineGroup';
import UnmatchedJournalRow from './UnmatchedJournalRow';
import UnmatchedLineRow from './UnmatchedLineRow';
import { formatDate } from './date-format';

interface Props {
  bankAccountId: number;
}

const formatAmount = (amount: number) =>
  amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const amountText = (amount: any): string => {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '';
  const abs = Math.abs(n);
  return `${abs} ${formatAmount(abs)} ${formatAmount(abs).replace(/,/g, '')}`;
};

export default function BankReconciliationWorkspace({ bankAccountId }: Props) {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { showDialog, hideDialog } = useJumboDialog();
  const { checkOrganizationPermission } = useJumboAuth();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [tab, setTab] = useState(0);
  // null = "whichever statement the workspace defaults to" (the latest one).
  // Set once the user explicitly picks a different statement from the
  // selector below — otherwise an older, never-completed statement becomes
  // permanently unreachable the moment a newer one is imported, since
  // the backend always defaults to the latest by date.
  const [selectedStatementId, setSelectedStatementId] = useState<number | null>(null);
  // Narrow what the tabs list. View-only: the difference above is always
  // computed from the whole statement, so filtering can't hide a real gap.
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(null);
  const [dateTo, setDateTo] = useState<Dayjs | null>(null);
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['bank-reconciliation-workspace', bankAccountId, selectedStatementId],
    queryFn: () =>
      bankReconciliationServices.getReconciliationWorkspace(
        bankAccountId,
        selectedStatementId ? { statement_id: selectedStatementId } : {}
      ),
    retry: false,
  });

  const { data: statementsData } = useQuery({
    queryKey: ['bank-statements-list', bankAccountId],
    queryFn: () => bankReconciliationServices.listStatements(bankAccountId),
  });
  const statements = statementsData?.statements ?? [];

  const completeMutation = useMutation({
    mutationFn: () => bankReconciliationServices.completeStatement(data.statement.id),
    onSuccess: (result) => {
      enqueueSnackbar(result.message || 'Reconciliation completed successfully', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['bank-reconciliation-workspace', bankAccountId] });
      queryClient.invalidateQueries({ queryKey: ['bank-accounts-list'] });
    },
    onError: (err: any) => enqueueSnackbar(err?.response?.data?.message || 'Failed to complete reconciliation', { variant: 'error' }),
  });

  const deleteStatementMutation = useMutation({
    mutationFn: () => bankReconciliationServices.deleteStatement(data.statement.id),
    onSuccess: (result) => {
      enqueueSnackbar(result.message || 'Statement deleted', { variant: 'success' });
      hideDialog();
      setSelectedStatementId(null);
      queryClient.invalidateQueries({ queryKey: ['bank-reconciliation-workspace', bankAccountId] });
      queryClient.invalidateQueries({ queryKey: ['bank-statements-list', bankAccountId] });
      queryClient.invalidateQueries({ queryKey: ['bank-accounts-list'] });
    },
    onError: (err: any) => enqueueSnackbar(err?.response?.data?.message || 'Failed to delete statement', { variant: 'error' }),
  });

  const unignoreMutation = useMutation({
    mutationFn: (lineId: number) => bankReconciliationServices.unignoreLine(lineId),
    onSuccess: (result) => {
      enqueueSnackbar(result.message || 'Line restored', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['bank-reconciliation-workspace', bankAccountId] });
    },
    onError: (err: any) => enqueueSnackbar(err?.response?.data?.message || 'Failed to restore line', { variant: 'error' }),
  });

  const unmarkOutstandingMutation = useMutation({
    mutationFn: (itemId: number) => bankReconciliationServices.unmarkOutstanding(itemId),
    onSuccess: (result) => {
      enqueueSnackbar(result.message || 'Removed from outstanding', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['bank-reconciliation-workspace', bankAccountId] });
    },
    onError: (err: any) => enqueueSnackbar(err?.response?.data?.message || 'Failed to unmark', { variant: 'error' }),
  });

  const confirmDeleteStatement = () => {
    showDialog({
      title: 'Delete this statement?',
      content:
        'This permanently deletes the imported statement, every one of its lines, and all matches made against it — freeing up any book entries they were linked to. This cannot be undone. Start this reconciliation over from scratch?',
      variant: 'confirm',
      onYes: () => deleteStatementMutation.mutate(),
      onNo: () => hideDialog(),
    });
  };

  const bankAccount = data?.bank_account;

  let mainContent: React.ReactNode;

  if (isLoading) {
    // Rendered inline (not as an early `return`) so the import dialog below
    // stays mounted through this state too — a refetch triggered right after
    // a successful first-ever import (the query was previously in an error
    // state, so there's no cached data to show while it reloads) briefly
    // passes through here, and an early return would unmount the dialog
    // showing "Import Complete" along with it, losing that screen.
    mainContent = <Typography>Loading…</Typography>;
  } else if (isError) {
    mainContent = (
      <Box>
        <Alert severity='info' sx={{ mb: 2 }}>
          {(error as any)?.response?.data?.message || 'No statement has been imported for this bank account yet.'}
        </Alert>
        {checkOrganizationPermission(PERMISSIONS.BANK_RECONCILIATION_CREATE) && (
          <Button variant='contained' startIcon={<UploadOutlined />} onClick={() => setImportDialogOpen(true)}>
            Import Bank Statement
          </Button>
        )}
      </Box>
    );
  } else {
    const { statement, book_balance, difference, amount_tolerance, suggestion_day_tolerance } = data;
    const allMatchedLines: any[] = data.matched_lines;
    const allUnmatchedLines: any[] = data.unmatched_lines;
    const allIgnoredLines: any[] = data.ignored_lines;
    const allUnmatchedJournals: any[] = data.unmatched_journals;
    const allOutstandingJournals: any[] = data.outstanding_journals;

    const terms = search.toLowerCase().split(/\s+/).filter(Boolean).map((t) => t.replace(/,/g, ''));
    const filtersActive = Boolean(dateFrom || dateTo || terms.length);
    // Statement lines carry a date only (midnight), journals a full
    // timestamp. A midnight value is treated as the whole day, so picking a
    // time on the same day doesn't drop that day's statement lines.
    const inRange = (date: any) => {
      if (!dateFrom && !dateTo) return true;
      const d = dayjs(date);
      const wholeDay = d.hour() === 0 && d.minute() === 0 && d.second() === 0;
      if (dateFrom && d.isBefore(wholeDay ? dateFrom.startOf('day') : dateFrom)) return false;
      if (dateTo && d.isAfter(wholeDay ? dateTo.endOf('day') : dateTo)) return false;
      return true;
    };
    const matchesSearch = (...parts: any[]) => {
      if (!terms.length) return true;
      const haystack = parts.join(' ').toLowerCase().replace(/,/g, '');
      return terms.every((t) => haystack.includes(t));
    };
    const lineText = (line: any) => [line.description, line.reference, amountText(line.amount)];
    const journalText = (journal: any) => [
      journal.description,
      journal.voucher_no,
      journal.counterparty,
      amountText(journal.comparable_amount ?? journal.amount),
    ];

    const unmatched_lines = allUnmatchedLines.filter((i) => inRange(i.line.line_date) && matchesSearch(...lineText(i.line)));
    const unmatched_journals = allUnmatchedJournals.filter((j) => inRange(j.journal_date) && matchesSearch(...journalText(j)));
    const matched_lines = allMatchedLines.filter(
      (g) =>
        inRange(g.line.line_date) &&
        matchesSearch(...lineText(g.line), ...(g.matches ?? []).flatMap((m: any) => (m.journal ? journalText(m.journal) : [])))
    );
    const ignored_lines = allIgnoredLines.filter((l) => inRange(l.line_date) && matchesSearch(...lineText(l)));
    const outstanding_journals = allOutstandingJournals.filter((j) => inRange(j.journal_date) && matchesSearch(...journalText(j)));
    // Tab label: "shown/total" while a filter is hiding rows, plain count otherwise.
    const count = (shown: any[], total: any[]) => (filtersActive ? `${shown.length}/${total.length}` : `${total.length}`);
    const tolerance = amount_tolerance ?? 0.01;
    const isBalanced = Math.abs(Math.round(difference * 100) / 100) <= tolerance;
    const isCompleted = statement.status === 'completed';

    mainContent = (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant='h5'>{bankAccount?.ledger?.name}</Typography>
            {statements.length > 1 ? (
              <Select
                size='small'
                value={statement.id}
                onChange={(e) => {
                  setSelectedStatementId(Number(e.target.value));
                  setTab(0);
                }}
                sx={{ mt: 0.5, minWidth: 260 }}
              >
                {statements.map((s: any) => (
                  <MenuItem key={s.id} value={s.id}>
                    {formatDate(s.statement_date_from)} – {formatDate(s.statement_date_to)} ({s.status}
                    {s.unmatched_lines_count > 0 ? `, ${s.unmatched_lines_count} unmatched` : ''})
                  </MenuItem>
                ))}
              </Select>
            ) : (
              <Typography variant='body2' color='text.secondary' component='div' sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>
                  Statement {formatDate(statement.statement_date_from)} – {formatDate(statement.statement_date_to)}
                </span>
                <Chip size='small' label={statement.status} color={isCompleted ? 'success' : 'default'} />
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {/* Also offered on a completed statement: that's exactly when the next period's statement is imported */}
            {checkOrganizationPermission(PERMISSIONS.BANK_RECONCILIATION_CREATE) && (
              <Button variant='outlined' startIcon={<UploadOutlined />} onClick={() => setImportDialogOpen(true)}>
                Import New Statement
              </Button>
            )}
            {checkOrganizationPermission(PERMISSIONS.BANK_RECONCILIATION_DELETE) && (
              <LoadingButton
                variant='outlined'
                color='error'
                startIcon={<DeleteOutlined />}
                loading={deleteStatementMutation.isPending}
                onClick={confirmDeleteStatement}
              >
                Delete Statement
              </LoadingButton>
            )}
          </Box>
        </Box>

        <DifferenceSummary closingBalance={statement.closing_balance} bookBalance={book_balance} difference={difference} tolerance={tolerance} isCompleted={isCompleted} />

        {!isCompleted && checkOrganizationPermission(PERMISSIONS.BANK_RECONCILIATION_EDIT) && (
          <Box sx={{ mb: 2 }}>
            <LoadingButton
              variant='contained'
              color='success'
              startIcon={<CheckCircleOutlined />}
              disabled={!isBalanced}
              loading={completeMutation.isPending}
              onClick={() => completeMutation.mutate()}
            >
              Complete Reconciliation
            </LoadingButton>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mb: 1 }}>
          {/* On mobile the two pickers share one row (half width each, shorter format). */}
          <DateTimePicker
            label='From'
            value={dateFrom}
            format={mobile ? 'DD/MM/YY HH:mm' : undefined}
            onChange={(newValue: Dayjs | null) => setDateFrom(newValue)}
            sx={{ flex: { xs: '1 1 0', sm: '0 0 auto' }, minWidth: 0 }}
            slotProps={{ textField: { size: 'small' }, field: { clearable: true } }}
          />
          <DateTimePicker
            label='To'
            value={dateTo}
            minDateTime={dateFrom ?? undefined}
            format={mobile ? 'DD/MM/YY HH:mm' : undefined}
            onChange={(newValue: Dayjs | null) => setDateTo(newValue)}
            sx={{ flex: { xs: '1 1 0', sm: '0 0 auto' }, minWidth: 0 }}
            slotProps={{ textField: { size: 'small' }, field: { clearable: true } }}
          />
          <TextField
            size='small'
            label='Search'
            placeholder='Description, reference, voucher, amount…'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: { xs: '100%', sm: 280 }, flexGrow: 1, maxWidth: 480 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchOutlined fontSize='small' />
                </InputAdornment>
              ),
            }}
          />
          {filtersActive && (
            <Button
              size='small'
              onClick={() => {
                setDateFrom(null);
                setDateTo(null);
                setSearch('');
              }}
            >
              Clear filters
            </Button>
          )}
        </Box>

        <Paper variant='outlined'>
          <Tabs
            value={tab}
            onChange={(e, v) => setTab(v)}
            variant='scrollable'
            scrollButtons='auto'
            allowScrollButtonsMobile
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label={`Unmatched Statement Lines (${count(unmatched_lines, allUnmatchedLines)})`} />
            <Tab label={`Unmatched Book Entries (${count(unmatched_journals, allUnmatchedJournals)})`} />
            <Tab label={`Matched (${count(matched_lines, allMatchedLines)})`} />
            <Tab label={`Ignored (${count(ignored_lines, allIgnoredLines)})`} />
            <Tab label={`Outstanding (${count(outstanding_journals, allOutstandingJournals)})`} />
          </Tabs>

          {tab === 0 && (
            <Box sx={{ p: 2 }}>
              {unmatched_lines.length === 0 && (
                <Typography color='text.secondary'>{filtersActive ? 'Nothing matches the current filters.' : 'No unmatched statement lines.'}</Typography>
              )}
              {unmatched_lines.map((item: any) => (
                <UnmatchedLineRow
                  key={item.line.id}
                  bankAccountId={bankAccountId}
                  line={item.line}
                  suggestions={item.suggestions}
                  allUnmatchedJournals={allUnmatchedJournals}
                  bankAccountLedgerId={bankAccount?.ledger_id}
                  existingMatches={item.existing_matches}
                  remainingAmount={item.remaining_amount}
                  tolerance={tolerance}
                />
              ))}
            </Box>
          )}

          {tab === 1 && (
            <Box sx={{ p: 2 }}>
              {unmatched_journals.length === 0 && (
                <Typography color='text.secondary'>{filtersActive ? 'Nothing matches the current filters.' : 'No unmatched book entries.'}</Typography>
              )}
              {unmatched_journals.map((journal: any) => (
                <UnmatchedJournalRow
                  key={journal.id}
                  bankAccountId={bankAccountId}
                  journal={journal}
                  allUnmatchedLines={allUnmatchedLines}
                  bankAccountLedgerId={bankAccount?.ledger_id}
                  existingMatches={journal.existing_matches}
                  remainingAmount={journal.remaining_amount}
                  tolerance={tolerance}
                />
              ))}
            </Box>
          )}

          {tab === 2 && (
            <Box sx={{ p: 2 }}>
              {matched_lines.length === 0 && (
                <Typography color='text.secondary'>{filtersActive ? 'Nothing matches the current filters.' : 'No matched lines yet.'}</Typography>
              )}
              {matched_lines.map((matchedLine: any) => (
                <MatchedLineGroup
                  key={matchedLine.line.id}
                  bankAccountId={bankAccountId}
                  matchedLine={matchedLine}
                  suggestionDayTolerance={suggestion_day_tolerance}
                />
              ))}
            </Box>
          )}

          {tab === 3 && (
            <Box sx={{ p: 2 }}>
              {ignored_lines.length === 0 && (
                <Typography color='text.secondary'>{filtersActive ? 'Nothing matches the current filters.' : 'No ignored lines.'}</Typography>
              )}
              {ignored_lines.map((line: any) => (
                <Box key={line.id} sx={{ py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                  <Divider sx={{ mb: 1, width: '100%' }} />
                  <Typography variant='body2'>
                    {formatDate(line.line_date)} — {line.description} — {formatAmount(line.amount)}
                  </Typography>
                  {checkOrganizationPermission(PERMISSIONS.BANK_RECONCILIATION_EDIT) && (
                    <LoadingButton
                      size='small'
                      loading={unignoreMutation.isPending && unignoreMutation.variables === line.id}
                      onClick={() => unignoreMutation.mutate(line.id)}
                    >
                      Restore
                    </LoadingButton>
                  )}
                </Box>
              ))}
            </Box>
          )}

          {tab === 4 && (
            <Box sx={{ p: 2 }}>
              <Typography variant='caption' color='text.secondary' display='block' sx={{ mb: 1 }}>
                Book entries acknowledged as genuine timing differences (e.g. a cheque not yet presented, a deposit not yet credited) — excluded from the difference above until they clear on a future statement.
              </Typography>
              {outstanding_journals.length === 0 && (
                <Typography color='text.secondary'>{filtersActive ? 'Nothing matches the current filters.' : 'No outstanding book entries.'}</Typography>
              )}
              {outstanding_journals.map((journal: any) => (
                <Box key={journal.id} sx={{ py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                  <Divider sx={{ mb: 1, width: '100%' }} />
                  <Box>
                    <Typography variant='body2'>
                      {formatDate(journal.journal_date)} — {journal.description} — {formatAmount(journal.comparable_amount)}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      Marked outstanding by {journal.marked_by || 'unknown'} on {formatDate(journal.marked_at)}
                      {journal.outstanding_note ? ` — "${journal.outstanding_note}"` : ''}
                    </Typography>
                  </Box>
                  {checkOrganizationPermission(PERMISSIONS.BANK_RECONCILIATION_EDIT) && (
                    <LoadingButton
                      size='small'
                      loading={unmarkOutstandingMutation.isPending && unmarkOutstandingMutation.variables === journal.outstanding_item_id}
                      onClick={() => unmarkOutstandingMutation.mutate(journal.outstanding_item_id)}
                    >
                      Unmark
                    </LoadingButton>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      </Box>
    );
  }

  // The import dialog is always rendered at this same, single position in
  // the tree — regardless of which branch above produced `mainContent` —
  // so a successful import (which invalidates this query and flips `isError`
  // from true to false mid-interaction) never causes React to unmount the
  // dialog that's showing "Import Complete" and mount a fresh blank one in
  // its place. That remount is what previously looked like the dialog
  // reopening on its own right after a successful upload.
  return (
    <>
      {mainContent}
      <Dialog open={importDialogOpen} fullWidth maxWidth='sm' fullScreen={belowLargeScreen}>
        {importDialogOpen && (
          <ImportStatementDialog
            bankAccountId={bankAccountId}
            savedColumnMap={bankAccount?.column_map}
            toggleOpen={setImportDialogOpen}
            onImported={() => setSelectedStatementId(null)}
          />
        )}
      </Dialog>
    </>
  );
}
