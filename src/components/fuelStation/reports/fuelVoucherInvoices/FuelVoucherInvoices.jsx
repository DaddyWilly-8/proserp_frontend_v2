import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import posServices from '@/components/pos/pos-services';
import StakeholderSelector from '@/components/masters/stakeholders/StakeholderSelector';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { ArrowBack, HighlightOff, SearchOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Skeleton,
  Stack,
  Switch,
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
import { DatePicker, DateTimePicker } from '@mui/x-date-pickers';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import PDFContent from '../../../pdf/PDFContent';
import fuelStationServices from '../../fuelStationServices';
import FuelVoucherInvoicePaymentsPanel from './FuelVoucherInvoicePaymentsPanel';
import FuelVoucherInvoicePDF from './FuelVoucherInvoicePDF';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const money = (value = 0) =>
  (value ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const errorMessage = (error, fallback) =>
  error?.response?.data?.message || fallback;

/**
 * @param {{ closeDialog?: (open: boolean) => void, onCreated?: (invoice: any) => void }} props
 */
function FuelVoucherInvoices({ closeDialog, onCreated }) {
  const dictionary = useDictionary();
  const t = dictionary.reports.fuelStationReports.fuelVoucherInvoices;
  const { authUser, authOrganization } = useJumboAuth();
  const organization = authOrganization.organization;
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  document.title = t.newInvoice;

  const [invoiceToView, setInvoiceToView] = useState(null);
  // Off: lines of the same product and price are grouped. On: every voucher is listed.
  const [openDetails, setOpenDetails] = useState(false);

  // New invoice
  const [customer, setCustomer] = useState(null);
  const [station, setStation] = useState(null);
  const [from, setFrom] = useState(dayjs().startOf('month'));
  const [to, setTo] = useState(dayjs().endOf('day'));
  const [invoiceDate, setInvoiceDate] = useState(dayjs());
  const [dueDate, setDueDate] = useState(null);
  const [internalReference, setInternalReference] = useState('');
  const [customerReference, setCustomerReference] = useState('');
  const [terms, setTerms] = useState('');
  const [narration, setNarration] = useState('');
  const [vouchers, setVouchers] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  // Narrows the voucher table only; selections made while filtering are kept
  const [voucherKeyword, setVoucherKeyword] = useState('');
  const [isLoadingVouchers, setIsLoadingVouchers] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { data: stations } = useQuery({
    queryKey: ['userStations', { userId: authUser?.user?.id }],
    queryFn: fuelStationServices.getUserStations,
  });

  // Terms already used on Sales / Fuel invoices, offered as suggestions (free text also allowed)
  const { data: termsSuggestions } = useQuery({
    queryKey: ['terms-and-instructions'],
    queryFn: posServices.getTermsandInstructions,
  });


  const loadVouchers = async () => {
    if (!customer?.id) {
      enqueueSnackbar(t.selectCustomerFirst, { variant: 'warning' });
      return;
    }
    setIsLoadingVouchers(true);
    try {
      const data = await fuelStationServices.uninvoicedFuelVouchers({
        stakeholder_id: customer.id,
        station_id: station?.id,
        from: from.toISOString(),
        to: to.toISOString(),
      });
      setVouchers(data);
      setVoucherKeyword('');
      setSelectedIds(data.map((voucher) => voucher.id));
    } catch (error) {
      enqueueSnackbar(errorMessage(error, t.errorFallback), { variant: 'error' });
    } finally {
      setIsLoadingVouchers(false);
    }
  };

  const toggle = (id) =>
    setSelectedIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
    );

  const needle = voucherKeyword.trim().toLowerCase();
  const visibleVouchers = !needle
    ? (vouchers ?? [])
    : (vouchers ?? []).filter((voucher) =>
        [
          voucher.voucherNo,
          voucher.station,
          voucher.product,
          voucher.reference,
          voucher.narration,
          readableDate(voucher.date),
        ].some((value) => value && String(value).toLowerCase().includes(needle))
      );
  const visibleSelectedCount = visibleVouchers.filter((voucher) =>
    selectedIds.includes(voucher.id)
  ).length;

  // "Select all" acts on the rows being shown, so filtering then ticking it picks just those
  const toggleVisible = (checked) => {
    const visibleIds = visibleVouchers.map((voucher) => voucher.id);
    setSelectedIds((ids) =>
      checked
        ? Array.from(new Set([...ids, ...visibleIds]))
        : ids.filter((id) => !visibleIds.includes(id))
    );
  };

  const selectedTotal = (vouchers ?? [])
    .filter((voucher) => selectedIds.includes(voucher.id))
    .reduce((sum, voucher) => sum + voucher.amount, 0);

  const createInvoice = async () => {
    setIsCreating(true);
    try {
      const invoice = await fuelStationServices.createFuelVoucherInvoice({
        stakeholder_id: customer.id,
        voucher_ids: selectedIds,
        invoice_date: invoiceDate.format('YYYY-MM-DD'),
        due_date: dueDate ? dueDate.format('YYYY-MM-DD') : null,
        from_date: from.toISOString(),
        to_date: to.toISOString(),
        internal_reference: internalReference || null,
        customer_reference: customerReference || null,
        terms_and_instructions: terms || null,
        narration: narration || null,
      });
      // The new invoice belongs in the Customer Invoices list this dialog was opened from
      queryClient.invalidateQueries({ queryKey: ['customer-invoices'] });
      onCreated?.(invoice);
      setVouchers(null);
      setSelectedIds([]);
      setNarration('');
      setDueDate(null);
      setInternalReference('');
      setCustomerReference('');
      setTerms('');
      setInvoiceToView(invoice);
    } catch (error) {
      enqueueSnackbar(errorMessage(error, t.errorFallback), { variant: 'error' });
    } finally {
      setIsCreating(false);
    }
  };

  const title = (
    <Stack
      direction='row'
      justifyContent='center'
      alignItems='center'
      position='relative'
    >
      {invoiceToView && (
        <Tooltip title={dictionary.tooltips.back}>
          <IconButton
            size='small'
            sx={{ position: 'absolute', left: 0 }}
            onClick={() => setInvoiceToView(null)}
          >
            <ArrowBack color='primary' />
          </IconButton>
        </Tooltip>
      )}
      <Typography variant='h3' textAlign='center'>
        {invoiceToView ? invoiceToView.invoice_no : t.newInvoice}
      </Typography>
      {belowLargeScreen && (
        <Tooltip title={dictionary.tooltips.close}>
          <IconButton
            size='small'
            sx={{ position: 'absolute', right: 20, top: 0 }}
            onClick={() => closeDialog?.(false)}
          >
            <HighlightOff color='primary' />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );

  if (invoiceToView) {
    return (
      <>
        <DialogTitle textAlign='center'>{title}</DialogTitle>
        <DialogContent>
          <Stack direction='row' justifyContent='center' alignItems='center'>
            <Typography>{t.detailed}</Typography>
            <Switch
              checked={openDetails}
              onChange={(event) => setOpenDetails(event.target.checked)}
              slotProps={{ input: { 'aria-label': 'controlled' } }}
            />
          </Stack>
          <FuelVoucherInvoicePaymentsPanel invoice={invoiceToView} />
          <PDFContent
            // Page orientation only re-resolves on a real remount, so key both the wrapper and the inner viewer
            key={String(openDetails)}
            documentKey={String(openDetails)}
            document={
              <FuelVoucherInvoicePDF
                invoice={invoiceToView}
                organization={organization}
                dictionary={dictionary}
                summarize={!openDetails}
              />
            }
            fileName={`Invoice ${invoiceToView.invoice_no.replace('/', '-')}${
              openDetails ? ' Detailed' : ' Summary'
            }`}
          />
        </DialogContent>
        <DialogActions>
          <Button size='small' onClick={() => closeDialog?.(false)}>{t.close}</Button>
        </DialogActions>
      </>
    );
  }

  return (
    <>
      <DialogTitle textAlign='center'>{title}</DialogTitle>
      <DialogContent>
        <>
            <Grid container columnSpacing={1} rowSpacing={1} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 12, md: 4 }}>
                <StakeholderSelector
                  label={t.customer}
                  onChange={(value) => {
                    setCustomer(value);
                    setVouchers(null);
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Autocomplete
                  size='small'
                  options={stations ?? []}
                  value={station}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  getOptionLabel={(option) => option.name}
                  renderInput={(params) => (
                    <TextField {...params} label={t.stationOptional} />
                  )}
                  onChange={(event, value) => {
                    setStation(value);
                    setVouchers(null);
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <DateTimePicker
                  label={t.from}
                  value={from}
                  ampm={false}
                  minDate={dayjs(organization.recording_start_date)}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  onChange={(value) => {
                    setFrom(value);
                    setVouchers(null);
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <DateTimePicker
                  label={t.to}
                  value={to}
                  ampm={false}
                  minDate={from}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  onChange={(value) => {
                    setTo(value);
                    setVouchers(null);
                  }}
                />
              </Grid>
              <Grid size={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <LoadingButton
                  size='small'
                  variant='contained'
                  loading={isLoadingVouchers}
                  onClick={loadVouchers}
                >{t.findVouchers}</LoadingButton>
              </Grid>
            </Grid>

            {/* Invoice details come before the voucher list, as on the Sales invoice form */}
            <Grid container columnSpacing={1} rowSpacing={1} sx={{ mt: 1 }}>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <DatePicker
                      label={t.invoiceDate}
                      value={invoiceDate}
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                      onChange={setInvoiceDate}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <DatePicker
                      label={t.dueDate}
                      value={dueDate}
                      minDate={invoiceDate ?? undefined}
                      slotProps={{
                        textField: { size: 'small', fullWidth: true },
                        field: { clearable: true },
                      }}
                      onChange={setDueDate}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      size='small'
                      fullWidth
                      label={t.internalReference}
                      value={internalReference}
                      onChange={(event) => setInternalReference(event.target.value)}
                      inputProps={{ maxLength: 191 }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      size='small'
                      fullWidth
                      label={t.customerReference}
                      value={customerReference}
                      onChange={(event) => setCustomerReference(event.target.value)}
                      inputProps={{ maxLength: 191 }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Autocomplete
                      freeSolo
                      options={termsSuggestions ?? []}
                      inputValue={terms}
                      onInputChange={(event, value) => setTerms(value)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={t.termsAndInstructions}
                          size='small'
                          fullWidth
                          multiline
                          minRows={2}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      size='small'
                      fullWidth
                      multiline
                      minRows={2}
                      label={t.narration}
                      value={narration}
                      onChange={(event) => setNarration(event.target.value)}
                      inputProps={{ maxLength: 500 }}
                    />
                  </Grid>
            </Grid>

            {isLoadingVouchers ? (
              <Skeleton variant='rectangular' height={120} sx={{ mt: 2 }} />
            ) : vouchers === null ? (
              <Alert variant='outlined' severity='info' sx={{ mt: 2 }}>{t.chooseCustomer}</Alert>
            ) : vouchers.length === 0 ? (
              <Alert variant='outlined' severity='info' sx={{ mt: 2 }}>{t.noUninvoiced}</Alert>
            ) : (
              <>
                {/* The figure being invoiced, right above the vouchers it comes from */}
                <Box
                  sx={{
                    mt: 2,
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Typography color='inherit'>
                    {t.vouchersSelected.replace('{selected}', selectedIds.length).replace('{total}', vouchers.length)}
                  </Typography>
                  <Typography variant='h5' color='inherit' mb={0}>
                    {t.totalAmount.replace('{amount}', money(selectedTotal))}
                  </Typography>
                </Box>

                <TextField
                  size='small'
                  fullWidth
                  sx={{ mt: 1 }}
                  placeholder={t.searchPlaceholder}
                  value={voucherKeyword}
                  onChange={(event) => setVoucherKeyword(event.target.value)}
                  helperText={
                    needle
                      ? t.showingOf.replace('{shown}', visibleVouchers.length).replace('{total}', vouchers.length)
                      : undefined
                  }
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position='start'>
                          <SearchOutlined fontSize='small' />
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                {needle && visibleVouchers.length === 0 ? (
                  <Alert variant='outlined' severity='info' sx={{ mt: 1 }}>
                    {t.noMatch.replace('{keyword}', voucherKeyword)}
                  </Alert>
                ) : (
                <TableContainer component={Paper} sx={{ mt: 1, overflowX: 'auto' }}>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell padding='checkbox'>
                          <Checkbox
                            size='small'
                            checked={
                              visibleVouchers.length > 0 &&
                              visibleSelectedCount === visibleVouchers.length
                            }
                            indeterminate={
                              visibleSelectedCount > 0 &&
                              visibleSelectedCount < visibleVouchers.length
                            }
                            onChange={(event) => toggleVisible(event.target.checked)}
                          />
                        </TableCell>
                        <TableCell>{t.date}</TableCell>
                        <TableCell>{t.voucherNo}</TableCell>
                        <TableCell>{t.station}</TableCell>
                        <TableCell>{t.product}</TableCell>
                        <TableCell>{t.reference}</TableCell>
                        <TableCell>{t.narration}</TableCell>
                        <TableCell align='right'>{t.qty}</TableCell>
                        <TableCell align='right'>{t.price}</TableCell>
                        <TableCell align='right'>{t.amount}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {visibleVouchers.map((voucher) => (
                        <TableRow key={voucher.id} hover>
                          <TableCell padding='checkbox'>
                            <Checkbox
                              size='small'
                              checked={selectedIds.includes(voucher.id)}
                              onChange={() => toggle(voucher.id)}
                            />
                          </TableCell>
                          <TableCell>{readableDate(voucher.date)}</TableCell>
                          <TableCell>{voucher.voucherNo}</TableCell>
                          <TableCell>{voucher.station}</TableCell>
                          <TableCell>{voucher.product}</TableCell>
                          <TableCell>{voucher.reference}</TableCell>
                          <TableCell>{voucher.narration}</TableCell>
                          <TableCell align='right'>
                            {`${voucher.quantity?.toLocaleString('en-US')}${voucher.unit ? ` ${voucher.unit}` : ''}`}
                          </TableCell>
                          <TableCell align='right'>{money(voucher.price)}</TableCell>
                          <TableCell align='right'>{money(voucher.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                )}
              </>
            )}
        </>
      </DialogContent>
      <DialogActions>
        <Button size='small' onClick={() => closeDialog?.(false)}>{t.cancel}</Button>
        <LoadingButton
          size='small'
          variant='contained'
          loading={isCreating}
          disabled={
            selectedIds.length === 0 ||
            !invoiceDate ||
            (!!dueDate && dueDate.isBefore(invoiceDate, 'day'))
          }
          onClick={createInvoice}
        >{t.generateInvoice}</LoadingButton>
      </DialogActions>
    </>
  );
}

export default FuelVoucherInvoices;
