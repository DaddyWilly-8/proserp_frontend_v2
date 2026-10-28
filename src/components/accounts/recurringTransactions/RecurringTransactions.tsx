'use client';

import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import PageLoadingSkeleton from '@/shared/ProgressIndicators/PageLoadingSkeleton';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import UnsubscribedAccess from '@/shared/Information/UnsubscribedAccess';
import { MODULES } from '@/utilities/constants/modules';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { Card, Grid, MenuItem, TextField, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useEffect, useRef, useState } from 'react';
import RecurringTransactionListItem from './RecurringTransactionListItem';
import recurringTransactionServices from './recurringTransactions-services';

const RecurringTransactions = () => {
  const listRef = useRef<any>(null);
  const { organizationHasSubscribed, checkOrganizationPermission } = useJumboAuth();
  const [mounted, setMounted] = useState(false);
  const dictionary = useDictionary();
  const t = dictionary.recurringTransactions;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [queryOptions, setQueryOptions] = useState({
    queryKey: 'recurringTransactions',
    queryParams: { status: '', transaction_type: '', keyword: '' },
    countKey: 'total',
    dataKey: 'data',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const renderItem = React.useCallback(
    (schedule: any, view?: 'list' | 'grid' | 'table') => <RecurringTransactionListItem schedule={schedule} view={view} />,
    []
  );

  const setFilter = React.useCallback((key: string, value: string) => {
    setQueryOptions((state) => ({ ...state, queryParams: { ...state.queryParams, [key]: value } }));
  }, []);

  const tableHeader = [
    t.list.labels.name,
    t.list.labels.schedule,
    t.list.labels.amount,
    t.list.labels.next,
    t.list.labels.progress,
    t.list.labels.status,
    t.list.labels.actions,
  ];

  if (!mounted) return <PageLoadingSkeleton />;

  if (!organizationHasSubscribed(MODULES.ACCOUNTS_AND_FINANCE)) {
    return <UnsubscribedAccess modules={'Accounts & Finance'} />;
  }

  if (!checkOrganizationPermission([PERMISSIONS.RECURRING_TRANSACTIONS_READ])) {
    return <UnauthorizedAccess />;
  }

  return (
    <>
      <Typography variant={'h4'} mb={2}>
        {t.list.labels.listHeader}
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        {t.list.labels.howToCreate}
      </Typography>
      <JumboRqList
        ref={listRef}
        wrapperComponent={Card}
        service={recurringTransactionServices.getList}
        primaryKey={'id'}
        queryOptions={queryOptions}
        itemsPerPage={10}
        itemsPerPageOptions={[5, 8, 10, 15, 20]}
        renderItem={renderItem}
        view={isMobile ? 'list' : 'table'}
        tableHeader={tableHeader}
        componentElement={'div'}
        wrapperSx={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        toolbar={
          <JumboListToolbar
            hideItemsPerPage={true}
            action={
              <Grid container columnSpacing={1} rowSpacing={1} justifyContent="flex-end">
                <Grid size={{ xs: 12, sm: 4, lg: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label={t.list.labels.search}
                    value={queryOptions.queryParams.keyword}
                    onChange={(e) => setFilter('keyword', e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 4, lg: 3 }}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label={t.list.labels.type}
                    value={queryOptions.queryParams.transaction_type}
                    onChange={(e) => setFilter('transaction_type', e.target.value)}
                  >
                    <MenuItem value="">{t.list.labels.allTypes}</MenuItem>
                    {Object.keys(t.list.types).map((type) => (
                      <MenuItem key={type} value={type}>{(t.list.types as Record<string, string>)[type]}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 6, sm: 4, lg: 3 }}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label={t.list.labels.status}
                    value={queryOptions.queryParams.status}
                    onChange={(e) => setFilter('status', e.target.value)}
                  >
                    <MenuItem value="">{t.list.labels.allStatuses}</MenuItem>
                    {Object.keys(t.list.status).map((status) => (
                      <MenuItem key={status} value={status}>{(t.list.status as Record<string, string>)[status]}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            }
          />
        }
      />
    </>
  );
};

export default RecurringTransactions;
