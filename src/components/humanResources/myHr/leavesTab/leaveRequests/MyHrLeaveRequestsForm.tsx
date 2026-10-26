'use client';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

import { LeaveRequestType } from '@/components/humanResources/employees/profile/leaveRequests/LeaveRequestType';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
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
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useEffect, useMemo, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import humanResourcesServices from '../../../humanResourcesServices';
import { computeLeaveDays } from '../../../leaveTypes/leaveDayCount';
import { LeaveType } from '../../../leaveTypes/LeaveTypesType';

interface LeaveRequestFormProps {
  setOpenDialog: (open: boolean) => void;
  leaveRequest?: LeaveRequestType | null;
  employeeId?: number;
}

interface FormData {
  id?: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason?: string;
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

const MyHrLeaveRequestsForm = ({
  setOpenDialog,
  leaveRequest = null,
}: LeaveRequestFormProps) => {
  const dictionary = useDictionary();
  const t = dictionary.humanResources.myHr.leaves.requests.form;
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { data: leaveTypesResponse, isFetching: fetchingLeaveTypes } = useQuery(
    {
      queryKey: ['fetchLeaveTypesForLeaveRequestForm'],
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
    mutate: addLeaveRequest,
    isPending,
    error,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.myHrAddLeaveRequests,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar(t.messages.created, {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['myHrLeaveRequests'] });
    },
    onError: (mutationError) => {
      enqueueSnackbar(getErrorMessage(mutationError), { variant: 'error' });
    },
  });

  const {
    mutate: updateLeaveRequest,
    isPending: updateIsPending,
    error: updateError,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.updateLeaveRequest,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar(t.messages.updated, {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
    },
    onError: (mutationError) => {
      let message = t.messages.somethingWentWrong;

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
    leave_type_id: yup.number().required(t.errors.leaveTypeRequired),
    start_date: yup.string().required(t.errors.startDateRequired),
    end_date: yup.string().required(t.errors.endDateRequired),
    days_requested: yup
      .number()
      .typeError(t.errors.daysNumber)
      .required(t.errors.daysRequired)
      .min(0.5, t.errors.daysMin),
    reason: yup.string().max(1000, t.errors.reasonMax),
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: leaveRequest?.id,
      leave_type_id: leaveRequest?.leave_type_id,
      start_date: leaveRequest?.start_date || '',
      end_date: leaveRequest?.end_date || '',
      days_requested: leaveRequest?.days_requested ?? 1,
      reason: leaveRequest?.reason || '',
    },
  });

  useEffect(() => {
    reset({
      id: leaveRequest?.id,
      leave_type_id: leaveRequest?.leave_type_id,
      start_date: leaveRequest?.start_date || '',
      end_date: leaveRequest?.end_date || '',
      days_requested: leaveRequest?.days_requested ?? 1,
      reason: leaveRequest?.reason || '',
    });
  }, [leaveRequest, reset]);

  const saveMutation = useMemo(() => {
    return leaveRequest?.id ? updateLeaveRequest : addLeaveRequest;
  }, [leaveRequest?.id, updateLeaveRequest, addLeaveRequest]);

  const watchedLeaveTypeId = watch('leave_type_id');
  const watchedStartDate = watch('start_date');
  const watchedEndDate = watch('end_date');
  const watchedDaysRequested = watch('days_requested');

  const selectedLeaveType = useMemo(
    () => leaveTypes.find((type) => type.id === watchedLeaveTypeId),
    [leaveTypes, watchedLeaveTypeId]
  );

  // What days_requested actually should be for the picked type/dates — a
  // plain calendar span, or with Saturday/Sunday excluded per whatever this
  // leave type's own convention is (LeaveType.excludes_saturday/excludes_sunday).
  const computedDays = useMemo(
    () =>
      computeLeaveDays(
        watchedStartDate,
        watchedEndDate,
        !!selectedLeaveType?.excludes_saturday,
        !!selectedLeaveType?.excludes_sunday
      ),
    [
      watchedStartDate,
      watchedEndDate,
      selectedLeaveType?.excludes_saturday,
      selectedLeaveType?.excludes_sunday,
    ]
  );

