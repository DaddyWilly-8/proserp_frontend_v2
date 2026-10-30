import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { Box, Chip, Divider, Stack, TableCell, TableRow, Tooltip, Typography } from '@mui/material';
import dayjs from 'dayjs';
import React from 'react';
import RecurringTransactionItemAction from './RecurringTransactionItemAction';

const fmt = (amount: number) =>
  (amount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const STATUS_COLOR: Record<string, 'success' | 'warning' | 'default'> = {
  active: 'success',
  paused: 'warning',
  completed: 'default',
};

interface RecurringTransactionListItemProps {
  schedule: any;
  view?: 'list' | 'grid' | 'table';
}

const Field = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <Stack direction="row" spacing={1.5} justifyContent="space-between" alignItems="flex-start">
    <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
      {label}
    </Typography>
    <Typography variant="body2" textAlign="right">
      {value || '-'}
    </Typography>
  </Stack>
);

const RecurringTransactionListItem: React.FC<RecurringTransactionListItemProps> = ({ schedule, view }) => {
  const dictionary = useDictionary();
  const t = dictionary.recurringTransactions;

  const every = `${schedule.repeat_every} ${(t.form.units as Record<string, string>)[schedule.frequency]}`;
  const next = schedule.next_run_date ? dayjs(schedule.next_run_date).format('DD MMM YYYY') : null;
  const progress = schedule.max_occurrences
    ? `${schedule.occurrences_count} / ${schedule.max_occurrences}`
    : `${schedule.occurrences_count}`;

  // A schedule that failed to post keeps its error on the row so it is
  // noticed without opening it.
  const status = (
    <Stack direction="row" spacing={0.5} alignItems="center">
      <Chip size="small" color={STATUS_COLOR[schedule.status]} label={(t.list.status as Record<string, string>)[schedule.status]} />
      {schedule.last_error && (
        <Tooltip title={schedule.last_error}>
          <Chip size="small" color="error" label={t.list.labels.failed} />
        </Tooltip>
      )}
    </Stack>
  );

  if (view === 'table') {
    return (
      <TableRow
        hover
        sx={{ '& td, & th': { border: '1px solid', borderColor: 'divider', py: 1.5, px: 2, verticalAlign: 'top' } }}
      >
        <TableCell>
          <Typography variant="body2" fontWeight={500}>{schedule.name}</Typography>
          <Typography variant="caption" color="text.secondary">{(t.list.types as Record<string, string>)[schedule.transaction_type]}</Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">{every}</Typography>
          <Typography variant="caption" color="text.secondary">
            {schedule.amount_mode === 'total' ? t.form.labels.total : t.form.labels.fixed}
          </Typography>
        </TableCell>
        <TableCell align="right">
          <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(schedule.amount)}</Typography>
        </TableCell>
        <TableCell>{next ?? '-'}</TableCell>
        <TableCell>{progress}</TableCell>
        <TableCell>{status}</TableCell>
        <TableCell align="right">
          <RecurringTransactionItemAction schedule={schedule} />
        </TableCell>
      </TableRow>
    );
  }

  return (
    <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" fontWeight={600}>{schedule.name}</Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            {(t.list.types as Record<string, string>)[schedule.transaction_type]}
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
          {status}
          <RecurringTransactionItemAction schedule={schedule} />
        </Stack>
      </Stack>
      <Divider sx={{ my: 1 }} />
      <Stack spacing={0.75}>
        <Field label={t.list.labels.schedule} value={every} />
        <Field label={t.list.labels.amount} value={fmt(schedule.amount)} />
        <Field label={t.list.labels.next} value={next} />
        <Field label={t.list.labels.progress} value={progress} />
      </Stack>
    </Box>
  );
};

export default RecurringTransactionListItem;
