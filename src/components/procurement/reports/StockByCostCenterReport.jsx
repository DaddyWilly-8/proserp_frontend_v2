'use client';

import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import useProsERPStyles from '@/app/helpers/style-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import productCategoryServices from '@/components/productAndServices/productCategories/productCategoryServices';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import { WarningAmberOutlined } from '@mui/icons-material';
import { Div, Span } from '@jumbo/shared';
import { LoadingButton } from '@mui/lab';
import {
  Autocomplete,
  Checkbox,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  LinearProgress,
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
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import PDFContent from '@/components/pdf/PDFContent';
import StockByCostCenterPdf from './StockByCostCenterPdf';
import StoreSelector from '../stores/StoreSelector';
import storeServices from '../stores/store-services';

const formatAmount = (value) =>
  Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatQuantity = (value) =>
  Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });

// Without `store` this is the organisation-wide report, one column per main
// store. With a store it shows how that store's stock is spread over itself
// and its sub stores.
function StockByCostCenterReport({ store = null }) {
  const dictionary = useDictionary();
  const dict = dictionary.reports.procurementReports.stockByCostCenter;
  const {
    authOrganization,
    authUser: { user },
  } = useJumboAuth();
  const { enqueueSnackbar } = useSnackbar();
  const classes = useProsERPStyles();

  const allCostCenterIds = authOrganization.costCenters.map((c) => c.id);
  const [costCenterIds, setCostCenterIds] = useState(allCostCenterIds);
  const [storeIds, setStoreIds] = useState([]);
  const [categoryIds, setCategoryIds] = useState([]);
  const [asAt, setAsAt] = useState(dayjs());
  const [showZeroBalance, setShowZeroBalance] = useState(false);
  const [report, setReport] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showPdf, setShowPdf] = useState(false);

  const { data: productCategories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['productCategoryOptions'],
    queryFn: productCategoryServices.getCategoryOptions,
  });

  const buildFilters = () => ({
    cost_center_ids: costCenterIds,
    store_id: store?.id,
    store_ids: !store && storeIds.length > 0 ? storeIds : undefined,
    product_category_ids: categoryIds.length > 0 ? categoryIds : undefined,
    as_at: asAt.toISOString(),
    show_zero_balance: showZeroBalance,
  });

  const runReport = async () => {
    setIsFetching(true);
    try {
      setReport(await storeServices.getStockByCostCenter(buildFilters()));
      setShowPdf(false);
    } catch (error) {
      enqueueSnackbar(dict.fetchError, { variant: 'error' });
    } finally {
      setIsFetching(false);
    }
  };

  const downloadExcel = async () => {
    setIsDownloading(true);
    try {
      const data = await storeServices.getStockByCostCenterExcel(buildFilters());
      const blob = new Blob([data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `${store ? dict.distributionTitle : dict.title} ${readableDate(asAt.toISOString(), true)}.xlsx`;
      link.click();
    } catch (error) {
      enqueueSnackbar(dict.excelError, { variant: 'error' });
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoadingCategories) return <LinearProgress />;

  return (
    <React.Fragment>
      <DialogTitle textAlign={'center'}>
        <Span className={classes.hiddenOnPrint}>
          <form
            autoComplete='off'
            onSubmit={(e) => {
              e.preventDefault();
              runReport();
            }}
          >
            <Grid
              container
              columnSpacing={1}
              rowSpacing={1}
              alignItems={'center'}
              justifyContent={'center'}
            >
              <Grid size={12}>
                <Typography variant='h3'>
                  {store ? `${dict.distributionTitle} - ${store.name}` : dict.title}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {store ? dict.distributionNote : dict.mainStoresNote}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <CostCenterSelector
                    label={dict.costCenters}
                    multiple={true}
                    allowSameType={true}
                    onChange={(costCenters) =>
                      // Clearing falls back to every accessible cost center
                      // rather than an empty list, which some filters read as
                      // "match none".
                      setCostCenterIds(
                        costCenters.length === 0
                          ? allCostCenterIds
                          : costCenters.map((c) => c.id)
                      )
                    }
                  />
                </Div>
              </Grid>
              {!store && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Div sx={{ mt: 1, mb: 1 }}>
                    <StoreSelector
                      multiple={true}
                      label={dict.stores}
                      onChange={(stores) => setStoreIds(stores.map((s) => s.id))}
                    />
                  </Div>
                </Grid>
              )}
              <Grid size={{ xs: 12, md: store ? 6 : 12 }}>
                <Autocomplete
                  multiple
                  size='small'
                  options={productCategories ?? []}
                  disableCloseOnSelect
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  renderInput={(params) => (
                    <TextField {...params} label={dict.productCategories} />
                  )}
                  onChange={(event, newValue) =>
                    setCategoryIds(newValue.map((c) => c.id))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <DateTimePicker
                  label={dict.asAt}
                  value={asAt}
                  maxDate={dayjs()}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  onChange={(newValue) => newValue && setAsAt(newValue)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }} textAlign={'left'}>
                <FormControlLabel
                  label={dict.showZeroBalance}
                  control={
                    <Checkbox
                      checked={showZeroBalance}
                      onChange={(e) => setShowZeroBalance(e.target.checked)}
                    />
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 5 }} textAlign={'right'}>
                <Stack
                  direction='row'
                  spacing={0.5}
                  justifyContent='flex-end'
                  alignItems='center'
                >
                  {report?.products?.length > 0 && (
                    <FileExportGrid
                      exportExcel
                      exportPdf
                      handlePdf={() => setShowPdf((shown) => !shown)}
                      handlExcelExport={downloadExcel}
                      exportingExcel={isDownloading}
                    />
                  )}
                  <LoadingButton
                    loading={isFetching}
                    type='submit'
                    size='small'
                    variant='contained'
                  >
                    {dict.filter}
                  </LoadingButton>
                </Stack>
              </Grid>
            </Grid>
          </form>
        </Span>
      </DialogTitle>
      <DialogContent>
        {isFetching && <LinearProgress />}
        {!isFetching && report?.products?.length > 0 && showPdf && (
          <PDFContent
            document={
              <StockByCostCenterPdf
                report={report}
                store={store}
                authOrganization={authOrganization}
                user={user}
                dict={dict}
              />
            }
            fileName={`${store ? dict.distributionTitle : dict.title} ${readableDate(report.filters.as_at, true)}`}
          />
        )}
        {!isFetching && report && !showPdf && (
          <Div sx={{ mt: 3 }}>
            {report.products.length === 0 ? (
              <Typography textAlign='center' color='text.secondary'>
                {dict.noResults}
              </Typography>
            ) : (
              <TableContainer sx={{ maxHeight: '60vh' }}>
                <Table size='small' stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>{dict.product}</TableCell>
                      <TableCell>{dict.unit}</TableCell>
                      {report.stores.map((column) => (
                        <TableCell key={column.id} align='right'>
                          {column.direct
                            ? `${column.name} (${dict.direct})`
                            : column.name}
                        </TableCell>
                      ))}
                      <TableCell align='right' sx={{ fontWeight: 'bold' }}>
                        {dict.total}
                      </TableCell>
                      {report.with_values && (
                        <>
                          <TableCell align='right'>{dict.latestRate}</TableCell>
                          <TableCell align='right' sx={{ fontWeight: 'bold' }}>
                            {dict.estimatedValue}
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {report.products.map((product) => (
                      <TableRow
                        key={product.id}
                        hover
                        sx={product.value_flag ? { bgcolor: 'error.light' } : undefined}
                      >
                        <TableCell>{product.name}</TableCell>
                        <TableCell>
                          {product.measurement_unit?.symbol}
                        </TableCell>
                        {report.stores.map((column) => {
                          const balance = product.store_balances[column.id] ?? 0;
                          return (
                            <TableCell
                              key={column.id}
                              align='right'
                              sx={{
                                color:
                                  balance < 0
                                    ? 'error.main'
                                    : balance === 0
                                      ? 'text.disabled'
                                      : 'inherit',
                              }}
                            >
                              {formatQuantity(balance)}
                            </TableCell>
                          );
                        })}
                        <TableCell align='right' sx={{ fontWeight: 'bold' }}>
                          {formatQuantity(product.total_balance)}
                        </TableCell>
                        {report.with_values && (
                          <>
                            <TableCell align='right'>
                              {formatAmount(product.latest_rate)}
                            </TableCell>
                            <TableCell align='right' sx={{ fontWeight: 'bold' }}>
                              {product.value_flag && (
                                <Tooltip title={dict.valueWarning}>
                                  <WarningAmberOutlined
                                    fontSize='small'
                                    color='error'
                                    sx={{ verticalAlign: 'middle', mr: 0.5 }}
                                  />
                                </Tooltip>
                              )}
                              {formatAmount(product.total_value)}
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                    {report.with_values && (
                      <TableRow>
                        <TableCell
                          colSpan={4 + report.stores.length}
                          align='right'
                          sx={{ fontWeight: 'bold' }}
                        >
                          {dict.total}
                        </TableCell>
                        <TableCell align='right' sx={{ fontWeight: 'bold' }}>
                          {formatAmount(report.total_value)}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Div>
        )}
      </DialogContent>
    </React.Fragment>
  );
}

export default StockByCostCenterReport;
