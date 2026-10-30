'use client';

import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Box,
  Button,
  DialogActions,
  DialogContent,
  Grid,
  MenuItem,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import { UploadOutlined } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import dayjs, { Dayjs } from 'dayjs';
import React, { useState } from 'react';
import bankReconciliationServices from '../bank-reconciliation-services';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface ColumnMap {
  date?: number;
  description?: number;
  reference?: number;
  amount?: number;
  debit?: number;
  credit?: number;
  balance?: number;
}

interface Props {
  bankAccountId: number;
  savedColumnMap?: ColumnMap | null;
  toggleOpen: (open: boolean) => void;
  onImported?: () => void;
}

// Keys into dictionary.forms.bankReconciliation.importStatement.fieldLabels
const FIELD_KEYS: Array<keyof ColumnMap> = [
  'date',
  'description',
  'reference',
  'amount',
  'debit',
  'credit',
  'balance',
];

const sanitizedNumber = (value: string): string => {
  const parsed = parseFloat(value.replace(/,/g, ''));
  return Number.isNaN(parsed) ? '' : String(parsed);
};

export default function ImportStatementDialog({ bankAccountId, savedColumnMap, toggleOpen, onImported }: Props) {
  const dictionary = useDictionary();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [header, setHeader] = useState<string[]>([]);
  const [columnMap, setColumnMap] = useState<ColumnMap>(savedColumnMap || {});
  const [hasHeaderRow, setHasHeaderRow] = useState(true);
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(null);
  const [dateTo, setDateTo] = useState<Dayjs | null>(null);
  const [openingBalance, setOpeningBalance] = useState<string>('');
  const [closingBalance, setClosingBalance] = useState<string>('');
  const [importResult, setImportResult] = useState<any>(null);

  const previewMutation = useMutation({
    mutationFn: (uploadedFile: File) => {
      const formData = new FormData();
      formData.append('statement_file', uploadedFile);
      return bankReconciliationServices.previewColumns(formData);
    },
    onSuccess: (data) => {
      setHeader(data.header || []);
      setActiveStep(1);
    },
    onError: (err: any) => enqueueSnackbar(getErrorMessage(err), { variant: 'error' }),
  });

  const importMutation = useMutation({
    mutationFn: () => {
      const formData = new FormData();
      formData.append('statement_file', file as File);
      formData.append('has_header_row', hasHeaderRow ? '1' : '0');
      formData.append('statement_date_from', dateFrom!.format('YYYY-MM-DD'));
      formData.append('statement_date_to', dateTo!.format('YYYY-MM-DD'));
      formData.append('opening_balance', openingBalance);
      formData.append('closing_balance', closingBalance);
      Object.entries(columnMap).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== ('' as any)) {
          formData.append(`column_map[${key}]`, String(value));
        }
      });
      return bankReconciliationServices.importStatement(bankAccountId, formData);
    },
    onSuccess: (data) => {
      setImportResult(data);
      queryClient.invalidateQueries({ queryKey: ['bank-reconciliation-workspace', bankAccountId] });
      queryClient.invalidateQueries({ queryKey: ['bank-statements-list', bankAccountId] });
      queryClient.invalidateQueries({ queryKey: ['bank-accounts-list'] });
      onImported?.();
      enqueueSnackbar(data.message || dictionary.forms.bankReconciliation.importStatement.messages.success, { variant: 'success' });
    },
    onError: (err: any) => enqueueSnackbar(getErrorMessage(err), { variant: 'error' }),
  });

  const canProceedToMapping = file && dateFrom && dateTo && openingBalance !== '' && closingBalance !== '';
  const canImport = columnMap.date !== undefined && columnMap.description !== undefined &&
    (columnMap.amount !== undefined || columnMap.debit !== undefined || columnMap.credit !== undefined);

  const columnOptions = header.map((label, index) => ({ index, label: label || dictionary.forms.bankReconciliation.importStatement.labels.column.replace('{number}', String(index + 1)) }));

  const handleFieldChange = (field: keyof ColumnMap, value: string) => {
    setColumnMap((prev) => ({
      ...prev,
      [field]: value === '' ? undefined : Number(value),
    }));
  };

  if (importResult) {
    return (
      <>
        <Typography textAlign='center' variant='h4' marginTop={2}>{dictionary.forms.bankReconciliation.importStatement.title.complete}</Typography>
        <DialogContent>
          <Alert severity={importResult.errors?.length ? 'warning' : 'success'} sx={{ mb: 2 }}>
            {importResult.message}
          </Alert>
          {importResult.errors?.length > 0 && (
            <Box sx={{ maxHeight: 240, overflowY: 'auto' }}>
              {importResult.errors.map((error: any, index: number) => (
                <Typography key={index} variant='body2' color='error'>
                  {dictionary.forms.bankReconciliation.importStatement.labels.row.replace('{row}', String(error.row)).replace('{error}', String(error.error))}
                </Typography>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant='contained' onClick={() => toggleOpen(false)}>{dictionary.forms.bankReconciliation.importStatement.buttons.close}</Button>
        </DialogActions>
      </>
    );
  }

  return (
    <>
      <Typography textAlign='center' variant='h4' marginTop={2}>{dictionary.forms.bankReconciliation.importStatement.title.import}</Typography>
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          <Step><StepLabel>{dictionary.forms.bankReconciliation.importStatement.steps.details}</StepLabel></Step>
          <Step><StepLabel>{dictionary.forms.bankReconciliation.importStatement.steps.mapColumns}</StepLabel></Step>
        </Stepper>

        {activeStep === 0 && (
          <Grid container spacing={2}>
            <Grid size={12}>
              <Button variant='outlined' component='label' startIcon={<UploadOutlined />} fullWidth>
                {file ? file.name : dictionary.forms.bankReconciliation.importStatement.labels.selectFile}
                <input
                  hidden
                  type='file'
                  accept='.csv,.txt,.xlsx,.xls'
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </Button>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <DatePicker
                label={dictionary.forms.bankReconciliation.importStatement.labels.statementFrom}
                value={dateFrom}
                onChange={setDateFrom}
                format='DD/MM/YYYY'
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <DatePicker
                label={dictionary.forms.bankReconciliation.importStatement.labels.statementTo}
                value={dateTo}
                onChange={setDateTo}
                format='DD/MM/YYYY'
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label={dictionary.forms.bankReconciliation.importStatement.labels.openingBalance}
                size='small'
                fullWidth
                value={openingBalance}
                InputProps={{ inputComponent: CommaSeparatedField as any }}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOpeningBalance(sanitizedNumber(e.target.value))}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label={dictionary.forms.bankReconciliation.importStatement.labels.closingBalance}
                size='small'
                fullWidth
                value={closingBalance}
                InputProps={{ inputComponent: CommaSeparatedField as any }}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setClosingBalance(sanitizedNumber(e.target.value))}
              />
            </Grid>
          </Grid>
        )}

        {activeStep === 1 && (
          <Grid container spacing={2}>
            <Grid size={12}>
              <Typography variant='body2' color='text.secondary'>
                {dictionary.forms.bankReconciliation.importStatement.help.mapColumns}
                {savedColumnMap && dictionary.forms.bankReconciliation.importStatement.help.prefilled}
              </Typography>
            </Grid>
            {FIELD_KEYS.map((field) => (
              <Grid size={{ xs: 12, md: 6 }} key={field}>
                <TextField
                  select
                  fullWidth
                  size='small'
                  label={dictionary.forms.bankReconciliation.importStatement.fieldLabels[field]}
                  value={columnMap[field] ?? ''}
                  onChange={(e) => handleFieldChange(field, e.target.value)}
                >
                  <MenuItem value=''>{dictionary.forms.bankReconciliation.importStatement.labels.notInFile}</MenuItem>
                  {columnOptions.map((option) => (
                    <MenuItem key={option.index} value={option.index}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button size='small' variant='outlined' onClick={() => toggleOpen(false)}>
          {dictionary.forms.bankReconciliation.importStatement.buttons.cancel}
        </Button>
        {activeStep === 1 && (
          <Button size='small' onClick={() => setActiveStep(0)}>
            {dictionary.forms.bankReconciliation.importStatement.buttons.back}
          </Button>
        )}
        {activeStep === 0 && (
          <LoadingButton
            size='small'
            variant='contained'
            disabled={!canProceedToMapping}
            loading={previewMutation.isPending}
            onClick={() => previewMutation.mutate(file as File)}
          >
            {dictionary.forms.bankReconciliation.importStatement.buttons.next}
          </LoadingButton>
        )}
        {activeStep === 1 && (
          <LoadingButton
            size='small'
            variant='contained'
            disabled={!canImport}
            loading={importMutation.isPending}
            onClick={() => importMutation.mutate()}
          >
            {dictionary.forms.bankReconciliation.importStatement.buttons.import}
          </LoadingButton>
        )}
      </DialogActions>
    </>
  );
}
