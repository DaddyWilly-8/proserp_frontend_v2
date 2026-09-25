'use client';
import CurrencySelectProvider from '@/components/masters/Currencies/CurrencySelectProvider';
import { getSanitizedSearchKeyword } from '@/utilities/getSanitizedSearchKeyword';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import { EventAvailableOutlined, FilterAltOffOutlined, FilterAltOutlined } from '@mui/icons-material';
import { Card, Grid, IconButton, Tooltip } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import { useParams, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import imprestRetirementServices from '../imprestRetirements/imprestRetirementServices';
import RetirementsListItem from './RetirementsListItem';
import LedgerSelectProvider from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import CostCenterSelector from '../../masters/costCenters/CostCenterSelector';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';

interface FilterDate {
  from: string | null;
  to: string | null;
}

interface QueryParams {
  id?: string;
  keyword: string;
  cost_center_ids: number[];
  from?: string | null;
  to?: string | null;
}

interface QueryOptions {
  queryKey: string;
  queryParams: QueryParams;
  countKey: string;
  dataKey: string;
}
const Retirements = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const listRef = useRef<any>(null);
  const { checkOrganizationPermission, authOrganization } = useJumboAuth();
  const [openFilters, setOpenFilters] = useState(false);
  const [filterDate, setFilterDate] = useState<FilterDate>({ from: null, to: null });
  const [selectedCostCenter, setSelectedCostCenter] = useState<CostCenter[]>([]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [queryOptions, setQueryOptions] = useState<QueryOptions>({
    queryKey: 'approvedRequisitions',
    queryParams: {
      id: params.id as string,
      keyword: getSanitizedSearchKeyword('Retirements', searchParams),
      cost_center_ids: authOrganization?.costCenters?.map((cost_center: CostCenter) => cost_center.id) || [],
    },
    countKey: 'total',
    dataKey: 'data',
  });

  const renderRetirements = (retirement: any) => {
    return <RetirementsListItem retirement={retirement} />;
  };

  const handleOnChange = useCallback((keyword: string) => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        keyword: keyword,
      },
    }));
  }, []);

  useEffect(() => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        cost_center_ids: selectedCostCenter.map((c) => c.id),
      },
    }));
  }, [selectedCostCenter]);

  const handleDateFilterApply = useCallback(() => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        from: filterDate.from,
        to: filterDate.to,
      },
    }));
  }, [filterDate]);

  const handleClearFilters = useCallback(() => {
    setOpenFilters(false);
    setFilterDate({ from: null, to: null });
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        from: null,
        to: null,
      },
    }));
  }, []);

  if (!checkOrganizationPermission(PERMISSIONS.IMPREST_RETIREMENTS_READ)) {
    return <UnauthorizedAccess />;
  }

  if (!mounted) return null;

  const multiCostCenters = authOrganization?.costCenters?.length > 1;

  return (
    <CurrencySelectProvider>
      <LedgerSelectProvider>
        <JumboRqList
          ref={listRef}
          wrapperComponent={Card}
          service={imprestRetirementServices.list}
          primaryKey='id'
          queryOptions={queryOptions}
          itemsPerPage={10}
          itemsPerPageOptions={[5, 8, 10, 15, 20]}
          renderItem={renderRetirements}
          componentElement='div'
          wrapperSx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
          toolbar={
            <JumboListToolbar
              hideItemsPerPage={true}
              action={
                <Grid
                  container
                  columnSpacing={1}
                  rowSpacing={1}
                  justifyContent={'end'}
                >
                  {openFilters && (
                    <Grid size={{ xs: 12, lg: 12 }}>
                      <Grid container spacing={1}>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <DateTimePicker
                            label="From"
                            value={filterDate.from ? dayjs(filterDate.from) : null}
                            minDate={dayjs(authOrganization?.organization?.recording_start_date)}
                            slotProps={{
                              textField: {
                                size: 'small',
                                fullWidth: true,
                              }
                            }}
                            onChange={(value: Dayjs | null) => {
                              setFilterDate((filters) => ({
                                ...filters,
                                from: value?.toISOString() || null
                              }));
                            }}
                          />
                        </Grid>
                        <Grid size={{ xs: 11, md: 5.5 }}>
                          <DateTimePicker
                            label="To"
                            value={filterDate.to ? dayjs(filterDate.to) : null}
                            minDate={filterDate.from ? dayjs(filterDate.from) : undefined}
                            slotProps={{
                              textField: {
                                size: 'small',
                                fullWidth: true,
                              }
                            }}
                            onChange={(value: Dayjs | null) => {
                              setFilterDate((filters) => ({
                                ...filters,
                                to: value?.toISOString() || null
                              }));
                            }}
                          />
                        </Grid>
                        <Grid size={{ xs: 1, md: 0.5 }} alignContent={'end'}>
                          <Tooltip title="Filter Dates">
                            <IconButton onClick={handleDateFilterApply}>
                              <EventAvailableOutlined />
                            </IconButton>
                          </Tooltip>
                        </Grid>
                      </Grid>
                    </Grid>
                  )}
                  {multiCostCenters && (
                    <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                      <CostCenterSelector
                        label="Cost Centers"
                        allowSameType={true}
                        defaultValue={selectedCostCenter}
                        onChange={(newValue: CostCenter | CostCenter[] | null) => {
                          setSelectedCostCenter(newValue as any);
                        }}
                      />
                    </Grid>
                  )}
                  <Grid size={{ xs: 1, lg: 0.5 }}>
                    <Tooltip title={!openFilters ? 'Filter' : 'Clear Filters'}>
                      <IconButton size='small' onClick={handleClearFilters}>
                        {!openFilters ? <FilterAltOutlined /> : <FilterAltOffOutlined />}
                      </IconButton>
                    </Tooltip>
                  </Grid>
                  <Grid size={{ xs: 11, lg: 5.5 }}>
                    <JumboSearch
                      onChange={handleOnChange}
                      value={queryOptions.queryParams.keyword}
                    />
                  </Grid>
                </Grid>
              }
            />
          }
        />
      </LedgerSelectProvider>
    </CurrencySelectProvider>
  );
};

export default Retirements;
