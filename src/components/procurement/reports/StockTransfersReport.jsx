'use client';

import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import useProsERPStyles from '@/app/helpers/style-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import PDFContent from '@/components/pdf/PDFContent';
import productCategoryServices from '@/components/productAndServices/productCategories/productCategoryServices';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Div, Span } from '@jumbo/shared';
import { ArrowDownward, ArrowForward, TuneOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  Collapse,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Switch,
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
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import StoreSelector from '../stores/StoreSelector';
import storeServices from '../stores/store-services';
import StockTransfersPdf from './StockTransfersPdf';

const formatAmount = (value) =>
  Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// Two columns per store: beyond this the PDF is too wide to read, use Excel.
const MAX_PDF_STORES = 6;

const formatQuantity = (value) =>
  Number(value).toLocaleString(undefined, { maximumFractionDigits: 4 });

// Without `store` this covers every store; with a store it is what that store
// sent out, or what it received, as chosen under Direction.
function StockTransfersReport({ store = null }) {
  const dictionary = useDictionary();
  const dict = dictionary.reports.procurementReports.stockTransfers;
  const {
    authOrganization,
    authUser: { user },
  } = useJumboAuth();
  const { enqueueSnackbar } = useSnackbar();
  const classes = useProsERPStyles();
  const { theme } = useJumboTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  // The filters fold away once a report is showing, to leave the height to the results
  const [filtersOpen, setFiltersOpen] = useState(true);

  // Empty means every cost center the user can see, including stock with none assigned
  const [sourceCostCenterIds, setSourceCostCenterIds] = useState([]);
  const [destinationCostCenterIds, setDestinationCostCenterIds] = useState([]);
  const [columnsBy, setColumnsBy] = useState('destination');
  const [sourceStoreIds, setSourceStoreIds] = useState([]);
  const [destinationStoreIds, setDestinationStoreIds] = useState([]);
  const [direction, setDirection] = useState('sent');
  const [type, setType] = useState('all');
  // Off by default: a main store means that store, its sub stores are opted in per side
  const [includeSourceChildren, setIncludeSourceChildren] = useState(false);
  const [includeDestinationChildren, setIncludeDestinationChildren] = useState(false);
  const [categoryIds, setCategoryIds] = useState([]);
  const recordingStart = dayjs(authOrganization.organization.recording_start_date);
  const [from, setFrom] = useState(() => {
    const monthStart = dayjs().startOf('month');
    return monthStart.isBefore(recordingStart) ? recordingStart : monthStart;
  });
  const [to, setTo] = useState(dayjs());
  const [report, setReport] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showPdf, setShowPdf] = useState(false);

  const { data: productCategories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['productCategoryOptions'],
    queryFn: productCategoryServices.getCategoryOptions,
  });

  const buildFilters = () => ({
    source_cost_center_ids: sourceCostCenterIds,
    destination_cost_center_ids: destinationCostCenterIds,
    columns_by: columnsBy,
    source_store_ids: store
      ? direction === 'sent' ? [store.id] : undefined
      : sourceStoreIds,
    destination_store_ids: store
      ? direction === 'received' ? [store.id] : undefined
      : destinationStoreIds,
    type: type === 'all' ? undefined : type,
    include_source_children: store && direction === 'received' ? false : includeSourceChildren,
    include_destination_children: store && direction === 'sent' ? false : includeDestinationChildren,
    product_category_ids: categoryIds.length > 0 ? categoryIds : undefined,
    from: from.toISOString(),
    to: to.toISOString(),
  });

  const runReport = async () => {
    setIsFetching(true);
    try {
      setReport(await storeServices.getStockTransfers(buildFilters()));
      setShowPdf(false);
      setFiltersOpen(false);
    } catch (error) {
      enqueueSnackbar(dict.fetchError, { variant: 'error' });
    } finally {
      setIsFetching(false);
    }
  };

  const downloadExcel = async () => {
    setIsDownloading(true);
    try {
      const data = await storeServices.getStockTransfersExcel(buildFilters());
      const blob = new Blob([data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `${dict.title} ${readableDate(from.toISOString(), true)} - ${readableDate(to.toISOString(), true)}.xlsx`;
      link.click();
    } catch (error) {
      enqueueSnackbar(dict.excelError, { variant: 'error' });
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoadingCategories) return <LinearProgress />;

  const subStoreSwitch = (checked, onChange) => (
    <FormControlLabel
      label={dict.withSubstores}
      control={<Switch size='small' checked={checked} onChange={(e) => onChange(e.target.checked)} />}
    />
  );

  const typeLabel = { all: dict.allTypes, Internal: dict.internal, External: dict.external }[type];
  const withValues = report?.with_values;
  const pdfAvailable = (report?.stores?.length ?? 0) <= MAX_PDF_STORES;
  const numeric = { fontFamily: 'monospace' };
  // With many stores the table scrolls sideways; keep the product name in view
  const stickyProduct = {
    position: 'sticky',
    left: 0,
    minWidth: 180,
    bgcolor: 'background.paper',
  };

  return (
    <React.Fragment>
      <DialogTitle>
        <Span className={classes.hiddenOnPrint}>
          <form
            autoComplete='off'
            onSubmit={(e) => {
              e.preventDefault();
              runReport();
            }}
          >
            <Stack spacing={2}>
              <Box textAlign='center'>
                <Typography variant='h3'>
                  {store ? `${dict.title} - ${store.name}` : dict.title}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {dict.note}
                </Typography>
              </Box>

              {report && !filtersOpen && (
                <Paper
                  variant='outlined'
                  sx={{
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant='caption' color='text.secondary'>
                      {dict.filters}
                    </Typography>
                    <Typography variant='body2' noWrap>
                      {`${readableDate(from.toISOString(), true)} - ${readableDate(to.toISOString(), true)} · ${typeLabel}`}
                    </Typography>
                  </Box>
                  <Button
                    size='small'
                    startIcon={<TuneOutlined />}
                    onClick={() => setFiltersOpen(true)}
                  >
                    {dict.editFilters}
                  </Button>
                </Paper>
              )}

              <Collapse in={filtersOpen}>
                <Stack spacing={2}>
                  {store && (
                    <ToggleButtonGroup
                      exclusive
                      fullWidth={isMobile}
                      size='small'
                      color='primary'
                      value={direction}
                      onChange={(e, value) => value && setDirection(value)}
                      sx={{ alignSelf: 'center' }}
                    >
                      <ToggleButton value='sent'>{dict.sentFromStore}</ToggleButton>
                      <ToggleButton value='received'>{dict.receivedIntoStore}</ToggleButton>
                    </ToggleButtonGroup>
                  )}

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', md: '1fr auto 1fr' },
                      gap: 1.5,
                      alignItems: 'stretch',
                    }}
                  >
                    {[
                      {
                        key: 'source',
                        title: dict.fromCard,
                        isStoreSide: store && direction === 'sent',
                        selectorLabel: dict.fromStores,
                        onStores: (stores) => setSourceStoreIds(stores.map((s) => s.id)),
                        withChildren: includeSourceChildren,
                        setWithChildren: setIncludeSourceChildren,
                        costCenterLabel: dict.sourceCostCenters,
                        onCostCenters: setSourceCostCenterIds,
                      },
                      null,
                      {
                        key: 'destination',
                        title: dict.toCard,
                        isStoreSide: store && direction === 'received',
                        selectorLabel: dict.toStores,
                        onStores: (stores) => setDestinationStoreIds(stores.map((s) => s.id)),
                        withChildren: includeDestinationChildren,
                        setWithChildren: setIncludeDestinationChildren,
                        costCenterLabel: dict.destinationCostCenters,
                        onCostCenters: setDestinationCostCenterIds,
                      },
                    ].map((side, index) =>
                      side === null ? (
                        <Box
                          key='arrow'
                          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                            {isMobile ? (
                              <ArrowDownward fontSize='small' />
                            ) : (
                              <ArrowForward fontSize='small' />
                            )}
                          </Avatar>
                        </Box>
                      ) : (
                        <Paper
                          key={side.key}
                          variant='outlined'
                          sx={{
                            p: 2,
                            borderTop: 3,
                            borderTopColor: 'primary.main',
                          }}
                        >
                          <Typography
                            variant='overline'
                            color='primary'
                            sx={{ fontWeight: 'bold', lineHeight: 1.5 }}
                          >
                            {side.title}
                          </Typography>
                          <Stack spacing={1.5} sx={{ mt: 1 }}>
                            {store && !side.isStoreSide ? (
                              <Typography variant='body2' color='text.secondary'>
                                {dict.anyStore}
                              </Typography>
                            ) : (
                              <Box>
                                {store ? (
                                  <Chip label={store.name} color='primary' variant='outlined' />
                                ) : (
                                  <StoreSelector
                                    multiple={true}
                                    allowSubStores={true}
                                    label={side.selectorLabel}
                                    onChange={side.onStores}
                                  />
                                )}
                                <Box sx={{ mt: 0.5 }}>
                                  {subStoreSwitch(side.withChildren, side.setWithChildren)}
                                </Box>
                              </Box>
                            )}
                            <CostCenterSelector
                              label={side.costCenterLabel}
                              multiple={true}
                              allowSameType={true}
                              onChange={(costCenters) =>
                                side.onCostCenters(costCenters.map((c) => c.id))
                              }
                            />
                          </Stack>
                        </Paper>
                      )
                    )}
                  </Box>

                  <Paper variant='outlined' sx={{ p: 2 }}>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
                        gap: 1.5,
                        alignItems: 'center',
                      }}
                    >
                      <DateTimePicker
                        label={dict.from}
                        value={from}
                        minDate={recordingStart}
                        maxDate={dayjs()}
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                        onChange={(newValue) => newValue && setFrom(newValue)}
                      />
                      <DateTimePicker
                        label={dict.to}
                        value={to}
                        minDate={recordingStart}
                        maxDate={dayjs()}
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                        onChange={(newValue) => newValue && setTo(newValue)}
                      />
                      <TextField
                        select
                        size='small'
                        fullWidth
                        label={dict.type}
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                      >
                        <MenuItem value='all'>{dict.allTypes}</MenuItem>
                        <MenuItem value='Internal'>{dict.internal}</MenuItem>
                        <MenuItem value='External'>{dict.external}</MenuItem>
                      </TextField>
                      <TextField
                        select
                        size='small'
                        fullWidth
                        label={dict.columns}
                        value={columnsBy}
                        onChange={(e) => setColumnsBy(e.target.value)}
                      >
                        <MenuItem value='destination'>{dict.destinationStores}</MenuItem>
                        <MenuItem value='source'>{dict.sourceStores}</MenuItem>
                      </TextField>
                      <Box sx={{ gridColumn: '1 / -1' }}>
                        <Autocomplete
                          multiple
                          size='small'
                          options={productCategories ?? []}
                          disableCloseOnSelect
                          getOptionLabel={(option) => option.name}
                          isOptionEqualToValue={(option, value) => option.id === value.id}
                          renderInput={(params) => (
                            <TextField {...params} label={dict.productCategories} />
                          )}
                          onChange={(event, newValue) =>
                            setCategoryIds(newValue.map((c) => c.id))
                          }
                        />
                      </Box>
                    </Box>
                  </Paper>
                </Stack>
              </Collapse>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                justifyContent='space-between'
                alignItems={{ xs: 'stretch', sm: 'center' }}
              >
                <Typography variant='caption' color='text.secondary'>
                  {report?.products?.length > 0 && !pdfAvailable
                    ? dict.pdfTooWide.replace('{max}', MAX_PDF_STORES)
                    : ''}
                </Typography>
                <Stack
                  direction='row'
                  spacing={1}
                  justifyContent={{ xs: 'space-between', sm: 'flex-end' }}
                  alignItems='center'
                >
                  {report?.products?.length > 0 && (
                    <FileExportGrid
                      exportExcel
                      exportPdf={pdfAvailable}
                      handlePdf={() => setShowPdf((shown) => !shown)}
                      handlExcelExport={downloadExcel}
                      exportingExcel={isDownloading}
                    />
                  )}
                  <LoadingButton
                    loading={isFetching}
                    type='submit'
                    variant='contained'
                    sx={{ flexGrow: { xs: 1, sm: 0 }, minWidth: 120 }}
                  >
                    {dict.filter}
                  </LoadingButton>
                </Stack>
              </Stack>
            </Stack>
          </form>
        </Span>
      </DialogTitle>
      <DialogContent>
        {isFetching && <LinearProgress />}
        {!isFetching && report?.products?.length > 0 && showPdf && pdfAvailable && (
          <PDFContent
            document={
              <StockTransfersPdf
                report={report}
                authOrganization={authOrganization}
                user={user}
                dict={dict}
              />
            }
            fileName={`${dict.title} ${readableDate(report.filters.from, true)} - ${readableDate(report.filters.to, true)}`}
          />
        )}
        {!isFetching && report && (!showPdf || !pdfAvailable) && (
          <Div sx={{ mt: 3 }}>
            {report.products.length === 0 ? (
              <Typography textAlign='center' color='text.secondary'>
                {dict.noResults}
              </Typography>
            ) : (
              <TableContainer sx={{ maxHeight: 'calc(100vh - 340px)', minHeight: 280 }}>
                <Table
                  size='small'
                  stickyHeader
                  sx={{
                    '& .MuiTableCell-root': {
                      border: '1px solid',
                      borderColor: 'divider',
                    },
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell rowSpan={2}>{dict.sn}</TableCell>
                      <TableCell rowSpan={2} sx={{ ...stickyProduct, zIndex: 4 }}>{dict.product}</TableCell>
                      <TableCell rowSpan={2}>{dict.unit}</TableCell>
                      {report.stores.map((column) => (
                        <TableCell key={column.id} colSpan={2} align='center'>
                          {column.name}
                        </TableCell>
                      ))}
                      <TableCell colSpan={2} align='center' sx={{ fontWeight: 'bold' }}>
                        {dict.total}
                      </TableCell>
                      {withValues && (
                        <>
                          <TableCell rowSpan={2} align='right'>{dict.value}</TableCell>
                          <TableCell rowSpan={2} align='right'>{dict.valueReceived}</TableCell>
                        </>
                      )}
                    </TableRow>
                    <TableRow>
                      {[...report.stores, { id: 'total' }].map((column) => (
                        <React.Fragment key={column.id}>
                          <TableCell align='right' sx={{ top: 37 }}>{dict.sent}</TableCell>
                          <TableCell align='right' sx={{ top: 37 }}>{dict.received}</TableCell>
                        </React.Fragment>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {report.products.map((product, index) => (
                      <TableRow key={product.id} hover>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell sx={{ ...stickyProduct, zIndex: 1 }}>{product.name}</TableCell>
                        <TableCell>{product.unit}</TableCell>
                        {report.stores.map((column) => {
                          const sent = product.store_sent[column.id] ?? 0;
                          const received = product.store_received[column.id] ?? 0;
                          return (
                            <React.Fragment key={column.id}>
                              <TableCell
                                align='right'
                                sx={{ ...numeric, color: sent === 0 ? 'text.disabled' : 'inherit' }}
                              >
                                {formatQuantity(sent)}
                              </TableCell>
                              <TableCell
                                align='right'
                                sx={{
                                  ...numeric,
                                  color: received < sent ? 'warning.main' : sent === 0 ? 'text.disabled' : 'inherit',
                                  fontWeight: received < sent ? 'bold' : 'normal',
                                }}
                              >
                                {formatQuantity(received)}
                              </TableCell>
                            </React.Fragment>
                          );
                        })}
                        <TableCell align='right' sx={{ ...numeric, fontWeight: 'bold' }}>
                          {formatQuantity(product.total_sent)}
                        </TableCell>
                        <TableCell
                          align='right'
                          sx={{
                            ...numeric,
                            fontWeight: 'bold',
                            color: product.total_pending > 0 ? 'warning.main' : 'inherit',
                          }}
                        >
                          {formatQuantity(product.total_received)}
                        </TableCell>
                        {withValues && (
                          <>
                            <TableCell align='right' sx={numeric}>
                              {formatAmount(product.total_value)}
                            </TableCell>
                            <TableCell align='right' sx={numeric}>
                              {formatAmount(product.total_received_value)}
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                    {withValues && (
                      <TableRow>
                        <TableCell
                          colSpan={5 + report.stores.length * 2}
                          align='right'
                          sx={{ fontWeight: 'bold' }}
                        >
                          {dict.total}
                        </TableCell>
                        <TableCell align='right' sx={{ fontWeight: 'bold', ...numeric }}>
                          {formatAmount(report.total_value)}
                        </TableCell>
                        <TableCell align='right' sx={{ fontWeight: 'bold', ...numeric }}>
                          {formatAmount(report.total_received_value)}
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

export default StockTransfersReport;
