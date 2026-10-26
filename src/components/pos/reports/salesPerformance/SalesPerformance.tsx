'use client';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useCurrencySelect } from '@/components/masters/Currencies/CurrencySelectProvider';
import StakeholderSelector from '@/components/masters/stakeholders/StakeholderSelector';
import { Stakeholder } from '@/components/masters/stakeholders/StakeholderType';
import PDFContent from '@/components/pdf/PDFContent';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import { Organization } from '@/types/auth-types';
import { HighlightOff, KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Collapse,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useMutation, useQuery } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import OutletSelector from '../../outlet/OutletSelector';
import posServices from '../../pos-services';
import SalesPerformancePDF from './SalesPerformancePDF';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface SalesPerformanceProductRow {
  product_id: number;
  product_name: string;
  unit_symbol?: string | null;
  quantity: number;
  amount_ordered: number;
  amount_dispatched: number;
}

interface SalesPerformanceRow {
  key: number | string;
  label: string;
  stakeholder_id?: number | null;
  transaction_count: number;
  amount_ordered: number;
  amount_collected: number;
  products: SalesPerformanceProductRow[];
}

const formatQuantity = (value: number, unitSymbol?: string | null) =>
  `${(value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}${
    unitSymbol ? ` ${unitSymbol}` : ''
  }`;

