'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import UnsubscribedAccess from '@/shared/Information/UnsubscribedAccess';
import { MODULES } from '@/utilities/constants/modules';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import { EventAvailableOutlined, FilterAltOffOutlined, FilterAltOutlined } from '@mui/icons-material';
import { Card, Grid, IconButton, MenuItem, TextField, Tooltip, Typography } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import customerInvoiceServices from '../invoices/customerInvoice-services';
import CustomerInvoiceListItem from './CustomerInvoiceListItem';
import { CustomerInvoice } from './CustomerInvoiceType';
import PageLoadingSkeleton from '@/shared/ProgressIndicators/PageLoadingSkeleton';

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
  const searchParams = useSearchParams();
  const listRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);
  const [openFilters, setOpenFilters] = useState(false);
  const [filterDate, setFilterDate] = useState<FilterDate>({});
  const { authOrganization, checkOrganizationPermission, organizationHasSubscribed } = useJumboAuth();

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
        primaryKey='id'
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
              <Grid container columnSpacing={1} rowSpacing={1} justifyContent='end'>
                {openFilters && (
                  <Grid size={12}>
                    <Grid container spacing={1}>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                          select
                          size='small'
                          fullWidth
                          label='Source'
                          value={queryOptions.queryParams.source ?? ''}
                          onChange={(event) => handleSourceChange(event.target.value)}
                        >
                          <MenuItem value=''>All invoices</MenuItem>
                          <MenuItem value='sale'>Sales</MenuItem>
                          <MenuItem value='project_claim'>Project Payment Claims (IPC)</MenuItem>
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <DateTimePicker
                          label='From'
                          value={filterDate.from ? dayjs(filterDate.from) : null}
                          minDate={dayjs(authOrganization?.organization?.recording_start_date)}
                          slotProps={{ textField: { size: 'small', fullWidth: true } }}
                          onChange={(value) => handleDateChange(value, 'from')}
                        />
                      </Grid>
                      <Grid size={{ xs: 11, md: 3.5 }}>
                        <DateTimePicker
                          label='To'
                          value={filterDate.to ? dayjs(filterDate.to) : null}
                          minDate={filterDate.from ? dayjs(filterDate.from) : undefined}
                          slotProps={{ textField: { size: 'small', fullWidth: true } }}
                          onChange={(value) => handleDateChange(value, 'to')}
                        />
                      </Grid>
                      <Grid size={{ xs: 1, md: 0.5 }} alignContent='end'>
                        <Tooltip title='Filter Dates'>
                          <IconButton onClick={applyDateFilters}>
                            <EventAvailableOutlined />
                          </IconButton>
                        </Tooltip>
                      </Grid>
                    </Grid>
                  </Grid>
                )}

                <Grid size={{ xs: 1, md: 0.5 }}>
                  <Tooltip title={!openFilters ? 'Filter' : 'Clear Filters'}>
                    <IconButton size='small' onClick={!openFilters ? () => setOpenFilters(true) : resetFilters}>
                      {!openFilters ? <FilterAltOutlined /> : <FilterAltOffOutlined />}
                    </IconButton>
                  </Tooltip>
                </Grid>

                <Grid size={{ xs: 11, md: 11.5 }}>
                  <JumboSearch onChange={handleOnKeywordChange} value={queryOptions.queryParams.keyword} />
                </Grid>
              </Grid>
            }
          />
        }
      />
    </>
  );
};

export default CustomerInvoices;
