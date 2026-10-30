'use client';

import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { AddCircleOutline, DeleteOutline } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import EmployeeSelector from '../../employees/EmployeeSelector';
import { EmployeesProvider } from '../../employees/EmployeesProvider';
import { Employee } from '../../employees/EmployeesType';
import humanResourcesServices from '../../humanResourcesServices';

interface Row {
  key: number;
  employee: Employee | null;
  amount: number | '';
  remarks: string;
}

interface BatchResult {
  message: string;
  imported: number;
  skipped: number;
  errors: Array<{ row: number; error: string }>;
}

interface AddAdvancesBatchDialogProps {
  open: boolean;
  onClose: () => void;
  payrollPeriodId: number;
  onSaved: () => void;
}

const emptyRow = (key: number): Row => ({
  key,
  employee: null,
  amount: '',
  remarks: '',
});

const getErrorMessage = (error: any, fallback: string) => {
  const validationErrors = error?.response?.data?.validation_errors;
  if (validationErrors && typeof validationErrors === 'object') {
    const first = Object.values(validationErrors)[0] as any;
    return Array.isArray(first) ? first[0] : String(first);
  }
  return (
    error?.response?.data?.message || error?.message || fallback
  );
};

/**
 * Manual, one-row-per-employee alternative to the Excel upload — same
 * two-table effect server-side (a PayrollPeriodAdvance row plus a matching
 * "Salary Advance" PayrollPeriodDeduction row for automatic recovery), just
 * for a handful of advances that don't warrant downloading/filling a
 * spreadsheet. Mirrors AddAdjustmentsBatchDialog.tsx's layout.
 */
const AddAdvancesBatchDialog = ({
  open,
  onClose,
  payrollPeriodId,
  onSaved,
}: AddAdvancesBatchDialogProps) => {
  const dictionary = useDictionary();
  const t = dictionary.humanResources.payrollPeriods;
  const theme = useTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const { enqueueSnackbar } = useSnackbar();

  const [nextKey, setNextKey] = useState(1);
  const [rows, setRows] = useState<Row[]>([emptyRow(0)]);
  const [result, setResult] = useState<BatchResult | null>(null);

  const reset = () => {
    setRows([emptyRow(0)]);
    setNextKey(1);
    setResult(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const addRow = () => {
    setRows((prev) => [...prev, emptyRow(nextKey)]);
    setNextKey((k) => k + 1);
  };

  const removeRow = (key: number) => {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev));
  };

  const updateRow = (key: number, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const saveMutation = useMutation({
    mutationFn: (payload: any) =>
      humanResourcesServices.addPeriodAdvanceBatch(payload),
    onSuccess: (response: any) => {
      const data = response?.data || response;
      setResult(data);
      onSaved();

      if (data.skipped > 0) {
        enqueueSnackbar(data.message, { variant: 'warning' });
      } else {
        enqueueSnackbar(data.message, { variant: 'success' });
        handleClose();
      }
    },
    onError: (error: any) => {
      enqueueSnackbar(getErrorMessage(error, t.batchDialogs.somethingWentWrong), {
        variant: 'error',
      });
    },
  });

  const validRows = rows.filter(
    (r) => r.employee && r.amount !== '' && Number(r.amount) > 0
  );
  const canSave = validRows.length === rows.length && rows.length > 0;

  const handleSave = () => {
    if (!canSave) return;

    saveMutation.mutate({
      payroll_period_id: payrollPeriodId,
      rows: rows.map((r) => ({
        employee_id: r.employee!.id,
        amount: Number(r.amount),
        remarks: r.remarks || undefined,
      })),
    });
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='md'
      fullWidth
      fullScreen={belowLargeScreen}
      scroll={belowLargeScreen ? 'body' : 'paper'}
    >
      <DialogTitle>{t.advances.add.title}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <Typography variant='body2' color='text.secondary'>
            {t.advances.add.intro}
          </Typography>

          {result && (
            <Alert
              severity={result.skipped > 0 ? 'warning' : 'success'}
              sx={{ borderRadius: 2 }}
            >
              <Typography variant='body2' fontWeight={600} gutterBottom>
                {result.message}
              </Typography>
              {result.errors?.map((err, idx) => (
                <Typography key={idx} variant='caption' display='block'>
                  {t.batchDialogs.rowError
                    .replace('{row}', String(err.row))
                    .replace('{error}', String(err.error))}
                </Typography>
              ))}
            </Alert>
          )}

          <EmployeesProvider>
            <Stack spacing={3}>
              {rows.map((row, idx) => (
                <Paper
                  key={row.key}
                  variant='outlined'
                  sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}
                >
                  <Stack spacing={2.5}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Typography variant='subtitle2' color='text.secondary'>
                        {t.batchDialogs.row.replace('{n}', String(idx + 1))}
                      </Typography>
                      <IconButton
                        color='error'
                        onClick={() => removeRow(row.key)}
                        disabled={rows.length === 1}
                      >
                        <DeleteOutline />
                      </IconButton>
                    </Box>

                    <Grid container spacing={2.5}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <EmployeeSelector
                          value={row.employee || undefined}
                          onChange={(newValue) =>
                            updateRow(row.key, {
                              employee:
                                newValue && !Array.isArray(newValue) ? newValue : null,
                            })
                          }
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          label={t.common.amount}
                          fullWidth
                          value={row.amount}
                          onChange={(e) => {
                            const sanitized = sanitizedNumber(e.target.value);
                            updateRow(row.key, {
                              amount: Number.isNaN(sanitized) ? '' : sanitized,
                            });
                          }}
                          InputProps={{ inputComponent: CommaSeparatedField as any }}
                        />
                      </Grid>
                    </Grid>

                    <TextField
                      label={t.common.remarks}
                      fullWidth
                      value={row.remarks}
                      onChange={(e) =>
                        updateRow(row.key, { remarks: e.target.value })
                      }
                      placeholder={t.common.optional}
                    />
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </EmployeesProvider>

          <Button
            variant='outlined'
            startIcon={<AddCircleOutline />}
            onClick={addRow}
            sx={{
              alignSelf: { xs: 'stretch', sm: 'flex-start' },
              borderRadius: 2,
              textTransform: 'none',
              py: 1,
            }}
          >
            {t.batchDialogs.addRow}
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t.common.close}</Button>
        <LoadingButton
          onClick={handleSave}
          variant='contained'
          loading={saveMutation.isPending}
          disabled={!canSave}
        >
          {rows.length > 1
            ? t.batchDialogs.saveRows.replace('{count}', String(rows.length))
            : t.batchDialogs.saveRow}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default AddAdvancesBatchDialog;
