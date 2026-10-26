'use client';

import { getErrorMessage } from '@/utilities/helpers/errorHandler';
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
import humanResourcesServices from '../humanResourcesServices';
import { OvertimeType } from './OvertimeType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface OvertimeTypeFormProps {
  setOpenDialog: (open: boolean) => void;
  overtimeType?: OvertimeType | null;
}

interface FormData extends Omit<OvertimeType, 'id' | 'created_by'> {
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

const OvertimeTypeForm = ({
  setOpenDialog,
  overtimeType = null,
}: OvertimeTypeFormProps) => {
  const dictionary = useDictionary();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const {
    mutate: addOvertimeType,
    isPending,
    error,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.addOvertimeType,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar(dictionary.humanResources.overtimeTypes.form.messages.addSuccess, {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['overtimeTypes'] });
    },
    onError: (mutationError) => {
      enqueueSnackbar(getErrorMessage(mutationError), { variant: 'error' });
    },
  });

  const {
    mutate: updateOvertimeType,
    isPending: updateIsPending,
    error: updateError,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.updateOvertimeType,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar(dictionary.humanResources.overtimeTypes.form.messages.updateSuccess, {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['overtimeTypes'] });
    },
    onError: (mutationError) => {
      enqueueSnackbar(getErrorMessage(mutationError), { variant: 'error' });
    },
  });

  const validationSchema = yup.object({
    id: yup.number().optional(),
    name: yup
      .string()
      .required(dictionary.humanResources.overtimeTypes.form.validation.nameRequired)
      .max(255, dictionary.humanResources.overtimeTypes.form.validation.nameMax),
    code: yup.string().max(50, dictionary.humanResources.overtimeTypes.form.validation.codeMax),
    multiplier: yup
      .number()
      .typeError(dictionary.humanResources.overtimeTypes.form.validation.multiplierNumber)
      .required(dictionary.humanResources.overtimeTypes.form.validation.multiplierRequired)
      .min(1, dictionary.humanResources.overtimeTypes.form.validation.multiplierMin),
    is_taxable: yup.boolean().required(),
    description: yup
      .string()
      .max(500, dictionary.humanResources.overtimeTypes.form.validation.descriptionMax),
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: overtimeType?.id,
      name: overtimeType?.name || '',
      code: overtimeType?.code || '',
      multiplier: overtimeType?.multiplier ?? 1.5,
      is_taxable: overtimeType?.is_taxable ?? true,
      description: overtimeType?.description || '',
    },
  });

  useEffect(() => {
    reset({
      id: overtimeType?.id,
      name: overtimeType?.name || '',
      code: overtimeType?.code || '',
      multiplier: overtimeType?.multiplier ?? 1.5,
      is_taxable: overtimeType?.is_taxable ?? true,
      description: overtimeType?.description || '',
    });
  }, [overtimeType, reset]);

  const saveMutation = useMemo(() => {
    return overtimeType?.id ? updateOvertimeType : addOvertimeType;
  }, [overtimeType?.id, updateOvertimeType, addOvertimeType]);

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
          {!overtimeType?.id ? dictionary.humanResources.overtimeTypes.form.titles.add : dictionary.humanResources.overtimeTypes.form.titles.edit}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <Grid container rowSpacing={{ xs: 1, md: 2 }} spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label={dictionary.humanResources.overtimeTypes.form.labels.name}
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

            <Grid size={{ xs: 12, md: 3 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label={dictionary.humanResources.overtimeTypes.form.labels.code}
                  size='small'
                  fullWidth
                  error={
                    !!errors?.code ||
                    !!getValidationMessage(validationErrors, 'code')
                  }
                  helperText={
                    errors.code?.message ||
                    getValidationMessage(validationErrors, 'code')
                  }
                  {...register('code')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label={dictionary.humanResources.overtimeTypes.form.labels.multiplier}
                  size='small'
                  fullWidth
                  helperText={
                    errors.multiplier?.message ||
                    getValidationMessage(validationErrors, 'multiplier') ||
                    dictionary.humanResources.overtimeTypes.form.helpers.multiplier
                  }
                  error={
                    !!errors?.multiplier ||
                    !!getValidationMessage(validationErrors, 'multiplier')
                  }
                  {...register('multiplier')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label={dictionary.humanResources.overtimeTypes.form.labels.description}
                  size='small'
                  fullWidth
                  multiline
                  minRows={2}
                  error={
                    !!errors?.description ||
                    !!getValidationMessage(validationErrors, 'description')
                  }
                  helperText={
                    errors.description?.message ||
                    getValidationMessage(validationErrors, 'description')
                  }
                  {...register('description')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='is_taxable'
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
                      label={dictionary.humanResources.overtimeTypes.form.labels.isTaxable}
                    />
                  )}
                />
              </Div>
            </Grid>
          </Grid>

          <DialogActions>
            <Button size='small' onClick={() => setOpenDialog(false)}>
              {dictionary.humanResources.overtimeTypes.form.buttons.cancel}
            </Button>
            <LoadingButton
              type='submit'
              variant='contained'
              size='small'
              sx={{ display: 'flex' }}
              loading={isPending || updateIsPending}
            >
              {dictionary.humanResources.overtimeTypes.form.buttons.submit}
            </LoadingButton>
          </DialogActions>
        </form>
      </DialogContent>
    </>
  );
};

export default OvertimeTypeForm;
