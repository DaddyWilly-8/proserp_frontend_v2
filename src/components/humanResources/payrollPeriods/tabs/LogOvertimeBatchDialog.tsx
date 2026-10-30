'use client';

import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { AddCircleOutline, DeleteOutline } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Autocomplete,
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
import { DatePicker } from '@mui/x-date-pickers';
import { useMutation, useQuery } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import EmployeeSelector from '../../employees/EmployeeSelector';
import { EmployeesProvider } from '../../employees/EmployeesProvider';
import { Employee } from '../../employees/EmployeesType';
import humanResourcesServices from '../../humanResourcesServices';

interface OvertimeType {
  id: number;
  name: string;
  multiplier: number;
}

interface Row {
  key: number;
  employee: Employee | null;
  overtimeType: OvertimeType | null;
  date: string;
  hours: number | '';
  remarks: string;
}

interface BatchResult {
  message: string;
  imported: number;
  skipped: number;
  errors: Array<{ row: number; error: string }>;
}

interface LogOvertimeBatchDialogProps {
  open: boolean;
  onClose: () => void;
  payrollPeriodId: number;
  periodStart: Dayjs;
  periodEnd: Dayjs;
  defaultDate: string;
  monthName: string | number;
  year: number;
  onSaved: () => void;
}

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

const LogOvertimeBatchDialog = ({
  open,
  onClose,
  payrollPeriodId,
  periodStart,
  periodEnd,
  defaultDate,
  monthName,
  year,
  onSaved,
}: LogOvertimeBatchDialogProps) => {
  const dictionary = useDictionary();
  const t = dictionary.humanResources.payrollPeriods;
  const theme = useTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const { enqueueSnackbar } = useSnackbar();

  const emptyRow = (key: number): Row => ({
    key,
    employee: null,
    overtimeType: null,
    date: defaultDate,
    hours: '',
    remarks: '',
  });

  const [nextKey, setNextKey] = useState(1);
  const [rows, setRows] = useState<Row[]>([emptyRow(0)]);
  const [result, setResult] = useState<BatchResult | null>(null);

  const { data: overtimeTypesResponse } = useQuery({
    queryKey: ['overtimeTypesForBatch'],
    queryFn: () => humanResourcesServices.getOvertimeTypesList({ limit: 200 }),
    enabled: open,
  });
  const overtimeTypes: OvertimeType[] = overtimeTypesResponse?.data || [];

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
    mutationFn: (payload: any) => humanResourcesServices.addPeriodOvertimeBatch(payload),
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
    (r) => r.employee && r.overtimeType && r.date && r.hours !== '' && Number(r.hours) > 0
  );
  const canSave = validRows.length === rows.length && rows.length > 0;

  const handleSave = () => {
    if (!canSave) return;

    saveMutation.mutate({
      payroll_period_id: payrollPeriodId,
      rows: rows.map((r) => ({
        employee_id: r.employee!.id,
        overtime_type_id: r.overtimeType!.id,
        date: dayjs(r.date).format('YYYY-MM-DD'),
        hours: Number(r.hours),
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
      <DialogTitle>{t.batchDialogs.logOvertimeTitle}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <Typography variant='body2' color='text.secondary'>
            {t.batchDialogs.intro
              .replace('{month}', String(monthName))
              .replace('{year}', String(year))}
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
                        <Autocomplete
                          options={overtimeTypes}
                          isOptionEqualToValue={(option, value) => option.id === value.id}
                          getOptionLabel={(option) =>
                            `${option.name} (${Number(option.multiplier).toFixed(2)}x)`
                          }
                          value={row.overtimeType}
                          onChange={(_event, newValue) =>
                            updateRow(row.key, { overtimeType: newValue })
                          }
                          renderInput={(params) => (
                            <TextField {...params} label={t.batchDialogs.overtimeType} />
                          )}
                        />
                      </Grid>
                    </Grid>

                    <Grid container spacing={2.5}>
                      <Grid size={{ xs: 12, sm: 5 }}>
                        <DatePicker
                          label={t.common.date}
                          value={row.date ? dayjs(row.date) : null}
                          onChange={(newValue) =>
                            updateRow(row.key, {
                              date: newValue ? newValue.toISOString() : '',
                            })
                          }
                          minDate={periodStart}
                          maxDate={periodEnd}
                          slotProps={{ textField: { fullWidth: true } }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <TextField
                          label={t.batchDialogs.hours}
                          fullWidth
                          type='number'
                          value={row.hours}
                          onChange={(e) =>
                            updateRow(row.key, {
                              hours: e.target.value === '' ? '' : Number(e.target.value),
                            })
                          }
                          inputProps={{ min: 0.25, step: 0.25 }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                          label={t.common.remarks}
                          fullWidth
                          value={row.remarks}
                          onChange={(e) =>
                            updateRow(row.key, { remarks: e.target.value })
                          }
                          placeholder={t.common.optional}
                        />
                      </Grid>
                    </Grid>
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

export default LogOvertimeBatchDialog;
