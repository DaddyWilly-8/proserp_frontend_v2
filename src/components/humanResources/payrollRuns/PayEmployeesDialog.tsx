// components/humanResources/payrollRuns/PayEmployeesDialog.tsx
'use client';

import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useEffect, useMemo, useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

type PayBalanceRow = {
  payslip_id: number;
  employee_id: number;
  employee_number: string;
  name: string;
  net_salary: number;
  paid_amount: number;
  balance_remaining: number;
};

/**
 * Shared by both PayrollRunActions and PayrollRunItemAction (the two places a
 * payroll run's actions are rendered). Two modes:
 *  - "Pay everyone in full": the simple, original one-shot behaviour — omits
 *    payslip_payments entirely, letting the backend default to full payment.
 *  - "Pay selected amounts": pick specific employees and (optionally partial)
 *    amounts, submitted as payslip_payments — repeatable across multiple
 *    payments until each employee is fully settled.
 */
const PayEmployeesDialog = ({
  open,
  onClose,
  payrollRunId,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  payrollRunId: number;
  onSuccess?: () => void;
}) => {
  const dictionary = useDictionary();
  const t = dictionary.humanResources.payrollRuns.payEmployees;
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const [mode, setMode] = useState<'full' | 'partial'>('full');
  const [creditLedgerId, setCreditLedgerId] = useState(0);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [amounts, setAmounts] = useState<Record<number, string>>({});
  const [transactionDate, setTransactionDate] = useState(
    dayjs().toISOString()
  );

  const { data, isLoading } = useQuery({
    queryKey: ['payrollRunPayBalances', payrollRunId],
    queryFn: () => humanResourcesServices.payrollRunPayBalances(payrollRunId),
    enabled: open,
  });

  const rows: PayBalanceRow[] = data?.rows || [];
  const payableRows = useMemo(
    () => rows.filter((row) => row.balance_remaining > 0),
    [rows]
  );

  // Reset selection/amounts to "everything owing, in full" whenever the
  // dialog opens or the balances refresh — a sensible starting point for
  // partial mode, editable from there.
  useEffect(() => {
    if (!open) return;
    setTransactionDate(dayjs().toISOString());
  }, [open]);

  useEffect(() => {
    if (!open || payableRows.length === 0) return;
    const nextSelected: Record<number, boolean> = {};
    const nextAmounts: Record<number, string> = {};
    payableRows.forEach((row) => {
      nextSelected[row.payslip_id] = true;
      nextAmounts[row.payslip_id] = String(row.balance_remaining);
    });
    setSelected(nextSelected);
    setAmounts(nextAmounts);
  }, [open, data]); // eslint-disable-line react-hooks/exhaustive-deps

  const { mutate: pay, isPending } = useMutation({
    mutationFn: () => {
      const payload: {
        credit_ledger_id: number;
        payslip_payments?: any[];
        transaction_date?: string;
      } = {
        credit_ledger_id: creditLedgerId,
        transaction_date: transactionDate || undefined,
      };
      if (mode === 'partial') {
        payload.payslip_payments = payableRows
          .filter((row) => selected[row.payslip_id])
          .map((row) => ({
            payslip_id: row.payslip_id,
            amount: Number(amounts[row.payslip_id] || 0),
          }))
          .filter((entry) => entry.amount > 0);
      }
      return humanResourcesServices.payPayrollRun({
        id: payrollRunId,
        ...payload,
      });
    },
    onSuccess: (response: any) => {
      enqueueSnackbar(response?.message || t.recorded, {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
      queryClient.invalidateQueries({ queryKey: ['showPayrollRun', payrollRunId] });
      queryClient.invalidateQueries({
        queryKey: ['payrollRunsForPeriod'],
      });
      queryClient.invalidateQueries({
        queryKey: ['payrollRunPayBalances', payrollRunId],
      });
      onSuccess?.();
      onClose();
    },
    onError: (error: any) =>
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const allSelected =
    payableRows.length > 0 &&
    payableRows.every((row) => selected[row.payslip_id]);
  const someSelected = payableRows.some((row) => selected[row.payslip_id]);

  const handleToggleSelectAll = (checked: boolean) => {
    setSelected((state) => {
      const next = { ...state };
      payableRows.forEach((row) => {
        next[row.payslip_id] = checked;
      });
      return next;
    });
  };

  const partialTotal = payableRows
    .filter((row) => selected[row.payslip_id])
    .reduce((sum, row) => sum + Number(amounts[row.payslip_id] || 0), 0);

  const isValid =
    creditLedgerId > 0 &&
    (mode === 'full' ||
      payableRows.some(
        (row) => selected[row.payslip_id] && Number(amounts[row.payslip_id]) > 0
      ));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth='sm'
      fullScreen={belowLargeScreen}
      scroll={belowLargeScreen ? 'body' : 'paper'}
    >
      <DialogTitle>
        <Typography variant='h6' component='div' fontWeight={600}>
          {t.title}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <ToggleButtonGroup
            value={mode}
            exclusive
            size='small'
            onChange={(_e, value) => value && setMode(value)}
          >
            <ToggleButton value='full'>{t.payInFull}</ToggleButton>
            <ToggleButton value='partial'>{t.paySelected}</ToggleButton>
          </ToggleButtonGroup>

          <LedgerSelect
            label={t.bankOrCash}
            onChange={(ledger: any) => setCreditLedgerId(ledger?.id || 0)}
          />

          <DateTimePicker
            label={t.paymentDate}
            value={transactionDate ? dayjs(transactionDate) : null}
            onChange={(val) =>
              setTransactionDate(val?.toISOString() || '')
            }
            slotProps={{
              textField: { size: 'small', fullWidth: true },
            }}
          />

          {isLoading ? (
            <Box display='flex' justifyContent='center' py={3}>
              <CircularProgress size={26} />
            </Box>
          ) : payableRows.length === 0 ? (
            <Alert severity='success'>
              {t.allPaid}
            </Alert>
          ) : mode === 'full' ? (
            <Alert severity='info'>
              {t.fullInfo
                .replace('{count}', String(payableRows.length))
                .replace(
                  '{employees}',
                  payableRows.length > 1
                    ? t.employeePlural
                    : t.employeeSingular
                )
                .replace(
                  '{total}',
                  payableRows
                    .reduce((sum, row) => sum + row.balance_remaining, 0)
                    .toLocaleString()
                )}
            </Alert>
          ) : (
            <>
              <Stack direction='row' spacing={1} justifyContent='flex-end'>
                <Button
                  size='small'
                  onClick={() => handleToggleSelectAll(true)}
                  disabled={allSelected}
                >
                  {t.selectAll}
                </Button>
                <Button
                  size='small'
                  onClick={() => handleToggleSelectAll(false)}
                  disabled={!someSelected}
                >
                  {t.selectNone}
                </Button>
              </Stack>
              <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size='small' sx={{ minWidth: 480 }}>
                <TableHead>
                  <TableRow>
                    <TableCell padding='checkbox'>
                      <Checkbox
                        size='small'
                        checked={allSelected}
                        indeterminate={someSelected && !allSelected}
                        onChange={(e) => handleToggleSelectAll(e.target.checked)}
                      />
                    </TableCell>
                    <TableCell>{t.employee}</TableCell>
                    <TableCell align='right'>{t.remaining}</TableCell>
                    <TableCell align='right' width={140}>
                      {t.amountToPay}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payableRows.map((row) => (
                    <TableRow key={row.payslip_id} hover>
                      <TableCell padding='checkbox'>
                        <Checkbox
                          size='small'
                          checked={!!selected[row.payslip_id]}
                          onChange={(e) =>
                            setSelected((state) => ({
                              ...state,
                              [row.payslip_id]: e.target.checked,
                            }))
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2' noWrap>
                          {row.name}
                        </Typography>
                        <Typography variant='caption' color='text.secondary' noWrap component='div'>
                          {row.employee_number}
                          {row.paid_amount > 0 && (
                            <Chip
                              label={t.alreadyPaid.replace(
                                '{amount}',
                                row.paid_amount.toLocaleString()
                              )}
                              size='small'
                              variant='outlined'
                              color='info'
                              sx={{ ml: 1, height: 18, fontSize: 10 }}
                            />
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell align='right'>
                        {row.balance_remaining.toLocaleString()}
                      </TableCell>
                      <TableCell align='right'>
                        <TextField
                          size='small'
                          sx={{ minWidth: 110 }}
                          value={amounts[row.payslip_id] ?? ''}
                          disabled={!selected[row.payslip_id]}
                          InputProps={{
                            inputComponent: CommaSeparatedField as any,
                            inputProps: { style: { textAlign: 'right' } },
                          }}
                          onChange={(e) => {
                            const val =
                              e.target.value === ''
                                ? ''
                                : sanitizedNumber(e.target.value);
                            setAmounts((state) => ({
                              ...state,
                              [row.payslip_id]:
                                val === '' || isNaN(val as number)
                                  ? ''
                                  : String(val),
                            }));
                          }}
                          error={
                            Number(amounts[row.payslip_id]) >
                            row.balance_remaining
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </TableContainer>
              <Divider />
              <Stack direction='row' justifyContent='flex-end'>
                <Typography variant='body2' fontWeight={600}>
                  {t.totalThisPayment.replace(
                    '{amount}',
                    partialTotal.toLocaleString()
                  )}
                </Typography>
              </Stack>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant='outlined' size='small' disabled={isPending}>
          {t.cancel}
        </Button>
        <Button
          variant='contained'
          color='success'
          size='small'
          onClick={() => pay()}
          disabled={isPending || !isValid || payableRows.length === 0}
        >
          {isPending ? <CircularProgress size={18} /> : t.pay}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PayEmployeesDialog;