  // Auto-fills days_requested whenever the type or dates actually change —
  // skips the render right after reset() (opening the dialog, or switching
  // which leaveRequest is being edited) so an existing request's stored
  // days_requested isn't silently overwritten just from being opened; only
  // a real edit to type/dates recomputes it. The user can still hand-edit
  // the field afterward — that only gets reset if type/dates change again.
  const skipNextAutoDays = useRef(true);
  useEffect(() => {
    skipNextAutoDays.current = true;
  }, [leaveRequest]);
  useEffect(() => {
    if (skipNextAutoDays.current) {
      skipNextAutoDays.current = false;
      return;
    }
    if (computedDays !== null) {
      setValue('days_requested', computedDays, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [computedDays, setValue]);

  const excludedDaysLabel = [
    selectedLeaveType?.excludes_saturday && t.hint.saturdays,
    selectedLeaveType?.excludes_sunday && t.hint.sundays,
  ]
    .filter(Boolean)
    .join(t.hint.and);

  const daysRequestedHint =
    computedDays === null
      ? undefined
      : (Number(watchedDaysRequested) !== computedDays
          ? t.hint.differs
          : t.hint.matches
        )
          .replace(
            '{days}',
            `${computedDays} ${computedDays === 1 ? t.hint.day : t.hint.days}`
          )
          .replace(
            '{excluded}',
            excludedDaysLabel
              ? t.hint.excluded.replace('{label}', excludedDaysLabel)
              : ''
          );

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
          {!leaveRequest?.id ? t.createTitle : t.editTitle}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <Grid container rowSpacing={{ xs: 1, md: 2 }} spacing={1}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                {fetchingLeaveTypes ? (
                  <LinearProgress />
                ) : (
                  <Controller
                    name='leave_type_id'
                    control={control}
                    rules={{ required: t.errors.leaveTypeRequired }}
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
                        onChange={(_event, newValue) => {
                          field.onChange(newValue?.id || null);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={t.labels.leaveType}
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
                <TextField
                  label={t.labels.daysRequested}
                  size='small'
                  fullWidth
                  error={
                    !!errors?.days_requested ||
                    !!getValidationMessage(validationErrors, 'days_requested')
                  }
                  helperText={
                    errors.days_requested?.message ||
                    getValidationMessage(validationErrors, 'days_requested') ||
                    daysRequestedHint
                  }
                  slotProps={{
                    formHelperText: {
                      sx: {
                        color:
                          !errors?.days_requested &&
                          computedDays !== null &&
                          Number(watchedDaysRequested) !== computedDays
                            ? 'warning.main'
                            : undefined,
                      },
                    },
                  }}
                  {...register('days_requested')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='start_date'
                  control={control}
                  render={({ field }) => (
                    <DateTimePicker
                      label={t.labels.startDate}
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(newValue) => {
                        field.onChange(newValue ? newValue.toISOString() : '');
                      }}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          error:
                            !!errors?.start_date ||
                            !!getValidationMessage(
                              validationErrors,
                              'start_date'
                            ),
                          helperText:
                            errors.start_date?.message ||
                            getValidationMessage(
                              validationErrors,
                              'start_date'
                            ),
                        },
                      }}
                    />
                  )}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='end_date'
                  control={control}
                  render={({ field }) => (
                    <DateTimePicker
                      label={t.labels.endDate}
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(newValue) => {
                        field.onChange(newValue ? newValue.toISOString() : '');
                      }}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          error:
                            !!errors?.end_date ||
                            !!getValidationMessage(
                              validationErrors,
                              'end_date'
                            ),
                          helperText:
                            errors.end_date?.message ||
                            getValidationMessage(validationErrors, 'end_date'),
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
                  label={t.labels.reason}
                  size='small'
                  fullWidth
                  multiline
                  minRows={2}
                  error={
                    !!errors?.reason ||
                    !!getValidationMessage(validationErrors, 'reason')
                  }
                  helperText={
                    errors.reason?.message ||
                    getValidationMessage(validationErrors, 'reason')
                  }
                  {...register('reason')}
                />
              </Div>
            </Grid>
          </Grid>

          <DialogActions>
            <Button size='small' onClick={() => setOpenDialog(false)}>
              {t.buttons.cancel}
            </Button>
            <LoadingButton
              type='submit'
              variant='contained'
              size='small'
              sx={{ display: 'flex' }}
              loading={isPending || updateIsPending}
            >
              {t.buttons.submit}
            </LoadingButton>
          </DialogActions>
        </form>
      </DialogContent>
    </>
  );
};

export default MyHrLeaveRequestsForm;
