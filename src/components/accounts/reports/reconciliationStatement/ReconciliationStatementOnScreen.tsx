'use client';

import React from 'react';
import {
  Alert,
  Box,
  Chip,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { formatDate } from '../../bankReconciliation/reconciliation/date-format';
import {
  balanceRows,
  describeEntryMatch,
  describeLineMatch,
  FLAG_ORDER,
  formatAmount,
  optionalAmount,
  statementBalancesText,
  statementStatusText,
  VIEW_LABELS,
} from './reconciliation-statement-helpers';

// On-screen flags keep their symbols; the PDF/Excel use plain words instead.
const FLAGS: Record<string, { label: string; color: 'success' | 'error' | 'warning' | 'default' | 'info' }> = {
  reconciled: { label: '✔ Reconciled', color: 'success' },
  unreconciled: { label: '✖ Unreconciled', color: 'error' },
  partial: { label: '◐ Partly matched', color: 'warning' },
  outstanding: { label: '◷ Outstanding', color: 'info' },
  ignored: { label: '○ Ignored', color: 'default' },
};

const FlagChip = ({ flag }: { flag: string }) => (
  <Chip size='small' variant='outlined' label={FLAGS[flag]?.label ?? flag} color={FLAGS[flag]?.color ?? 'default'} />
);

const Empty = () => <Typography color='text.secondary'>Nothing to show for this selection.</Typography>;

export default function ReconciliationStatementOnScreen({ reportData }: { reportData: any }) {
  const { theme } = useJumboTheme();
  // Phones get one card per row; wide screens get tables.
  const mobile = useMediaQuery(theme.breakpoints.down('md'));

  const accountName = [reportData.bank_account?.name, reportData.bank_account?.bank].filter(Boolean).join(' — ');

  const matchLines = (items: string[]) =>
    items.map((text, i) => (
      <Typography key={i} variant='caption' display='block' color='text.secondary' sx={{ overflowWrap: 'anywhere' }}>
        {text}
      </Typography>
    ));

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant='h5'>Reconciliation Statement</Typography>
        <Typography variant='body2' color='text.secondary'>
          {accountName} · {formatDate(reportData.from)} to {formatDate(reportData.to)} · {VIEW_LABELS[reportData.view]}
        </Typography>
      </Box>

      <Typography variant='subtitle2' sx={{ mb: 0.5 }}>
        Statements covered
      </Typography>
      {reportData.statements.length === 0 && (
        <Alert severity='info' sx={{ mb: 2 }}>
          No bank statement overlaps this period.
        </Alert>
      )}
      {reportData.statements.map((s: any) => (
        <Box key={s.id} sx={{ mb: 0.75 }}>
          <Typography variant='body2' sx={{ overflowWrap: 'anywhere' }}>
            {statementStatusText(s)}
          </Typography>
          <Typography variant='caption' color='text.secondary' display='block' sx={{ overflowWrap: 'anywhere' }}>
            {statementBalancesText(s)}
          </Typography>
        </Box>
      ))}

      {/* Opening / closing balances for the period: the bank's figure against the books'. */}
      <TableContainer component={Paper} variant='outlined' sx={{ mt: 2 }}>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell>Balances</TableCell>
              <TableCell align='right'>Bank</TableCell>
              <TableCell align='right'>Books</TableCell>
              <TableCell align='right'>Difference</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {balanceRows(reportData.balances).map((row) => (
              <TableRow key={row.label}>
                <TableCell>{row.label}</TableCell>
                <TableCell align='right'>{optionalAmount(row.bank)}</TableCell>
                <TableCell align='right'>{optionalAmount(row.books)}</TableCell>
                <TableCell
                  align='right'
                  sx={{ color: row.difference == null || Math.abs(row.difference) <= 0.05 ? 'text.primary' : 'error.main', fontWeight: 600 }}
                >
                  {optionalAmount(row.difference)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Summary: flags down the side so it fits a narrow screen too. */}
      <TableContainer component={Paper} variant='outlined' sx={{ my: 2 }}>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell>Whole period</TableCell>
              <TableCell align='right'>Bank lines</TableCell>
              <TableCell align='right'>Book entries</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {FLAG_ORDER.map((f) => (
              <TableRow key={f}>
                <TableCell>
                  <FlagChip flag={f} />
                </TableCell>
                <TableCell align='right'>
                  {reportData.totals.lines[f].count}
                  <Typography variant='caption' display='block' color='text.secondary'>
                    {formatAmount(reportData.totals.lines[f].amount)}
                  </Typography>
                </TableCell>
                <TableCell align='right'>
                  {reportData.totals.entries[f].count}
                  <Typography variant='caption' display='block' color='text.secondary'>
                    {formatAmount(reportData.totals.entries[f].amount)}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ---- Bank statement lines ---- */}
      <Typography variant='subtitle1' sx={{ mt: 2, mb: 0.5 }}>
        Bank statement lines ({reportData.lines.length})
      </Typography>
      {reportData.lines.length === 0 && <Empty />}
      {mobile ? (
        <Box sx={{ mb: 3 }}>
          {reportData.lines.map((line: any) => (
            <Paper key={line.id} variant='outlined' sx={{ p: 1.5, mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'baseline' }}>
                <Typography variant='caption' color='text.secondary'>
                  {formatDate(line.line_date)}
                </Typography>
                <Typography variant='subtitle2'>{formatAmount(line.amount)}</Typography>
              </Box>
              <Typography variant='body2' sx={{ my: 0.5, overflowWrap: 'anywhere' }}>
                {line.description}
              </Typography>
              <FlagChip flag={line.flag} />
              {line.matches.length > 0 && <Divider sx={{ my: 1 }} />}
              {matchLines(line.matches.map(describeLineMatch))}
            </Paper>
          ))}
        </Box>
      ) : (
        reportData.lines.length > 0 && (
          <TableContainer component={Paper} variant='outlined' sx={{ mb: 3 }}>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align='right'>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Matched to</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.lines.map((line: any) => (
                  <TableRow key={line.id}>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(line.line_date)}</TableCell>
                    <TableCell>{line.description}</TableCell>
                    <TableCell align='right'>{formatAmount(line.amount)}</TableCell>
                    <TableCell>
                      <FlagChip flag={line.flag} />
                    </TableCell>
                    <TableCell>{matchLines(line.matches.map(describeLineMatch))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )
      )}

      {/* ---- Book entries ---- */}
      <Typography variant='subtitle1' sx={{ mb: 0.5 }}>
        Book entries ({reportData.entries.length})
      </Typography>
      {reportData.entries.length === 0 && <Empty />}
      {mobile ? (
        <Box>
          {reportData.entries.map((entry: any) => (
            <Paper key={entry.id} variant='outlined' sx={{ p: 1.5, mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'baseline' }}>
                <Typography variant='caption' color='text.secondary'>
                  {formatDate(entry.journal_date)} · {entry.voucher_no}
                </Typography>
                <Typography variant='subtitle2'>{formatAmount(entry.amount)}</Typography>
              </Box>
              <Typography variant='body2' sx={{ my: 0.5, overflowWrap: 'anywhere' }}>
                {[entry.description, entry.counterparty].filter(Boolean).join(' — ')}
              </Typography>
              <FlagChip flag={entry.flag} />
              {entry.flag === 'partial' && (
                <Typography variant='caption' display='block'>
                  {formatAmount(entry.remaining_amount)} not yet matched
                </Typography>
              )}
              {entry.lines.length > 0 && <Divider sx={{ my: 1 }} />}
              {matchLines(entry.lines.map(describeEntryMatch))}
            </Paper>
          ))}
        </Box>
      ) : (
        reportData.entries.length > 0 && (
          <TableContainer component={Paper} variant='outlined'>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Voucher</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align='right'>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Matched lines</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.entries.map((entry: any) => (
                  <TableRow key={entry.id}>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(entry.journal_date)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{entry.voucher_no}</TableCell>
                    <TableCell>{[entry.description, entry.counterparty].filter(Boolean).join(' — ')}</TableCell>
                    <TableCell align='right'>{formatAmount(entry.amount)}</TableCell>
                    <TableCell>
                      <FlagChip flag={entry.flag} />
                      {entry.flag === 'partial' && (
                        <Typography variant='caption' display='block'>
                          {formatAmount(entry.remaining_amount)} not yet matched
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{matchLines(entry.lines.map(describeEntryMatch))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )
      )}
    </Box>
  );
}
