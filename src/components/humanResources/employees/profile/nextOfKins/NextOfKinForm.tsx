'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  Checkbox,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  TextField,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import humanResourcesServices from '../../../humanResourcesServices';
import { NextOfKinType } from './NextOfKinType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface NextOfKinFormProps {
  setOpenDialog: (open: boolean) => void;
  nextOfKin?: NextOfKinType | null;
  employeeId?: number;
}

interface FormData extends Omit<NextOfKinType, 'id' | 'created_by'> {
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

const NextOfKinForm = ({
  setOpenDialog,
  nextOfKin = null,
  employeeId,
}: NextOfKinFormProps) => {
  const dictionary = useDictionary();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const {
    mutate: addEmployeeNextOfKin,
    isPending,
    error,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.addEmployeeNextOfKin,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar(dictionary.humanResources.nextOfKins.messages.added, {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['employeeNextOfKins'] });
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
    mutate: updateEmployeeNextOfKin,
    isPending: updateIsPending,
    error: updateError,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.updateEmployeeNextOfKin,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar(dictionary.humanResources.nextOfKins.messages.updated, {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['employeeNextOfKins'] });
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
    employee_id: yup.number().required(dictionary.humanResources.nextOfKins.form.validation.employeeRequired),
    name: yup
      .string()
      .required(dictionary.humanResources.nextOfKins.form.validation.nameRequired)
      .max(200, dictionary.humanResources.nextOfKins.form.validation.nameMax),
    relationship: yup
      .string()
      .required(dictionary.humanResources.nextOfKins.form.validation.relationshipRequired)
      .max(50, dictionary.humanResources.nextOfKins.form.validation.relationshipMax),
    phone: yup.string().max(20, dictionary.humanResources.nextOfKins.form.validation.phoneMax),
    email: yup
      .string()
      .email(dictionary.humanResources.nextOfKins.form.validation.emailInvalid)
      .max(150, dictionary.humanResources.nextOfKins.form.validation.emailMax),
    address: yup.string().max(500, dictionary.humanResources.nextOfKins.form.validation.addressMax),
    is_primary: yup.boolean().required(),
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
      id: nextOfKin?.id,
      employee_id: nextOfKin?.employee_id,
      name: nextOfKin?.name || '',
      relationship: nextOfKin?.relationship || '',
      phone: nextOfKin?.phone || '',
      email: nextOfKin?.email || '',
      address: nextOfKin?.address || '',
      is_primary: nextOfKin?.is_primary || false,
    },
  });

  useEffect(() => {
    reset({
      id: nextOfKin?.id,
      employee_id: nextOfKin?.employee_id,
      name: nextOfKin?.name || '',
      relationship: nextOfKin?.relationship || '',
      phone: nextOfKin?.phone || '',
      email: nextOfKin?.email || '',
      address: nextOfKin?.address || '',
      is_primary: nextOfKin?.is_primary || false,
    });
  }, [nextOfKin, reset]);

  // Pre-fill employee_id when rendered inside the Employee Profile
  useEffect(() => {
    if (employeeId) {
      setValue('employee_id', employeeId);
    }
  }, [employeeId, setValue]);

  const saveMutation = useMemo(() => {
    return nextOfKin?.id ? updateEmployeeNextOfKin : addEmployeeNextOfKin;
  }, [nextOfKin?.id, updateEmployeeNextOfKin, addEmployeeNextOfKin]);

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
          {!nextOfKin?.id
            ? dictionary.humanResources.nextOfKins.form.addTitle
            : dictionary.humanResources.nextOfKins.form.editTitle}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <Grid container rowSpacing={{ xs: 1, md: 2 }} spacing={1}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label={dictionary.humanResources.nextOfKins.form.labels.name}
                  size='small'
                  fullWidth
                  error={
                    !!errors?.name ||
                    !!getValidationMessage(validationErrors, 'name')
                  }
                  helperText={
                    errors.name?.message ||
                    getValidationMessage(validationErrors, 'name')
                  }
                  {...register('name')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label={dictionary.humanResources.nextOfKins.form.labels.relationship}
                  size='small'
                  fullWidth
                  error={
                    !!errors?.relationship ||
                    !!getValidationMessage(validationErrors, 'relationship')
                  }
                  helperText={
                    errors.relationship?.message ||
                    getValidationMessage(validationErrors, 'relationship')
                  }
                  {...register('relationship')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label={dictionary.humanResources.nextOfKins.form.labels.phone}
                  size='small'
                  fullWidth
                  error={
                    !!errors?.phone ||
                    !!getValidationMessage(validationErrors, 'phone')
                  }
                  helperText={
                    errors.phone?.message ||
                    getValidationMessage(validationErrors, 'phone')
                  }
                  {...register('phone')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label={dictionary.humanResources.nextOfKins.form.labels.email}
                  size='small'
                  fullWidth
                  error={
                    !!errors?.email ||
                    !!getValidationMessage(validationErrors, 'email')
                  }
                  helperText={
                    errors.email?.message ||
                    getValidationMessage(validationErrors, 'email')
                  }
                  {...register('email')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label={dictionary.humanResources.nextOfKins.form.labels.address}
                  size='small'
                  fullWidth
                  multiline
                  minRows={2}
                  error={
                    !!errors?.address ||
                    !!getValidationMessage(validationErrors, 'address')
                  }
                  helperText={
                    errors.address?.message ||
                    getValidationMessage(validationErrors, 'address')
                  }
                  {...register('address')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='is_primary'
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={Boolean(field.value)}
                          onChange={(event) =>
                            field.onChange(event.target.checked)
                          }
                        />
                      }
                      label={dictionary.humanResources.nextOfKins.form.labels.setPrimary}
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

export default NextOfKinForm;