const formatAmount = (value: number) =>
  (value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function SalesPerformance({
  setOpenSalesPerformance,
}: {
  setOpenSalesPerformance: (open: boolean) => void;
}) {
  const dictionary = useDictionary();
  const [from, setFrom] = useState<Dayjs | null>(
    dayjs().startOf('month')
  );
  const [to, setTo] = useState<Dayjs | null>(dayjs().endOf('day'));
  const [groupBy, setGroupBy] = useState<'customer' | 'sales_person'>(
    'customer'
  );
  const [orderBy, setOrderBy] = useState<'amount_ordered' | 'amount_collected'>(
    'amount_ordered'
  );
  const [limit, setLimit] = useState<number>(10);
  const [selectedOutlet, setSelectedOutlet] = useState<any>(null);
  const [selectedStakeholders, setSelectedStakeholders] = useState<
    Stakeholder[]
  >([]);
  const [selectedSalesPeople, setSelectedSalesPeople] = useState<string[]>(
    []
  );
  const [rows, setRows] = useState<SalesPerformanceRow[] | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<Set<string | number>>(
    new Set()
  );
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  const toggleExpanded = (key: string | number) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const { enqueueSnackbar } = useSnackbar();
  const { authUser, authOrganization } = useJumboAuth();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const organization = (authOrganization as any)?.organization as Organization;
  const { currencies } = useCurrencySelect();
  const baseCurrencyCode =
    currencies?.find((currency) => !!currency.is_base)?.code || '';

  const { data: salesPersons } = useQuery({
    queryKey: ['salesPerson'],
    queryFn: posServices.getSalesPerson,
  });

  const generateReport = useMutation({
    mutationFn: posServices.salesPerformance,
    onSuccess: (data) => {
      setRows(data?.data || []);
      setExpandedKeys(new Set());
      setShowPdfPreview(false);
    },
    onError: (error: any) => {
      error?.response?.data?.message &&
        enqueueSnackbar(error.response.data.message, { variant: 'error' });
    },
  });

  const handleGenerate = () => {
    if (!from || !to) return;
    generateReport.mutate({
      from: from.toISOString(),
      to: to.toISOString(),
      group_by: groupBy,
      order_by: orderBy,
      limit: limit || undefined,
      sales_outlet_id:
        selectedOutlet?.id && selectedOutlet.id !== 'all'
          ? selectedOutlet.id
          : undefined,
      stakeholder_ids: selectedStakeholders.length
        ? selectedStakeholders.map((stakeholder) => stakeholder.id)
        : undefined,
      sales_people: selectedSalesPeople.length
        ? selectedSalesPeople
        : undefined,
    });
  };

  const handleExportExcel = async (): Promise<void> => {
    if (!rows) return;
    setIsExportingExcel(true);
    try {
      const blob = await posServices.exportSalesPerformanceExcel({
        organization,
        rows,
        groupBy,
        from: from?.toISOString(),
        to: to?.toISOString(),
        baseCurrencyCode,
        printedBy: authUser?.user?.name,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sales-performance.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      enqueueSnackbar(dictionary.forms.reports.salesPerformance.messages.exportFailed, {
        variant: 'error',
      });
    } finally {
      setIsExportingExcel(false);
    }
  };

  const labelColumn =
    groupBy === 'sales_person'
      ? dictionary.forms.reports.salesPerformance.labels.salesPerson
      : dictionary.forms.reports.salesPerformance.labels.customer;

  return (
    <>
      <DialogTitle textAlign='center'>
        <Grid container>
          <Grid size={belowLargeScreen ? 11 : 12}>
            <Typography variant='h3'>{dictionary.forms.reports.salesPerformance.title}</Typography>
          </Grid>
          {belowLargeScreen && (
            <Grid size={1}>
              <Tooltip title={dictionary.tooltips.close}>
                <IconButton
                  sx={{ mb: 1 }}
                  size='small'
                  onClick={() => setOpenSalesPerformance(false)}
                >
                  <HighlightOff color='primary' />
                </IconButton>
              </Tooltip>
            </Grid>
          )}
        </Grid>
        {baseCurrencyCode && (
          <Typography variant='caption' display='block' color='text.secondary'>
            Amounts in base currency ({baseCurrencyCode})
          </Typography>
        )}
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={1} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, md: 3 }}>
            <DateTimePicker
              label={dictionary.forms.reports.salesPerformance.labels.from}
              value={from}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
              onChange={(value) => setFrom(value)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <DateTimePicker
              label={dictionary.forms.reports.salesPerformance.labels.to}
              value={to}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
              onChange={(value) => setTo(value)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth size='small'>
              <InputLabel id='sales-performance-group-by-label'>
                {dictionary.forms.reports.salesPerformance.labels.groupBy}
              </InputLabel>
              <Select
                labelId='sales-performance-group-by-label'
                label={dictionary.forms.reports.salesPerformance.labels.groupBy}
                value={groupBy}
                onChange={(e) =>
                  setGroupBy(e.target.value as 'customer' | 'sales_person')
                }
              >
                <MenuItem value='customer'>{dictionary.forms.reports.salesPerformance.labels.customer}</MenuItem>
                <MenuItem value='sales_person'>{dictionary.forms.reports.salesPerformance.labels.salesPerson}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth size='small'>
              <InputLabel id='sales-performance-order-by-label'>
                {dictionary.forms.reports.salesPerformance.labels.rankBy}
              </InputLabel>
              <Select
                labelId='sales-performance-order-by-label'
                label={dictionary.forms.reports.salesPerformance.labels.rankBy}
                value={orderBy}
                onChange={(e) =>
                  setOrderBy(
                    e.target.value as 'amount_ordered' | 'amount_collected'
                  )
                }
              >
                <MenuItem value='amount_ordered'>{dictionary.forms.reports.salesPerformance.labels.amountOrdered}</MenuItem>
                <MenuItem value='amount_collected'>{dictionary.forms.reports.salesPerformance.labels.amountCollected}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <TextField
              label={dictionary.forms.reports.salesPerformance.labels.topN}
              type='number'
              size='small'
              fullWidth
              value={limit}
              inputProps={{ min: 1 }}
              onChange={(e) => setLimit(parseInt(e.target.value, 10) || 0)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <OutletSelector
              onChange={(newValue) => setSelectedOutlet(newValue)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <StakeholderSelector
              label={dictionary.forms.reports.salesPerformance.labels.clientsAll}
              multiple
              onChange={(newValue) =>
                setSelectedStakeholders(
                  (Array.isArray(newValue) ? newValue : []) as Stakeholder[]
                )
              }
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Autocomplete
              size='small'
              options={salesPersons || []}
              multiple
              isOptionEqualToValue={(option: string, value: string) =>
                option === value
              }
              getOptionLabel={(option: string) => option}
              renderInput={(params) => (
                <TextField {...params} label={dictionary.forms.reports.salesPerformance.labels.salesPeopleAll} />
              )}
              renderTags={(tagValue: string[], getTagProps) =>
                tagValue.map((option, index) => (
                  <Chip {...getTagProps({ index })} key={option} label={option} />
                ))
              }
              onChange={(e, newValue: string[]) =>
                setSelectedSalesPeople(newValue)
              }
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Stack
              direction='row'
              spacing={1}
              alignItems='center'
              justifyContent={{ xs: 'space-between', sm: 'flex-end' }}
              width={{ xs: '100%', sm: 'auto' }}
              sx={{ ml: 'auto' }}
            >
              {rows && rows.length > 0 && (
                <FileExportGrid
                  exportExcel
                  handlExcelExport={handleExportExcel}
                  exportingExcel={isExportingExcel}
                  exportPdf
                  handlePdf={() => setShowPdfPreview((prev) => !prev)}
                />
              )}
              <Button
                fullWidth={belowLargeScreen}
                variant='contained'
                size='small'
                disabled={!from || !to || generateReport.isPending}
                onClick={handleGenerate}
              >
                {dictionary.forms.reports.salesPerformance.labels.generate}
              </Button>
            </Stack>
          </Grid>
        </Grid>

        {generateReport.isPending && <LinearProgress />}

        {rows &&
          (rows.length === 0 ? (
            <Typography
              variant='body2'
              color='text.secondary'
              textAlign='center'
              sx={{ py: 3 }}
            >
              {dictionary.forms.reports.salesPerformance.messages.noSales}
            </Typography>
          ) : showPdfPreview ? (
            <PDFContent
              fileName='Sales Performance'
              document={
                <SalesPerformancePDF
                  organization={organization}
                  rows={rows}
                  groupBy={groupBy}
                  from={from?.toISOString() || ''}
                  to={to?.toISOString() || ''}
                  baseCurrencyCode={baseCurrencyCode}
                  printedBy={authUser?.user?.name}
                  dictionary={dictionary}
                />
              }
            />
          ) : (
            <>
              {/* Card layout for small screens */}
              <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                {rows.map((row, index) => {
                  const isExpanded = expandedKeys.has(row.key);
                  const hasProducts = (row.products || []).length > 0;
                  return (
                    <Paper
                      key={row.key}
                      variant='outlined'
                      sx={{ p: 1.5, mb: 1 }}
                    >
                      <Grid container alignItems='center'>
                        <Grid size={hasProducts ? 10 : 12}>
                          <Typography variant='subtitle2'>
                            {index + 1}. {row.label}
                          </Typography>
                        </Grid>
                        {hasProducts && (
                          <Grid size={2} textAlign='right'>
                            <IconButton
                              size='small'
                              onClick={() => toggleExpanded(row.key)}
                            >
                              {isExpanded ? (
                                <KeyboardArrowUp fontSize='small' />
                              ) : (
                                <KeyboardArrowDown fontSize='small' />
                              )}
                            </IconButton>
                          </Grid>
                        )}
                      </Grid>
                      <Grid container rowSpacing={0.5}>
                        <Grid size={6}>
                          <Typography variant='caption' color='text.secondary'>
                            {dictionary.forms.reports.salesPerformance.labels.transactions}
                          </Typography>
                        </Grid>
                        <Grid size={6} textAlign='right'>
                          <Typography variant='body2'>
                            {row.transaction_count}
                          </Typography>
                        </Grid>
                        <Grid size={6}>
                          <Typography variant='caption' color='text.secondary'>
                            {dictionary.forms.reports.salesPerformance.labels.amountOrdered}
                          </Typography>
                        </Grid>
                        <Grid size={6} textAlign='right'>
                          <Typography variant='body2'>
                            {formatAmount(row.amount_ordered)}
                          </Typography>
                        </Grid>
                        <Grid size={6}>
                          <Typography variant='caption' color='text.secondary'>
                            {dictionary.forms.reports.salesPerformance.labels.amountCollected}
                          </Typography>
                        </Grid>
                        <Grid size={6} textAlign='right'>
                          <Typography variant='body2'>
                            {formatAmount(row.amount_collected)}
                          </Typography>
                        </Grid>
                      </Grid>
                      {hasProducts && (
                        <Collapse in={isExpanded} timeout='auto' unmountOnExit>
                          <Divider sx={{ my: 1 }} />
                          <Typography variant='caption' color='text.secondary' gutterBottom display='block'>
                            {dictionary.forms.reports.salesPerformance.labels.productsSold}
                          </Typography>
                          {row.products.map((product) => (
                            <Box
                              key={product.product_id}
                              sx={{
                                mb: 1,
                                p: 1,
                                borderRadius: 1,
                                bgcolor: 'action.hover',
                              }}
                            >
                              <Typography variant='body2' fontWeight='medium' gutterBottom>
                                {product.product_name}
                              </Typography>
                              <Grid container rowSpacing={0.25}>
                                <Grid size={6}>
                                  <Typography variant='caption' color='text.secondary'>
                                    {dictionary.forms.reports.salesPerformance.labels.quantity}
                                  </Typography>
                                </Grid>
                                <Grid size={6} textAlign='right'>
                                  <Typography variant='caption'>
                                    {formatQuantity(product.quantity, product.unit_symbol)}
                                  </Typography>
                                </Grid>
                                <Grid size={6}>
                                  <Typography variant='caption' color='text.secondary'>
                                    {dictionary.forms.reports.salesPerformance.labels.amountOrdered}
                                  </Typography>
                                </Grid>
                                <Grid size={6} textAlign='right'>
                                  <Typography variant='caption'>
                                    {formatAmount(product.amount_ordered)}
                                  </Typography>
                                </Grid>
                                <Grid size={6}>
                                  <Typography variant='caption' color='text.secondary'>
                                    {dictionary.forms.reports.salesPerformance.labels.amountDispatched}
                                  </Typography>
                                </Grid>
                                <Grid size={6} textAlign='right'>
                                  <Typography variant='caption'>
                                    {formatAmount(product.amount_dispatched)}
                                  </Typography>
                                </Grid>
                              </Grid>
                            </Box>
                          ))}
                        </Collapse>
                      )}
                    </Paper>
                  );
                })}
                <Paper variant='outlined' sx={{ p: 1.5, bgcolor: 'action.hover' }}>
                  <Typography variant='subtitle2' gutterBottom>
                    {dictionary.forms.reports.salesPerformance.labels.total}
                  </Typography>
                  <Grid container rowSpacing={0.5}>
                    <Grid size={6}>
                      <Typography variant='caption' color='text.secondary'>
                        {dictionary.forms.reports.salesPerformance.labels.transactions}
                      </Typography>
                    </Grid>
                    <Grid size={6} textAlign='right'>
                      <Typography variant='body2'>
                        <strong>
                          {rows.reduce(
                            (sum, row) => sum + (row.transaction_count || 0),
                            0
                          )}
                        </strong>
                      </Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant='caption' color='text.secondary'>
                        {dictionary.forms.reports.salesPerformance.labels.amountOrdered}
                      </Typography>
                    </Grid>
                    <Grid size={6} textAlign='right'>
                      <Typography variant='body2'>
                        <strong>
                          {formatAmount(
                            rows.reduce(
                              (sum, row) => sum + (row.amount_ordered || 0),
                              0
                            )
                          )}
                        </strong>
                      </Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant='caption' color='text.secondary'>
                        {dictionary.forms.reports.salesPerformance.labels.amountCollected}
                      </Typography>
                    </Grid>
                    <Grid size={6} textAlign='right'>
                      <Typography variant='body2'>
                        <strong>
                          {formatAmount(
                            rows.reduce(
                              (sum, row) => sum + (row.amount_collected || 0),
                              0
                            )
                          )}
                        </strong>
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Box>

              {/* Table layout for sm and up */}
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <TableContainer>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell />
                    <TableCell>{dictionary.forms.reports.salesPerformance.labels.rank}</TableCell>
                    <TableCell>{labelColumn}</TableCell>
                    <TableCell align='right'>{dictionary.forms.reports.salesPerformance.labels.transactions}</TableCell>
                    <TableCell align='right'>{dictionary.forms.reports.salesPerformance.labels.amountOrdered}</TableCell>
                    <TableCell align='right'>{dictionary.forms.reports.salesPerformance.labels.amountCollected}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, index) => {
                    const isExpanded = expandedKeys.has(row.key);
                    const hasProducts = (row.products || []).length > 0;
                    return (
                      <React.Fragment key={row.key}>
                        <TableRow>
                          <TableCell sx={{ width: 40 }}>
                            {hasProducts && (
                              <IconButton
                                size='small'
                                onClick={() => toggleExpanded(row.key)}
                              >
                                {isExpanded ? (
                                  <KeyboardArrowUp fontSize='small' />
                                ) : (
                                  <KeyboardArrowDown fontSize='small' />
                                )}
                              </IconButton>
                            )}
                          </TableCell>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{row.label}</TableCell>
                          <TableCell align='right'>
                            {row.transaction_count}
                          </TableCell>
                          <TableCell align='right'>
                            {formatAmount(row.amount_ordered)}
                          </TableCell>
                          <TableCell align='right'>
                            {formatAmount(row.amount_collected)}
                          </TableCell>
                        </TableRow>
                        {hasProducts && (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              sx={{ py: 0, borderBottom: isExpanded ? undefined : 'none' }}
                            >
                              <Collapse in={isExpanded} timeout='auto' unmountOnExit>
                                <Box sx={{ my: 1, ml: 5 }}>
                                  <Typography variant='subtitle2' gutterBottom>
                                    {dictionary.forms.reports.salesPerformance.labels.productsSoldBy.replace('{name}', row.label)}
                                  </Typography>
                                  <Table size='small'>
                                    <TableHead>
                                      <TableRow>
                                        <TableCell>{dictionary.forms.reports.salesPerformance.labels.product}</TableCell>
                                        <TableCell align='right'>{dictionary.forms.reports.salesPerformance.labels.quantity}</TableCell>
                                        <TableCell align='right'>{dictionary.forms.reports.salesPerformance.labels.amountOrdered}</TableCell>
                                        <TableCell align='right'>{dictionary.forms.reports.salesPerformance.labels.amountDispatched}</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {row.products.map((product) => (
                                        <TableRow key={product.product_id}>
                                          <TableCell>{product.product_name}</TableCell>
                                          <TableCell align='right'>
                                            {formatQuantity(
                                              product.quantity,
                                              product.unit_symbol
                                            )}
                                          </TableCell>
                                          <TableCell align='right'>
                                            {formatAmount(product.amount_ordered)}
                                          </TableCell>
                                          <TableCell align='right'>
                                            {formatAmount(product.amount_dispatched)}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                  <TableRow>
                    <TableCell />
                    <TableCell />
                    <TableCell>
                      <strong>{dictionary.forms.reports.salesPerformance.labels.total}</strong>
                    </TableCell>
                    <TableCell align='right'>
                      <strong>
                        {rows.reduce(
                          (sum, row) => sum + (row.transaction_count || 0),
                          0
                        )}
                      </strong>
                    </TableCell>
                    <TableCell align='right'>
                      <strong>
                        {formatAmount(
                          rows.reduce(
                            (sum, row) => sum + (row.amount_ordered || 0),
                            0
                          )
                        )}
                      </strong>
                    </TableCell>
                    <TableCell align='right'>
                      <strong>
                        {formatAmount(
                          rows.reduce(
                            (sum, row) => sum + (row.amount_collected || 0),
                            0
                          )
                        )}
                      </strong>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
              </Box>
            </>
          ))}
      </DialogContent>
      <DialogActions>
        <Button size='small' onClick={() => setOpenSalesPerformance(false)}>
          {dictionary.forms.reports.salesPerformance.labels.close}
        </Button>
      </DialogActions>
    </>
  );
}

export default SalesPerformance;
