'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { LoadingButton } from '@mui/lab';
import {
  Autocomplete,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  LinearProgress,
  TextField,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import humanResourcesServices from '../../../humanResourcesServices';
import { LeaveType } from '../../../leaveTypes/LeaveTypesType';
import { LeaveAllocationType } from './LeaveAllocationType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface LeaveAllocationFormProps {
  setOpenDialog: (open: boolean) => void;
  leaveAllocation?: LeaveAllocationType | null;
  employeeId?: number;
}

interface FormData extends Omit<LeaveAllocationType, 'id' | 'created_by'> {
  id?: number;
}

interface ApiResponse {
  message: string;
  validation_errors?: Record<string, string[] | string>;
}

const getValidationMessage = (
  validationErrors: Record<string, string[] | string> | undefined,
  field: string
) => {
  const message = validationErrors?.[field];
  if (!message) return undefined;
  return Array.isArray(message) ? message[0] : message;
};

const LeaveAllocationForm = ({
  setOpenDialog,
  leaveAllocation = null,
  employeeId,
}: LeaveAllocationFormProps) => {
  const dictionary = useDictionary();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { data: leaveTypesResponse, isFetching: fetchingLeaveTypes } = useQuery(
    {
      queryKey: ['fetchLeaveTypesForLeaveAllocationForm'],
      queryFn: async () => {
        return humanResourcesServices.getLeaveTypesList({
          page: 1,
          limit: 200,
        });
      },
    }
  );

  const leaveTypes = (leaveTypesResponse?.data || []) as LeaveType[];

  const {
    mutate: addLeaveAllocation,
    isPending,
    error,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.addLeaveAllocation,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar(dictionary.humanResources.leaveAllocations.messages.added, {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['leaveAllocations'] });
    },
    onError: (mutationError) => {
      let message = dictionary.humanResources.profileSectionsCommon.somethingWentWrong;

      if (
        typeof mutationError === 'object' &&
        mutationError !== null &&
        'response' in mutationError &&
        typeof (mutationError as any).response?.data?.message === 'string'
      ) {
        message = (mutationError as any).response.data.message;
      } else if (mutationError instanceof Error) {
        message = mutationError.message;
      }
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const {
    mutate: updateLeaveAllocation,
    isPending: updateIsPending,
    error: updateError,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.updateLeaveAllocation,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar(dictionary.humanResources.leaveAllocations.messages.updated, {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['leaveAllocations'] });
    },
    onError: (mutationError) => {
      let message = dictionary.humanResources.profileSectionsCommon.somethingWentWrong;

      if (
        typeof mutationError === 'object' &&
        mutationError !== null &&
        'response' in mutationError &&
        typeof (mutationError as any).response?.data?.message === 'string'
      ) {
        message = (mutationError as any).response.data.message;
      } else if (mutationError instanceof Error) {
        message = mutationError.message;
      }
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const validationSchema = yup.object({
    id: yup.number().optional(),
    leave_type_id: yup.number().required(dictionary.humanResources.leaveAllocations.form.validation.leaveTypeRequired),
    start_date: yup.string().required(dictionary.humanResources.leaveAllocations.form.validation.startDateRequired),
    allocated_days: yup
      .number()
      .typeError(dictionary.humanResources.leaveAllocations.form.validation.allocatedDaysNumber)
      .required(dictionary.humanResources.leaveAllocations.form.validation.allocatedDaysRequired)
      .min(0.5, dictionary.humanResources.leaveAllocations.form.validation.allocatedDaysMin),
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: leaveAllocation?.id,
      employee_id: leaveAllocation?.employee_id,
      leave_type_id: leaveAllocation?.leave_type_id,
      start_date:
        leaveAllocation?.start_date ?? dayjs().format('YYYY-MM-DD'),
      allocated_days: leaveAllocation?.allocated_days ?? 1,
    },
  });

  useEffect(() => {
    reset({
      id: leaveAllocation?.id,
      employee_id: leaveAllocation?.employee_id,
      leave_type_id: leaveAllocation?.leave_type_id,
      start_date:
        leaveAllocation?.start_date ?? dayjs().format('YYYY-MM-DD'),
      allocated_days: leaveAllocation?.allocated_days ?? 1,
    });
  }, [leaveAllocation, reset]);

  useEffect(() => {
    if (employeeId) setValue('employee_id', employeeId);
  }, [employeeId, setValue]);

  const saveMutation = useMemo(() => {
    return leaveAllocation?.id ? updateLeaveAllocation : addLeaveAllocation;
  }, [leaveAllocation?.id, updateLeaveAllocation, addLeaveAllocation]);

  const validationErrors =
    error?.response?.data?.validation_errors ||
    updateError?.response?.data?.validation_errors;

  const onSubmit = (data: FormData) => {
    saveMutation(data);
  };

  return (
    <>
      <DialogTitle>
        <Grid size={12} textAlign={'center'}>
          {!leaveAllocation?.id
            ? dictionary.humanResources.leaveAllocations.form.addTitle
            : dictionary.humanResources.leaveAllocations.form.editTitle}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <Grid container rowSpacing={{ xs: 1, md: 2 }} spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                {fetchingLeaveTypes ? (
                  <LinearProgress />
                ) : (
                  <Controller
                    name='leave_type_id'
                    control={control}
                    rules={{ required: dictionary.humanResources.leaveAllocations.form.validation.leaveTypeRequired }}
                    render={({ field, fieldState }) => (
                      <Autocomplete
                        size='small'
                        options={leaveTypes}
                        isOptionEqualToValue={(option, value) =>
                          option.id === value.id
                        }
                        getOptionLabel={(option) => option.name || ''}
                        value={
                          leaveTypes.find((type) => type.id === field.value) ||
                          null
                        }
                        onChange={(event, newValue) => {
                          field.onChange(newValue?.id || null);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={dictionary.humanResources.leaveAllocations.form.labels.leaveType}
                            error={
                              !!fieldState.error ||
                              !!getValidationMessage(
                                validationErrors,
                                'leave_type_id'
                              )
                            }
                            helperText={
                              fieldState.error?.message ||
                              getValidationMessage(
                                validationErrors,
                                'leave_type_id'
                              )
                            }
                          />
                        )}
                      />
                    )}
                  />
                )}
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='start_date'
                  control={control}
                  render={({ field, fieldState }) => (
                    <DatePicker
                      label={dictionary.humanResources.leaveAllocations.form.labels.startDate}
                      disabled={!!leaveAllocation?.id}
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(val) =>
                        field.onChange(val?.format('YYYY-MM-DD') || '')
                      }
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          error:
                            !!fieldState.error ||
                            !!getValidationMessage(
                              validationErrors,
                              'start_date'
                            ),
                          helperText:
                            fieldState.error?.message ||
                            getValidationMessage(
                              validationErrors,
                              'start_date'
                            ) ||
                            (leaveAllocation?.id
                              ? dictionary.humanResources.leaveAllocations.form.helper.cannotChange
                              : dictionary.humanResources.leaveAllocations.form.helper.startDate),
                        },
                      }}
                    />
                  )}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label={dictionary.humanResources.leaveAllocations.form.labels.allocatedDays}
                  size='small'
                  fullWidth
                  error={
                    !!errors?.allocated_days ||
                    !!getValidationMessage(validationErrors, 'allocated_days')
                  }
                  helperText={
                    errors.allocated_days?.message ||
                    getValidationMessage(validationErrors, 'allocated_days')
                  }
                  {...register('allocated_days')}
                />
              </Div>
            </Grid>
          </Grid>

          <DialogActions>
            <Button size='small' onClick={() => setOpenDialog(false)}>
              {dictionary.humanResources.profileSectionsCommon.cancel}
            </Button>
            <LoadingButton
              type='submit'
              variant='contained'
              size='small'
              sx={{ display: 'flex' }}
              loading={isPending || updateIsPending}
            >
              {dictionary.humanResources.profileSectionsCommon.submit}
            </LoadingButton>
          </DialogActions>
        </form>
      </DialogContent>
    </>
  );
};

export default LeaveAllocationForm;
