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
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import { AllowanceType } from '../../../allowanceTypes/AllowanceType';
import humanResourcesServices from '../../../humanResourcesServices';
import { EmployeeAllowanceType } from './EmployeeAllowanceType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface EmployeeAllowanceFormProps {
  setOpenDialog: (open: boolean) => void;
  employeeAllowance?: EmployeeAllowanceType | null;
  employeeId?: number;
}

interface FormData extends Omit<EmployeeAllowanceType, 'id' | 'created_by'> {
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

const formatCommaSeparatedValue = (
  value: string | number | null | undefined
) => {
  if (value === null || value === undefined || value === '') return '';
  const numericValue = Number(String(value).replace(/,/g, ''));
  return Number.isNaN(numericValue) ? '' : numericValue.toLocaleString('en-US');
};

const EmployeeAllowanceForm = ({
  setOpenDialog,
  employeeAllowance = null,
  employeeId,
}: EmployeeAllowanceFormProps) => {
  const dictionary = useDictionary();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { data: allowanceTypesResponse, isFetching: fetchingAllowanceTypes } =
    useQuery({
      queryKey: ['fetchAllowanceTypesForEmployeeAllowanceForm'],
      queryFn: async () => {
        return humanResourcesServices.getAllowanceTypesList({
          page: 1,
          limit: 200,
        });
      },
    });

  const allowanceTypes = (allowanceTypesResponse?.data ||
    []) as AllowanceType[];

  const {
    mutate: addEmployeeAllowance,
    isPending,
    error,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.addEmployeeAllowance,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar(dictionary.humanResources.employeeAllowances.messages.added, {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['employeeAllowances'] });
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
    mutate: updateEmployeeAllowance,
    isPending: updateIsPending,
    error: updateError,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.updateEmployeeAllowance,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar(dictionary.humanResources.employeeAllowances.messages.updated, {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['employeeAllowances'] });
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
    allowance_type_id: yup.number().required(dictionary.humanResources.employeeAllowances.form.validation.allowanceTypeRequired),
    amount: yup
      .number()
      .typeError(dictionary.humanResources.employeeAllowances.form.validation.amountNumber)
      .required(dictionary.humanResources.employeeAllowances.form.validation.amountRequired)
      .min(0, dictionary.humanResources.employeeAllowances.form.validation.amountMin),
    effective_from: yup.string().required(dictionary.humanResources.employeeAllowances.form.validation.effectiveFromRequired),
    effective_to: yup.string().nullable().optional(),
  });

  const {
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: employeeAllowance?.id,
      employee_id: employeeAllowance?.employee_id,
      allowance_type_id: employeeAllowance?.allowance_type_id,
      amount: employeeAllowance?.amount ?? 0,
      effective_from: employeeAllowance?.effective_from || '',
      effective_to: employeeAllowance?.effective_to || '',
    },
  });

  useEffect(() => {
    reset({
      id: employeeAllowance?.id,
      employee_id: employeeAllowance?.employee_id,
      allowance_type_id: employeeAllowance?.allowance_type_id,
      amount: employeeAllowance?.amount ?? 0,
      effective_from: employeeAllowance?.effective_from || '',
      effective_to: employeeAllowance?.effective_to || '',
    });
  }, [employeeAllowance, reset]);

  useEffect(() => {
    if (employeeId) setValue('employee_id', employeeId);
  }, [employeeId, setValue]);

  const saveMutation = useMemo(() => {
    return employeeAllowance?.id
      ? updateEmployeeAllowance
      : addEmployeeAllowance;
  }, [employeeAllowance?.id, updateEmployeeAllowance, addEmployeeAllowance]);

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
          {!employeeAllowance?.id ? dictionary.humanResources.employeeAllowances.form.addTitle : dictionary.humanResources.employeeAllowances.form.editTitle}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <Grid container rowSpacing={{ xs: 1, md: 2 }} spacing={1}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                {fetchingAllowanceTypes ? (
                  <LinearProgress />
                ) : (
                  <Controller
                    name='allowance_type_id'
                    control={control}
                    rules={{ required: dictionary.humanResources.employeeAllowances.form.validation.allowanceTypeRequired }}
                    render={({ field, fieldState }) => (
                      <Autocomplete
                        size='small'
                        options={allowanceTypes}
                        isOptionEqualToValue={(option, value) =>
                          option.id === value.id
                        }
                        getOptionLabel={(option) => option.name || ''}
                        value={
                          allowanceTypes.find(
                            (type) => type.id === field.value
                          ) || null
                        }
                        onChange={(event, newValue) => {
                          field.onChange(newValue?.id || null);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={dictionary.humanResources.employeeAllowances.form.labels.allowanceType}
                            error={
                              !!fieldState.error ||
                              !!getValidationMessage(
                                validationErrors,
                                'allowance_type_id'
                              )
                            }
                            helperText={
                              fieldState.error?.message ||
                              getValidationMessage(
                                validationErrors,
                                'allowance_type_id'
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
                  name='amount'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      label={dictionary.humanResources.employeeAllowances.form.labels.amount}
                      size='small'
                      fullWidth
                      value={formatCommaSeparatedValue(field.value)}
                      onChange={(event) => {
                        const raw = event.target.value.replace(/,/g, '');
                        field.onChange(raw === '' ? '' : Number(raw));
                      }}
                      error={
                        !!errors?.amount ||
                        !!getValidationMessage(validationErrors, 'amount')
                      }
                      helperText={
                        errors.amount?.message ||
                        getValidationMessage(validationErrors, 'amount')
                      }
                    />
                  )}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='effective_from'
                  control={control}
                  render={({ field }) => (
                    <DateTimePicker
                      label={dictionary.humanResources.employeeAllowances.form.labels.effectiveFrom}
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(newValue) => {
                        field.onChange(newValue ? newValue.toISOString() : '');
                      }}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          error:
                            !!errors?.effective_from ||
                            !!getValidationMessage(
                              validationErrors,
                              'effective_from'
                            ),
                          helperText:
                            errors.effective_from?.message ||
                            getValidationMessage(
                              validationErrors,
                              'effective_from'
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
                  name='effective_to'
                  control={control}
                  render={({ field }) => (
                    <DateTimePicker
                      label={dictionary.humanResources.employeeAllowances.form.labels.effectiveTo}
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(newValue) => {
                        field.onChange(newValue ? newValue.toISOString() : '');
                      }}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          error:
                            !!errors?.effective_to ||
                            !!getValidationMessage(
                              validationErrors,
                              'effective_to'
                            ),
                          helperText:
                            errors.effective_to?.message ||
                            getValidationMessage(
                              validationErrors,
                              'effective_to'
                            ),
                        },
                      }}
                    />
                  )}
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

export default EmployeeAllowanceForm;
