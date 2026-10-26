import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import recurringTransactionServices from './recurringTransactions-services';

const fmt = (amount: number) =>
  (amount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface RecurringTransactionViewDialogContentProps {
  scheduleId: number;
  onClose: () => void;
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

const RecurringTransactionViewDialogContent: React.FC<RecurringTransactionViewDialogContentProps> = ({ scheduleId, onClose }) => {
  const dictionary = useDictionary();
  const t = dictionary.recurringTransactions;
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { checkOrganizationPermission } = useJumboAuth();
  const [cancelRun, setCancelRun] = useState<any>(null);
  const [reason, setReason] = useState('');

  const { data: schedule } = useQuery({
    queryKey: ['recurringTransaction', scheduleId],
    queryFn: () => recurringTransactionServices.show(scheduleId),
  });

  const cancelOccurrence = useMutation({
    mutationFn: () => recurringTransactionServices.cancelOccurrence({ id: scheduleId, runId: cancelRun.id, reason }),
    onSuccess: (data: any) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      setCancelRun(null);
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['recurringTransaction', scheduleId] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error: any) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const canCancel = checkOrganizationPermission([PERMISSIONS.RECURRING_TRANSACTIONS_CANCEL_OCCURRENCE]);

  if (!schedule) {
    return (
      <>
        <DialogTitle>{t.view.title}</DialogTitle>
        <DialogContent>
          <Skeleton variant="rectangular" height={240} />
        </DialogContent>
      </>
    );
  }

  const payload = schedule.payload;
  const every = `${schedule.repeat_every} ${t.form.units[schedule.frequency]}`;
  const progress = schedule.max_occurrences
    ? `${schedule.occurrences_count} / ${schedule.max_occurrences}`
    : `${schedule.occurrences_count}`;

  return (
    <>
      <DialogTitle>{schedule.name}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          {schedule.last_error && (
            <Alert severity="error">
              {t.view.labels.lastError}: {schedule.last_error}
            </Alert>
          )}

          <Stack spacing={0.75}>
            <Field label={t.list.labels.type} value={t.list.types[schedule.transaction_type]} />
            <Field label={t.list.labels.status} value={<Chip size="small" label={t.list.status[schedule.status]} />} />
            <Field label={t.form.labels.amountMode} value={schedule.amount_mode === 'total' ? t.form.labels.total : t.form.labels.fixed} />
            <Field label={t.view.labels.repeats} value={every} />
            <Field label={t.form.labels.startDate} value={dayjs(schedule.start_date).format('DD MMM YYYY')} />
            <Field label={t.form.labels.postTime} value={(schedule.post_time ?? '00:00').slice(0, 5)} />
            <Field label={schedule.amount_mode === 'total' ? t.form.labels.periods : t.form.labels.ends} value={
              schedule.end_date ? dayjs(schedule.end_date).format('DD MMM YYYY') : schedule.max_occurrences ?? t.form.labels.never
            } />
            <Field label={t.list.labels.next} value={schedule.next_run_date ? dayjs(schedule.next_run_date).format('DD MMM YYYY') : null} />
            <Field label={t.list.labels.progress} value={progress} />
            <Field label={t.view.labels.narration} value={payload.narration} />
          </Stack>

          <Divider />
          <Typography variant="subtitle2">{t.view.labels.lines}</Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t.view.labels.debit}</TableCell>
                  <TableCell>{t.view.labels.credit}</TableCell>
                  <TableCell>{t.view.labels.description}</TableCell>
                  <TableCell align="right">
                    {schedule.amount_mode === 'total' ? t.view.labels.totalAmount : t.view.labels.amount}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payload.items.map((item: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{item.debit_ledger_name}</TableCell>
                    <TableCell>{item.credit_ledger_name}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(item.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Divider />
          <Typography variant="subtitle2">{t.view.labels.history}</Typography>
          {schedule.runs.length === 0 ? (
            <Typography variant="body2" color="text.secondary">{t.view.labels.noRuns}</Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>{t.view.labels.date}</TableCell>
                    <TableCell>{t.view.labels.voucher}</TableCell>
                    <TableCell>{t.list.labels.status}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schedule.runs.map((run: any) => (
                    <TableRow key={run.id}>
                      <TableCell>{run.occurrence_no}</TableCell>
                      <TableCell>{dayjs(run.scheduled_date).format('DD MMM YYYY')}</TableCell>
                      <TableCell>{run.voucherNo ?? '-'}</TableCell>
                      <TableCell>
                        {run.status === 'failed' ? (
                          <Chip size="small" color="error" label={t.view.runStatus.failed} title={run.error} />
                        ) : run.cancelled_at ? (
                          <Chip size="small" label={t.view.runStatus.cancelled} />
                        ) : (
                          <Chip size="small" color="success" label={t.view.runStatus.posted} />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {canCancel && run.status === 'posted' && !run.cancelled_at && (
                          <Button size="small" color="error" onClick={() => setCancelRun(run)}>
                            {t.view.buttons.cancelOccurrence}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button size="small" onClick={onClose}>{t.view.buttons.close}</Button>
      </DialogActions>

      <Dialog open={!!cancelRun} onClose={() => setCancelRun(null)} fullWidth maxWidth="xs">
        <DialogTitle>{t.view.cancelDialog.title.replace('{voucherNo}', cancelRun?.voucherNo ?? '')}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary" mb={1.5}>{t.view.cancelDialog.content}</Typography>
            <TextField
              fullWidth
              multiline
              minRows={2}
              size="small"
              label={t.view.cancelDialog.reason}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button size="small" onClick={() => setCancelRun(null)}>{t.form.buttons.cancel}</Button>
          <LoadingButton
            size="small"
            color="error"
            variant="contained"
            loading={cancelOccurrence.isPending}
            disabled={!reason.trim()}
            onClick={() => cancelOccurrence.mutate()}
          >
            {t.view.buttons.confirmCancel}
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default RecurringTransactionViewDialogContent;
