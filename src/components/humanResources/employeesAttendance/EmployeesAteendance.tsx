'use client';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import {
  Autocomplete,
  Card,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import { useCallback, useEffect, useRef, useState } from 'react';
import EmployeeSelector from '../employees/EmployeeSelector';
import { EmployeesProvider } from '../employees/EmployeesProvider';
import { Employee } from '../employees/EmployeesType';
import humanResourcesServices from '../humanResourcesServices';
import { EmployeeAttendanceType } from './EmployeeAttendanceType';
import EmployeesAteendanceActionTail from './EmployeesAteendanceActionTail';
import EmployeesAteendanceListItem from './EmployeesAteendanceListItem';
import PageLoadingSkeleton from '@/shared/ProgressIndicators/PageLoadingSkeleton';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const EmployeesAttendance = () => {
  const dictionary = useDictionary();
  const TYPE_OPTIONS = [
    { label: dictionary.humanResources.employeesAttendance.list.types.present, value: 'present' },
    { label: dictionary.humanResources.employeesAttendance.list.types.absent, value: 'absent' },
    { label: dictionary.humanResources.employeesAttendance.list.types["on leave"], value: 'on leave' },
  ];
  const listRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  const [selectedEmployees, setSelectedEmployees] = useState<Employee | null>(
    null
  );
  const [type, setType] = useState<any>(null);

  const [queryOptions, setQueryOptions] = useState({
    queryKey: 'employeesAtteance',
    queryParams: { keyword: '', from: '', to: '' },
    countKey: 'total',
    dataKey: 'data',
  });

  useEffect(() => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        employee_id: selectedEmployees?.id ?? null,
      },
    }));
    setMounted(true);
  }, [selectedEmployees]);

  const renderEmployeeAttendace = useCallback(
    (employeeAttendance: EmployeeAttendanceType) => {
      return (
        <EmployeesAteendanceListItem employeeAttendance={employeeAttendance} />
      );
    },
    []
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <PageLoadingSkeleton />;
  return (
    <>
      <Typography variant={'h4'} mb={2}>
        {dictionary.humanResources.employeesAttendance.title}
      </Typography>
      <EmployeesProvider>
        <JumboRqList
          ref={listRef}
          wrapperComponent={Card}
          service={humanResourcesServices.attendanceLIst}
          primaryKey='id'
          queryOptions={queryOptions}
          itemsPerPage={10}
          itemsPerPageOptions={[5, 8, 10, 15, 20]}
          renderItem={renderEmployeeAttendace}
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
                <Grid container spacing={1} justifyContent={'end'}>
                  <Grid size={{ xs: 12, md: 3 }} textAlign={'center'}>
                    <EmployeeSelector
                      value={selectedEmployees}
                      onChange={(value) => {
                        if (value) {
                          Array.isArray(value)
                            ? setSelectedEmployees(value[0])
                            : setSelectedEmployees(value);
                        } else {
                          setSelectedEmployees(null);
                        }
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Autocomplete
                      size='small'
                      options={TYPE_OPTIONS}
                      value={type}
                      isOptionEqualToValue={(option, value) =>
                        option?.value === value?.value
                      }
                      getOptionLabel={(option) => option.label}
                      onChange={(_, newValue) => {
                        setType(newValue);
                        setQueryOptions((state) => ({
                          ...state,
                          queryParams: {
                            ...state.queryParams,
                            type: newValue?.value,
                          },
                        }));
                      }}
                      renderInput={(inputParams) => (
                        <TextField {...inputParams} label={dictionary.humanResources.employeesAttendance.list.labels.status} fullWidth />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <div>
                      <DatePicker
                        label={dictionary.humanResources.employeesAttendance.list.labels.from}
                        value={dayjs(queryOptions.queryParams.from) ?? null}
                        onChange={(value: Dayjs | null) => {
                          if (value) {
                            setQueryOptions((state) => ({
                              ...state,
                              queryParams: {
                                ...state.queryParams,
                                from: value?.toISOString(),
                              },
                            }));
                          }
                        }}
                        slotProps={{
                          textField: {
                            size: 'small',
                            fullWidth: true,
                            error: false,
                          },
                        }}
                      />
                    </div>
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <div>
                      <DatePicker
                        label={dictionary.humanResources.employeesAttendance.list.labels.to}
                        value={dayjs(queryOptions.queryParams.to) ?? null}
                        onChange={(value: Dayjs | null) => {
                          if (value) {
                            setQueryOptions((state) => ({
                              ...state,
                              queryParams: {
                                ...state.queryParams,
                                to: value?.toISOString(),
                              },
                            }));
                          }
                        }}
                        slotProps={{
                          textField: {
                            size: 'small',
                            fullWidth: true,
                            error: false,
                          },
                        }}
                      />
                    </div>
                  </Grid>
                </Grid>
              }
              actionTail={
                <Stack direction='row' justifyContent={'end'}>
                  {/* <JumboSearch
                  onChange={handleOnChange}
                  value={queryOptions.queryParams.keyword}
                /> */}
                  <EmployeesAteendanceActionTail />
                </Stack>
              }
            ></JumboListToolbar>
          }
        />
      </EmployeesProvider>
    </>
  );
};

export default EmployeesAttendance;
