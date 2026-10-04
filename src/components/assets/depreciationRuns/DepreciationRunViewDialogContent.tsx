import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import PDFContent from '@/components/pdf/PDFContent';
import { DownloadOutlined, PictureAsPdfOutlined } from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useQuery } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import dayjs from 'dayjs';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import depreciationRunsServices from './depreciationRuns-services';
import DepreciationRunPDF from './DepreciationRunPDF';

const fmt = (amount: number) =>
  (amount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface DepreciationRunViewDialogContentProps {
  runId: number;
  onClose: () => void;
}

const Field = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <Stack direction="row" spacing={1.5} justifyContent="space-between" alignItems="flex-start">
    <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
      {label}
    </Typography>
    <Box textAlign="right">
      {typeof value === 'string' || typeof value === 'number'
        ? <Typography variant="body2">{value}</Typography>
        : (value ?? <Typography variant="body2">-</Typography>)}
    </Box>
  </Stack>
);

const DepreciationRunViewDialogContent: React.FC<DepreciationRunViewDialogContentProps> = ({ runId, onClose }) => {
  const dictionary = useDictionary();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { enqueueSnackbar } = useSnackbar();
  const { authOrganization, authUser } = useJumboAuth();
  const user = authUser?.user;
  const [openPdf, setOpenPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const { data: run, isLoading } = useQuery({
    queryKey: ['depreciationRun', runId],
    queryFn: () => depreciationRunsServices.getOne(runId),
  });

  if (isLoading || !run) {
    return <LinearProgress />;
  }

  const totalCharge = (run.entries ?? []).reduce((sum: number, e: any) => sum + (e.depreciation_amount ?? 0), 0);
  const periodLabel = dayjs(run.period_start).format('MMMM YYYY');

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      const blob = await depreciationRunsServices.exportExcel(run.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Depreciation Run - ${periodLabel}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <span>{dictionary.depreciationRuns.view.title} — {periodLabel}</span>
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined" startIcon={<PictureAsPdfOutlined />} onClick={() => setOpenPdf(true)}>
              PDF
            </Button>
            <Button size="small" variant="outlined" startIcon={<DownloadOutlined />} onClick={handleExportExcel} disabled={isExportingExcel}>
              Excel
            </Button>
          </Stack>
        </Stack>
      </DialogTitle>
      <Dialog open={openPdf} onClose={() => setOpenPdf(false)} fullWidth maxWidth="lg">
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <span>{dictionary.depreciationRuns.view.title} — {periodLabel}</span>
            <IconButton size="small" onClick={() => setOpenPdf(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {openPdf && (
            <PDFContent
              document={<DepreciationRunPDF run={run} authOrganization={authOrganization} user={user} />}
              fileName={`Depreciation Run - ${periodLabel}`}
            />
          )}
        </DialogContent>
      </Dialog>
      <DialogContent>
        <Stack spacing={2}>
          {run.narration && <Typography variant="body2" color="text.secondary">{run.narration}</Typography>}

          <Paper variant="outlined" sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'action.hover' }}>
            <Typography variant="subtitle2">{dictionary.depreciationRuns.form.preview.totalCharge}</Typography>
            <Typography variant="h6">{fmt(totalCharge)}</Typography>
          </Paper>

          {isMobile ? (
            <Stack spacing={1}>
              {run.entries?.map((entry: any) => (
                <Paper key={entry.id} variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="body2" fontWeight={500}>
                    {entry.asset_detail?.code} — {entry.asset_detail?.product_item?.product?.name}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Stack spacing={0.75}>
                    <Field label={dictionary.depreciationRuns.view.labels.category} value={entry.asset_detail?.product_item?.product?.category?.name} />
                    <Field label={dictionary.depreciationRuns.view.labels.costCenter} value={entry.asset_detail?.cost_center?.name} />
                    <Field
                      label={dictionary.depreciationRuns.view.labels.charge}
                      value={<Typography component="span" variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(entry.depreciation_amount)}</Typography>}
                    />
                    <Field
                      label={dictionary.depreciationRuns.view.labels.accumulatedAfter}
                      value={<Typography component="span" variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(entry.accumulated_depreciation_after)}</Typography>}
                    />
                    <Field
                      label={dictionary.depreciationRuns.view.labels.nbvAfter}
                      value={<Typography component="span" variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(entry.net_book_value_after)}</Typography>}
                    />
                  </Stack>
                </Paper>
              ))}
            </Stack>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{dictionary.depreciationRuns.view.labels.asset}</TableCell>
                    <TableCell>{dictionary.depreciationRuns.view.labels.category}</TableCell>
                    <TableCell>{dictionary.depreciationRuns.view.labels.costCenter}</TableCell>
                    <TableCell align="right">{dictionary.depreciationRuns.view.labels.charge}</TableCell>
                    <TableCell align="right">{dictionary.depreciationRuns.view.labels.accumulatedAfter}</TableCell>
                    <TableCell align="right">{dictionary.depreciationRuns.view.labels.nbvAfter}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {run.entries?.map((entry: any) => (
                    <TableRow key={entry.id} hover>
                      <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                        <Typography variant="body2" fontWeight={500}>{entry.asset_detail?.product_item?.product?.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{entry.asset_detail?.code}</Typography>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{entry.asset_detail?.product_item?.product?.category?.name}</TableCell>
                      <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{entry.asset_detail?.cost_center?.name ?? '-'}</TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(entry.depreciation_amount)}</TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(entry.accumulated_depreciation_after)}</TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(entry.net_book_value_after)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Typography variant="subtitle2" color="text.secondary">{dictionary.depreciationRuns.view.labels.journal}</Typography>
          {isMobile ? (
            <Stack spacing={1}>
              {run.journals?.map((journal: any) => (
                <Paper key={journal.id} variant="outlined" sx={{ p: 1.5 }}>
                  {journal.cost_centers?.length > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      {journal.cost_centers.map((cc: any) => cc.name).join(', ')}
                    </Typography>
                  )}
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">{dictionary.depreciationRuns.form.preview.debit}</Typography>
                    <Typography variant="body2">{journal.debit_ledger?.name}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">{dictionary.depreciationRuns.form.preview.credit}</Typography>
                    <Typography variant="body2">{journal.credit_ledger?.name}</Typography>
                  </Stack>
                  <Divider sx={{ my: 0.5 }} />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" fontWeight={500}>{dictionary.depreciationRuns.form.preview.amount}</Typography>
                    <Typography variant="body2" fontWeight={500}>{fmt(journal.amount)}</Typography>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{dictionary.depreciationRuns.view.labels.costCenter}</TableCell>
                    <TableCell>{dictionary.depreciationRuns.form.preview.debit}</TableCell>
                    <TableCell>{dictionary.depreciationRuns.form.preview.credit}</TableCell>
                    <TableCell align="right">{dictionary.depreciationRuns.form.preview.amount}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {run.journals?.map((journal: any) => (
                    <TableRow key={journal.id} hover>
                      <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                        {journal.cost_centers?.length > 0 ? journal.cost_centers.map((cc: any) => cc.name).join(', ') : '-'}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{journal.debit_ledger?.name}</TableCell>
                      <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{journal.credit_ledger?.name}</TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(journal.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button size="small" onClick={onClose}>{dictionary.depreciationRuns.form.buttons.close}</Button>
      </DialogActions>
    </>
  );
};

export default DepreciationRunViewDialogContent;
