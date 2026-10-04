import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import dayjs from 'dayjs';
import depreciationRunsServices from './depreciationRuns-services';

const fmt = (amount: number) =>
  (amount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface NewDepreciationRunDialogContentProps {
  onClose: () => void;
}

const NewDepreciationRunDialogContent: React.FC<NewDepreciationRunDialogContentProps> = ({ onClose }) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const dictionary = useDictionary();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [period, setPeriod] = useState(dayjs().format('YYYY-MM'));
  const [narration, setNarration] = useState('');
  const [preview, setPreview] = useState<any>(null);

  const previewRun = useMutation({
    mutationFn: () => depreciationRunsServices.preview(period),
    onSuccess: (data: any) => setPreview(data),
    onError: (error: any) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const postRun = useMutation({
    mutationFn: () => depreciationRunsServices.post({ period, narration }),
    onSuccess: () => {
      onClose();
      enqueueSnackbar(dictionary.depreciationRuns.form.messages.postSuccess, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['depreciationRuns'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
    onError: (error: any) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const hasMissingMappings = preview?.missing_mappings?.length > 0;
  const canPost = preview && !hasMissingMappings && preview.lines?.length > 0;
  const totalCharge = (preview?.categories ?? []).reduce((sum: number, c: any) => sum + (c.depreciation_amount ?? 0), 0);

  return (
    <>
      <DialogTitle>{dictionary.depreciationRuns.form.title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              type="month"
              size="small"
              label={dictionary.depreciationRuns.form.labels.period}
              value={period}
              onChange={(e) => { setPeriod(e.target.value); setPreview(null); }}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: { sm: 200 } }}
            />
            <TextField
              size="small"
              fullWidth
              label={dictionary.depreciationRuns.form.labels.narration}
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
            />
            <LoadingButton
              variant="outlined"
              loading={previewRun.isPending}
              onClick={() => previewRun.mutate()}
              sx={{ flexShrink: 0 }}
            >
              {dictionary.depreciationRuns.form.buttons.preview}
            </LoadingButton>
          </Stack>

          {preview && (
            <>
              <Divider />
              <Typography variant="subtitle1">{dictionary.depreciationRuns.form.preview.heading}</Typography>

              {hasMissingMappings && (
                <Alert severity="warning">
                  {dictionary.depreciationRuns.form.preview.missingMappings} {preview.missing_mappings.join(', ')}
                </Alert>
              )}

              {!preview.lines?.length && !hasMissingMappings && (
                <Alert severity="info">{dictionary.depreciationRuns.form.preview.noLines}</Alert>
              )}

              {preview.categories?.length > 0 && (
                <>
                  <Paper variant="outlined" sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'action.hover' }}>
                    <Typography variant="subtitle2">{dictionary.depreciationRuns.form.preview.totalCharge}</Typography>
                    <Typography variant="h6">{fmt(totalCharge)}</Typography>
                  </Paper>

                  <Typography variant="subtitle2" color="text.secondary">{dictionary.depreciationRuns.form.preview.categoryHeader}</Typography>
                  {isMobile ? (
                    <Stack spacing={1}>
                      {preview.categories.map((category: any) => (
                        <Paper key={`${category.product_category_id}-${category.cost_center_id ?? 'none'}`} variant="outlined" sx={{ p: 1.5 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                            <Box>
                              <Typography variant="body2" fontWeight={500}>{category.category_name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {category.cost_center_name ?? '-'} · {category.assets_count} {dictionary.depreciationRuns.form.preview.assetsCount}
                              </Typography>
                            </Box>
                            <Typography variant="body2" fontWeight={500}>{fmt(category.depreciation_amount)}</Typography>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>{dictionary.depreciationRuns.view.labels.category}</TableCell>
                            <TableCell>{dictionary.depreciationRuns.view.labels.costCenter}</TableCell>
                            <TableCell align="right">{dictionary.depreciationRuns.form.preview.assetsCount}</TableCell>
                            <TableCell align="right">{dictionary.depreciationRuns.view.labels.charge}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {preview.categories.map((category: any) => (
                            <TableRow key={`${category.product_category_id}-${category.cost_center_id ?? 'none'}`}>
                              <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{category.category_name}</TableCell>
                              <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{category.cost_center_name ?? '-'}</TableCell>
                              <TableCell align="right">{category.assets_count}</TableCell>
                              <TableCell align="right">{fmt(category.depreciation_amount)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                        <TableBody>
                          <TableRow>
                            <TableCell colSpan={3} sx={{ fontWeight: 600, borderBottom: 'none' }}>
                              {dictionary.depreciationRuns.form.preview.totalCharge}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, borderBottom: 'none' }}>{fmt(totalCharge)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}

                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                    {dictionary.depreciationRuns.form.preview.journalPreview}
                  </Typography>
                  {isMobile ? (
                    <Stack spacing={1}>
                      {preview.categories.map((category: any) => (
                        <Paper key={`${category.product_category_id}-${category.cost_center_id ?? 'none'}`} variant="outlined" sx={{ p: 1.5 }}>
                          {category.cost_center_name && (
                            <Typography variant="caption" color="text.secondary">{category.cost_center_name}</Typography>
                          )}
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body2" color="text.secondary">{dictionary.depreciationRuns.form.preview.debit}</Typography>
                            <Typography variant="body2">{category.depreciation_expense_ledger?.name}</Typography>
                          </Stack>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body2" color="text.secondary">{dictionary.depreciationRuns.form.preview.credit}</Typography>
                            <Typography variant="body2">{category.accumulated_depreciation_ledger?.name}</Typography>
                          </Stack>
                          <Divider sx={{ my: 0.5 }} />
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body2" fontWeight={500}>{dictionary.depreciationRuns.form.preview.amount}</Typography>
                            <Typography variant="body2" fontWeight={500}>{fmt(category.depreciation_amount)}</Typography>
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
                          {preview.categories.map((category: any) => (
                            <TableRow key={`${category.product_category_id}-${category.cost_center_id ?? 'none'}`}>
                              <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                {category.category_name}{category.cost_center_name ? ` — ${category.cost_center_name}` : ''}
                              </TableCell>
                              <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{category.depreciation_expense_ledger?.name}</TableCell>
                              <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{category.accumulated_depreciation_ledger?.name}</TableCell>
                              <TableCell align="right">{fmt(category.depreciation_amount)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </>
              )}
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button size="small" onClick={onClose}>{dictionary.depreciationRuns.form.buttons.cancel}</Button>
        <LoadingButton
          variant="contained"
          disabled={!canPost}
          loading={postRun.isPending}
          onClick={() => postRun.mutate()}
          size="small"
        >
          {dictionary.depreciationRuns.form.buttons.post}
        </LoadingButton>
      </DialogActions>
    </>
  );
};

export default NewDepreciationRunDialogContent;
