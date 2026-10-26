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
import { EmployerContributionType } from '../../../employerContributionTypes/EmployerContributionType';
import humanResourcesServices from '../../../humanResourcesServices';
import { EmployeeEmployerContributionType } from './EmployeeEmployerContributionType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface EmployeeEmployerContributionFormProps {
  setOpenDialog: (open: boolean) => void;
  employeeEmployerContribution?: EmployeeEmployerContributionType | null;
  employeeId?: number;
}

interface FormData extends Omit<
  EmployeeEmployerContributionType,
  'id' | 'created_by'
> {
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
  const raw = String(value).replace(/,/g, '');
  if (!/^\d*\.?\d*$/.test(raw)) return '';

  const hasDecimal = raw.includes('.');
  const [intPart, decimalPart = ''] = raw.split('.');

  const formattedInt = intPart ? Number(intPart).toLocaleString('en-US') : '0';

  if (!hasDecimal) return formattedInt;
  return `${formattedInt}.${decimalPart}`;
};

const EmployeeEmployerContributionForm = ({
  setOpenDialog,
  employeeEmployerContribution = null,
  employeeId,
}: EmployeeEmployerContributionFormProps) => {
  const dictionary = useDictionary();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const {
    data: contributionTypesResponse,
    isFetching: fetchingContributionTypes,
  } = useQuery({
    queryKey: ['fetchEmployerContributionTypesForEmployeeContributionForm'],
    queryFn: async () => {
      return humanResourcesServices.getEmployerContributionTypesList({
        page: 1,
        limit: 200,
      });
    },
  });

  const contributionTypes = (contributionTypesResponse?.data ||
    []) as EmployerContributionType[];

  const {
    mutate: addEmployeeEmployerContribution,
    isPending,
    error,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.addEmployeeEmployerContribution,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar(dictionary.humanResources.employeeEmployerContributions.messages.added, {
        variant: 'success',
      });
      queryClient.invalidateQueries({
        queryKey: ['employeeEmployerContributions'],
      });
    },
    onError: (mutationError) => {
      let message = dictionary.humanResources.profileSectionsCommon.somethingWentWrong;

      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as any).response?.data?.message === 'string'
      ) {
        message = (error as any).response.data.message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const {
    mutate: updateEmployeeEmployerContribution,
    isPending: updateIsPending,
    error: updateError,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.updateEmployeeEmployerContribution,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar(dictionary.humanResources.employeeEmployerContributions.messages.updated, {
        variant: 'success',
      });
      queryClient.invalidateQueries({
        queryKey: ['employeeEmployerContributions'],
      });
    },
    onError: (mutationError) => {
      let message = dictionary.humanResources.profileSectionsCommon.somethingWentWrong;

      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as any).response?.data?.message === 'string'
      ) {
        message = (error as any).response.data.message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const validationSchema = yup.object({
    id: yup.number().optional(),
    employee_id: yup.number().required(dictionary.humanResources.employeeEmployerContributions.form.validation.employeeRequired),
    employer_contribution_type_id: yup
      .number()
      .required(dictionary.humanResources.employeeEmployerContributions.form.validation.contributionTypeRequired),
    member_no: yup.string().nullable().max(50),
    value: yup
      .number()
      .typeError(dictionary.humanResources.employeeEmployerContributions.form.validation.valueNumber)
      .required(dictionary.humanResources.employeeEmployerContributions.form.validation.valueRequired)
      .min(0, dictionary.humanResources.employeeEmployerContributions.form.validation.valueMin),
    effective_from: yup.string().required(dictionary.humanResources.employeeEmployerContributions.form.validation.effectiveFromRequired),
    effective_to: yup.string().nullable().optional(),
  });

  const {
    handleSubmit,
    control,
    reset,
    setValue,
    register,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: employeeEmployerContribution?.id,
      employee_id: employeeEmployerContribution?.employee_id,
      employer_contribution_type_id:
        employeeEmployerContribution?.employer_contribution_type_id,
      member_no: employeeEmployerContribution?.member_no || '',
      value: employeeEmployerContribution?.value,
      effective_from: employeeEmployerContribution?.effective_from || '',
      effective_to: employeeEmployerContribution?.effective_to || '',
    },
  });

  useEffect(() => {
    reset({
      id: employeeEmployerContribution?.id,
      employee_id: employeeEmployerContribution?.employee_id,
      employer_contribution_type_id:
        employeeEmployerContribution?.employer_contribution_type_id,
      member_no: employeeEmployerContribution?.member_no || '',
      value: employeeEmployerContribution?.value,
      effective_from: employeeEmployerContribution?.effective_from || '',
      effective_to: employeeEmployerContribution?.effective_to || '',
    });
  }, [employeeEmployerContribution, reset]);

  useEffect(() => {
    if (employeeId) setValue('employee_id', employeeId);
  }, [employeeId, setValue]);

  const saveMutation = useMemo(() => {
    return employeeEmployerContribution?.id
      ? updateEmployeeEmployerContribution
      : addEmployeeEmployerContribution;
  }, [
    employeeEmployerContribution?.id,
    updateEmployeeEmployerContribution,
    addEmployeeEmployerContribution,
  ]);

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
          {!employeeEmployerContribution?.id
            ? dictionary.humanResources.employeeEmployerContributions.form.addTitle
            : dictionary.humanResources.employeeEmployerContributions.form.editTitle}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <Grid container rowSpacing={{ xs: 1, md: 2 }} spacing={1}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                {fetchingContributionTypes ? (
                  <LinearProgress />
                ) : (
                  <Controller
                    name='employer_contribution_type_id'
                    control={control}
                    rules={{ required: dictionary.humanResources.employeeEmployerContributions.form.validation.contributionTypeRequired }}
                    render={({ field, fieldState }) => (
                      <Autocomplete
                        size='small'
                        options={contributionTypes}
                        isOptionEqualToValue={(option, value) =>
                          option.id === value.id
                        }
                        getOptionLabel={(option) => option.name || ''}
                        value={
                          contributionTypes.find(
                            (type) => type.id === field.value
                          ) || null
                        }
                        onChange={(event, newValue) => {
                          field.onChange(newValue?.id || null);

                          if (newValue) {
                            setValue(
                              'value',
                              Number(newValue.default_value ?? ''),
                              {
                                shouldDirty: true,
                                shouldValidate: true,
                              }
                            );
                          }
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={dictionary.humanResources.employeeEmployerContributions.form.labels.contributionType}
                            error={
                              !!fieldState.error ||
                              !!getValidationMessage(
                                validationErrors,
                                'employer_contribution_type_id'
                              )
                            }
                            helperText={
                              fieldState.error?.message ||
                              getValidationMessage(
                                validationErrors,
                                'employer_contribution_type_id'
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
                  label={dictionary.humanResources.employeeEmployerContributions.form.labels.memberNo}
                  placeholder={dictionary.humanResources.employeeEmployerContributions.form.placeholders.memberNo}
                  size='small'
                  fullWidth
                  error={
                    !!errors?.member_no ||
                    !!getValidationMessage(validationErrors, 'member_no')
                  }
                  helperText={
                    errors.member_no?.message ||
                    getValidationMessage(validationErrors, 'member_no')
                  }
                  {...register('member_no')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='value'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      label={dictionary.humanResources.employeeEmployerContributions.form.labels.value}
                      size='small'
                      fullWidth
                      value={formatCommaSeparatedValue(field.value)}
                      onChange={(event) => {
                        const raw = event.target.value.replace(/,/g, '');
                        if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
                          field.onChange(raw);
                        }
                      }}
                      // inputProps={{
                      //   inputMode: 'decimal',
                      //   pattern: '^\\d*\\.?\\d*$',
                      // }}
                      error={
                        !!errors?.value ||
                        !!getValidationMessage(validationErrors, 'value')
                      }
                      helperText={
                        errors.value?.message ||
                        getValidationMessage(validationErrors, 'value')
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
                      label={dictionary.humanResources.employeeEmployerContributions.form.labels.effectiveFrom}
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
                      label={dictionary.humanResources.employeeEmployerContributions.form.labels.effectiveTo}
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

export default EmployeeEmployerContributionForm;
