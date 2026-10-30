'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import UnsubscribedAccess from '@/shared/Information/UnsubscribedAccess';
import { MODULES } from '@/utilities/constants/modules';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import FuelVoucherInvoices from '@/components/fuelStation/reports/fuelVoucherInvoices/FuelVoucherInvoices';
import StakeholderSelectProvider from '@/components/masters/stakeholders/StakeholderSelectProvider';
import { AddOutlined, EventAvailableOutlined, FilterAltOffOutlined, FilterAltOutlined } from '@mui/icons-material';
import { Card, Dialog, Grid, IconButton, MenuItem, TextField, Tooltip, Typography, useMediaQuery } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import customerInvoiceServices from '../invoices/customerInvoice-services';
import CustomerInvoiceListItem from './CustomerInvoiceListItem';
import { CustomerInvoice } from './CustomerInvoiceType';
import PageLoadingSkeleton from '@/shared/ProgressIndicators/PageLoadingSkeleton';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface FilterDate {
  from?: string | null;
  to?: string | null;
}

interface QueryOptions {
  queryKey: string;
  queryParams: {
    keyword: string;
    source?: string;
    from?: string | null;
    to?: string | null;
  };
  countKey: string;
  dataKey: string;
}

const CustomerInvoices = () => {
  const dictionary = useDictionary();
  const searchParams = useSearchParams();
  const listRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);
  const [openFilters, setOpenFilters] = useState(false);
  const [openFuelInvoiceDialog, setOpenFuelInvoiceDialog] = useState(false);
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const [filterDate, setFilterDate] = useState<FilterDate>({});
  const { authOrganization, checkOrganizationPermission, organizationHasSubscribed } = useJumboAuth();

  // Organizations running Fuel Stations also get Fuel Voucher invoices in this list: a type
  // filter is always on show for them, and picking Fuel Voucher Invoices offers a + to raise one
  const hasFuelStations = organizationHasSubscribed(MODULES.FUEL_STATION);
  const hasPointOfSale = organizationHasSubscribed(MODULES.POINT_OF_SALE);
  const hasProjectManagement = organizationHasSubscribed(MODULES.PROJECT_MANAGEMENT);

  // Only offer the invoice types this organization can actually have: Sales invoices come from
  // Point of Sale, IPC invoices from Project Management. "Customer Invoices" (both together) is
  // only worth a separate entry next to Fuel Voucher Invoices.
  const groupCustomerInvoices = hasFuelStations && (hasPointOfSale || hasProjectManagement);
  const invoiceTypeOptions = [
    { value: '', label: 'All', indent: false },
    ...(groupCustomerInvoices ? [{ value: 'customer_invoice', label: 'Customer Invoices', indent: false }] : []),
    ...(hasPointOfSale ? [{ value: 'sale', label: 'Sales', indent: groupCustomerInvoices }] : []),
    ...(hasProjectManagement
      ? [{ value: 'project_claim', label: 'Project Payment Claims (IPC)', indent: groupCustomerInvoices }]
      : []),
    ...(hasFuelStations ? [{ value: 'fuel_voucher', label: 'Fuel Voucher Invoices', indent: false }] : []),
  ];
  const canCreateFuelInvoices =
    hasFuelStations &&
    checkOrganizationPermission([PERMISSIONS.STORES_REPORTS, PERMISSIONS.FUEL_STATIONS_REPORTS]);

  const [queryOptions, setQueryOptions] = useState<QueryOptions>({
    queryKey: 'customer-invoices',
    queryParams: {
      keyword: searchParams?.get('search') || '',
      source: '',
    },
    countKey: 'total',
    dataKey: 'data',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOnKeywordChange = useCallback((keyword: string) => {
    setQueryOptions((prev) => ({
      ...prev,
      queryParams: { ...prev.queryParams, keyword },
    }));
  }, []);

  const handleSourceChange = useCallback((source: string) => {
    setQueryOptions((prev) => ({
      ...prev,
      queryParams: { ...prev.queryParams, source },
    }));
  }, []);

  const handleDateChange = useCallback((date: Dayjs | null, field: 'from' | 'to') => {
    setFilterDate((prev) => ({
      ...prev,
      [field]: date?.toISOString() || null,
    }));
  }, []);

  const applyDateFilters = useCallback(() => {
    setQueryOptions((prev) => ({
      ...prev,
      queryParams: { ...prev.queryParams, from: filterDate.from, to: filterDate.to },
    }));
  }, [filterDate.from, filterDate.to]);

  const resetFilters = useCallback(() => {
    setOpenFilters(false);
    setFilterDate({ from: null, to: null });
    setQueryOptions((prev) => ({
      ...prev,
      queryParams: { ...prev.queryParams, from: null, to: null, source: '' },
    }));
  }, []);

  const renderInvoice = useCallback(
    (invoice: CustomerInvoice) => <CustomerInvoiceListItem invoice={invoice} />,
    []
  );

  if (!mounted) return <PageLoadingSkeleton />;

  if (!organizationHasSubscribed(MODULES.ACCOUNTS_AND_FINANCE)) {
    return <UnsubscribedAccess modules='Accounts & Finance' />;
  }

  if (!checkOrganizationPermission([PERMISSIONS.ACCOUNTS_TRANSACTIONS_READ])) {
    return <UnauthorizedAccess />;
  }

  return (
    <>
      <Typography variant='h4' mb={2}>
        Customer Invoices
      </Typography>
      <JumboRqList
        ref={listRef}
        wrapperComponent={Card}
        service={customerInvoiceServices.getList}
        primaryKey='list_key'
        queryOptions={queryOptions}
        itemsPerPage={10}
        itemsPerPageOptions={[10, 20, 30, 50, 100]}
        renderItem={renderInvoice}
        componentElement='div'
        wrapperSx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
        toolbar={
          <JumboListToolbar
            hideItemsPerPage
            action={
              // Same arrangement as the Purchases / Requisitions lists: date range on demand, the
              // type selector in a responsive grid, then filter toggle + search (+ new)
              <Grid container columnSpacing={1} rowSpacing={1} justifyContent='end' alignItems='center'>
                {openFilters && (
                  <Grid size={12}>
                    <Grid container spacing={1}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <DateTimePicker
                          label='From'
                          value={filterDate.from ? dayjs(filterDate.from) : null}
                          minDate={dayjs(authOrganization?.organization?.recording_start_date)}
                          slotProps={{ textField: { size: 'small', fullWidth: true } }}
                          onChange={(value) => handleDateChange(value, 'from')}
                        />
                      </Grid>
                      <Grid size={{ xs: 'grow', md: 5.5 }}>
                        <DateTimePicker
                          label='To'
                          value={filterDate.to ? dayjs(filterDate.to) : null}
                          minDate={filterDate.from ? dayjs(filterDate.from) : undefined}
                          slotProps={{ textField: { size: 'small', fullWidth: true } }}
                          onChange={(value) => handleDateChange(value, 'to')}
                        />
                      </Grid>
                      <Grid size={{ xs: 'auto', md: 0.5 }} alignContent='end'>
                        <Tooltip title={dictionary.tooltips.filterDates}>
                          <IconButton onClick={applyDateFilters}>
                            <EventAvailableOutlined />
                          </IconButton>
                        </Tooltip>
                      </Grid>
                    </Grid>
                  </Grid>
                )}

                {/* Nothing to choose between when "All" is the only type */}
                {invoiceTypeOptions.length > 1 && (
                  <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                    <TextField
                      select
                      size='small'
                      fullWidth
                      label='Invoice Type'
                      value={queryOptions.queryParams.source ?? ''}
                      onChange={(event) => handleSourceChange(event.target.value)}
                    >
                      {invoiceTypeOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value} sx={option.indent ? { pl: 4 } : undefined}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                )}

                <Grid size='auto'>
                  <Tooltip title={!openFilters ? 'Filter' : 'Clear Filters'}>
                    <IconButton size='small' onClick={!openFilters ? () => setOpenFilters(true) : resetFilters}>
                      {!openFilters ? <FilterAltOutlined /> : <FilterAltOffOutlined />}
                    </IconButton>
                  </Tooltip>
                </Grid>

                <Grid size={{ xs: 'grow', lg: 5 }}>
                  <JumboSearch
                    onChange={handleOnKeywordChange}
                    value={queryOptions.queryParams.keyword}
                    placeholder='Search by invoice no, customer, reference...'
                  />
                </Grid>

                {canCreateFuelInvoices && queryOptions.queryParams.source === 'fuel_voucher' && (
                  <Grid size='auto'>
                    <Tooltip title={dictionary.tooltips.newFuelVoucherInvoice}>
                      <IconButton size='small' color='primary' onClick={() => setOpenFuelInvoiceDialog(true)}>
                        <AddOutlined />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                )}
              </Grid>
            }
          />
        }
      />
      {canCreateFuelInvoices && (
        <Dialog
          open={openFuelInvoiceDialog}
          onClose={() => setOpenFuelInvoiceDialog(false)}
          fullWidth
          maxWidth='lg'
          fullScreen={belowLargeScreen}
          scroll='paper'
        >
          {openFuelInvoiceDialog && (
            <StakeholderSelectProvider>
              <FuelVoucherInvoices closeDialog={setOpenFuelInvoiceDialog} />
            </StakeholderSelectProvider>
          )}
        </Dialog>
      )}
    </>
  );
};

export default CustomerInvoices;
