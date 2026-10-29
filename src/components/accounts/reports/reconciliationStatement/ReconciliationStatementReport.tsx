'use client';

import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  DialogContent,
  DialogTitle,
  DialogActions,
  Grid,
  IconButton,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { HighlightOff } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { DateTimePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import useProsERPStyles from '@/app/helpers/style-helpers';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import PDFContent from '../../../pdf/PDFContent';
import bankReconciliationServices from '../../bankReconciliation/bank-reconciliation-services';
import financialReportsServices from '../financial-reports-services';
import ReconciliationStatementOnScreen from './ReconciliationStatementOnScreen';
import ReconciliationStatementPDF from './ReconciliationStatementPDF';
import { reportFileName } from './reconciliation-statement-helpers';

type View = 'both' | 'reconciled' | 'unreconciled';

interface Props {
  setOpenDialog: (open: boolean) => void;
  // Opened from the reconciliation workspace: start on this account and
  // period and generate straight away instead of waiting for "Generate".
  bankAccountId?: number;
  from?: string;
  to?: string;
  // True when the report sits in its own dialog (opened from the workspace),
  // which then needs its own Close button; on the Reports page the parent
  // dialog already provides one.
  standalone?: boolean;
}

export default function ReconciliationStatementReport({
  setOpenDialog,
  bankAccountId: initialBankAccountId,
  from: initialFrom,
  to: initialTo,
  standalone = false,
}: Props) {
  const dictionary = useDictionary();
  const css = useProsERPStyles();
  const { theme } = useJumboTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('md'));
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const { authOrganization, authUser } = useJumboAuth();
  const user = authUser?.user;

  const [bankAccountId, setBankAccountId] = useState<number | ''>(initialBankAccountId ?? '');
  const [from, setFrom] = useState<Dayjs | null>(initialFrom ? dayjs(initialFrom) : dayjs().startOf('month'));
  const [to, setTo] = useState<Dayjs | null>(initialTo ? dayjs(initialTo) : dayjs());
  const [view, setView] = useState<View>('both');
  // On-screen table/cards by default; the PDF icon toggles the PDF preview (same as the other reports).
  const [showOnScreen, setShowOnScreen] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  // Only fetch when "Generate" is pressed, with the values used at that moment.
  const [submitted, setSubmitted] = useState<{ bankAccountId: number; from: string; to: string } | null>(
    initialBankAccountId && initialFrom && initialTo
      ? {
          bankAccountId: initialBankAccountId,
          from: dayjs(initialFrom).format('YYYY-MM-DD'),
          to: dayjs(initialTo).format('YYYY-MM-DD'),
        }
      : null
  );

  const { data: accountsData } = useQuery({
    queryKey: ['reconciliation-statement-bank-accounts'],
    queryFn: () => bankReconciliationServices.getBankAccounts({ limit: 200 }),
  });
  const accounts: any[] = accountsData?.data ?? [];

  const { data, isFetching, isError, error } = useQuery({
    queryKey: ['reconciliation-statement', submitted, view],
    queryFn: () =>
      bankReconciliationServices.getReconciliationStatement(submitted!.bankAccountId, {
        from: submitted!.from,
        to: submitted!.to,
        view,
      }),
    enabled: !!submitted,
    retry: false,
  });

  const canGenerate = !!bankAccountId && !!from && !!to && !to.isBefore(from);

  const handleExcelExport = async () => {
    setIsExporting(true);
    try {
      const blob = await financialReportsServices.exportReconciliationStatementToExcel({
        reportData: data,
        authOrganization,
        user,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportFileName(data)}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  // Half-width pickers on a phone, with a shorter date format so each fits.
  const pickerFormat = mobile ? 'DD/MM/YY HH:mm' : undefined;

  return (
    <>
      <DialogTitle className={css.hiddenOnPrint} component='div'>
        <Grid container columnSpacing={1} rowSpacing={1} alignItems='center'>
          <Grid container size={12}>
            <Grid size={belowLargeScreen ? 11 : 12}>
              <Typography textAlign='center' variant='h3'>
                Reconciliation Statement
              </Typography>
            </Grid>
            {belowLargeScreen && (
              <Grid size={1} textAlign='right'>
                <Tooltip title={dictionary.tooltips.close}>
                  <IconButton size='small' sx={{ mb: 1 }} onClick={() => setOpenDialog(false)}>
                    <HighlightOff color='primary' />
                  </IconButton>
                </Tooltip>
              </Grid>
            )}
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              select
              fullWidth
              size='small'
              label='Bank account'
              value={bankAccountId}
              onChange={(e) => setBankAccountId(Number(e.target.value))}
            >
              {accounts.map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {a.ledger?.name}
                  {a.bank?.name ? ` — ${a.bank.name}` : ''}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <DateTimePicker
              label='From'
              value={from}
              format={pickerFormat}
              minDate={dayjs(authOrganization?.organization?.recording_start_date)}
              onChange={(v: Dayjs | null) => setFrom(v)}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <DateTimePicker
              label='To'
              value={to}
              format={pickerFormat}
              minDate={from ?? undefined}
              onChange={(v: Dayjs | null) => setTo(v)}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <LoadingButton
              fullWidth
              variant='contained'
              size='small'
              loading={isFetching}
              disabled={!canGenerate}
              onClick={() =>
                setSubmitted({
                  bankAccountId: Number(bankAccountId),
                  from: from!.format('YYYY-MM-DD'),
                  to: to!.format('YYYY-MM-DD'),
                })
              }
            >
              Generate
            </LoadingButton>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Stack direction='row' spacing={1} alignItems='center' justifyContent='space-between' flexWrap='wrap' useFlexGap>
              <ToggleButtonGroup
                size='small'
                exclusive
                fullWidth={mobile}
                value={view}
                onChange={(e, v) => v && setView(v)}
                sx={mobile ? { width: '100%' } : undefined}
              >
                <ToggleButton value='both'>{mobile ? 'Both' : 'Both, with flags'}</ToggleButton>
                <ToggleButton value='reconciled'>{mobile ? 'Reconciled' : 'Reconciled only'}</ToggleButton>
                <ToggleButton value='unreconciled'>{mobile ? 'Unreconciled' : 'Unreconciled only'}</ToggleButton>
              </ToggleButtonGroup>
              {data && (
                <FileExportGrid
                  exportExcel
                  handlExcelExport={handleExcelExport}
                  exportingExcel={isExporting}
                  exportPdf
                  handlePdf={() => setShowOnScreen((prev) => !prev)}
                />
              )}
            </Stack>
          </Grid>
        </Grid>
      </DialogTitle>
      <DialogContent>
        {isFetching && <LinearProgress sx={{ mb: 1 }} />}
        {isError && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {(error as any)?.response?.data?.message || 'Failed to load the reconciliation statement'}
          </Alert>
        )}

        {data &&
          !isFetching &&
          (showOnScreen ? (
            <ReconciliationStatementOnScreen reportData={data} />
          ) : (
            <PDFContent
              fileName={reportFileName(data)}
              document={<ReconciliationStatementPDF reportData={data} authOrganization={authOrganization} user={user} />}
            />
          ))}

      </DialogContent>
      {standalone && (
        <DialogActions className={css.hiddenOnPrint}>
          <Button sx={{ mt: 1 }} size='small' variant='outlined' onClick={() => setOpenDialog(false)}>
            Close
          </Button>
        </DialogActions>
      )}
    </>
  );
}
