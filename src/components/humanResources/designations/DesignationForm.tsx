'use client';

import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import humanResourcesServices from '../humanResourcesServices';
import { Designation } from './DesignationsType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface DesignationFormProp {
  setOpenDialog: (open: boolean) => void;
  designation?: Designation | null;
}

interface FormData extends Omit<
  Designation,
  'id' | 'created_at' | 'updated_at'
> {
  id?: number;
}

interface ApiResponse {
  message: string;
  validation_errors?: {
    title?: string;
  };
}

const DesignationForm = ({
  setOpenDialog,
  designation = null,
}: DesignationFormProp) => {
  const dictionary = useDictionary();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const {
    mutate: addDesignation,
    isPending,
    error,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.addDesignation,
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar(dictionary.humanResources.designations.form.messages.addSuccess, {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['designations'] });
    },
    onError: (error) => {
      let message = getErrorMessage(error);

      // if (
      //   typeof error === 'object' &&
      //   error !== null &&
      //   'response' in error &&
      //   typeof (error as any).response?.data?.message === 'string'
      // ) {
      //   message = (error as any).response.data.message;
      // } else if (error instanceof Error) {
      //   message = error.message;
      // }
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const {
    mutate: updateDesignation,
    isPending: updateIsLoading,
    error: updateError,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.updateDesignation,
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar(dictionary.humanResources.designations.form.messages.updateSuccess, {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['designations'] });
    },
    onError: (error) => {
      let message = getErrorMessage(error);

      // if (
      //   typeof error === 'object' &&
      //   error !== null &&
      //   'response' in error &&
      //   typeof (error as any).response?.data?.message === 'string'
      // ) {
      //   message = (error as any).response.data.message;
      // } else if (error instanceof Error) {
      //   message = error.message;
      // }
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const validationSchema = yup.object({
    id: yup.number().optional(),
    title: yup.string().required(dictionary.humanResources.designations.form.validation.titleRequired).max(255),
    code: yup.string().max(50),
    description: yup.string().max(500),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: designation?.id,
      title: designation?.title || '',
      code: designation?.code || '',
      description: designation?.description || '',
    },
  });

  useEffect(() => {
    reset({
      id: designation?.id,
      title: designation?.title || '',
      code: designation?.code || '',
      description: designation?.description || '',
    });
  }, [designation, reset]);

  const saveMutation = useMemo(() => {
    return designation?.id ? updateDesignation : addDesignation;
  }, [designation, updateDesignation, addDesignation]);

  const onSubmit = (data: FormData) => {
    saveMutation(data);
  };

  return (
    <>
      <DialogTitle>
        <Grid size={12} textAlign={'center'}>
          {!designation?.id
            ? dictionary.humanResources.designations.form.titles.add
            : dictionary.humanResources.designations.form.titles.edit.replace('{title}', designation.title)}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <Grid container rowSpacing={{ xs: 1, md: 2 }} spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label={dictionary.humanResources.designations.form.labels.title}
                  placeholder={dictionary.humanResources.designations.form.placeholders.title}
                  size='small'
                  fullWidth
                  error={
                    !!errors?.title ||
                    !!error?.response?.data?.validation_errors?.title ||
                    !!updateError?.response?.data?.validation_errors?.title
                  }
                  helperText={
                    errors.title?.message ||
                    error?.response?.data?.validation_errors?.title ||
                    updateError?.response?.data?.validation_errors?.title
                  }
                  {...register('title')}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label={dictionary.humanResources.designations.form.labels.code}
                  placeholder={dictionary.humanResources.designations.form.placeholders.code}
                  size='small'
                  fullWidth
                  error={
                    !!errors?.code ||
                    !!error?.response?.data?.validation_errors?.code ||
                    !!updateError?.response?.data?.validation_errors?.code
                  }
                  helperText={
                    errors.code?.message ||
                    error?.response?.data?.validation_errors?.code ||
                    updateError?.response?.data?.validation_errors?.code
                  }
                  {...register('code')}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label={dictionary.humanResources.designations.form.labels.description}
                  placeholder={dictionary.humanResources.designations.form.placeholders.description}
                  size='small'
                  multiline
                  minRows={2}
                  fullWidth
                  error={
                    !!errors?.description ||
                    !!error?.response?.data?.validation_errors?.description ||
                    !!updateError?.response?.data?.validation_errors
                      ?.description
                  }
                  helperText={
                    errors.description?.message ||
                    error?.response?.data?.validation_errors?.description ||
                    updateError?.response?.data?.validation_errors?.description
                  }
                  {...register('description')}
                />
              </Div>
            </Grid>
          </Grid>
          <DialogActions>
            <Button size='small' onClick={() => setOpenDialog(false)}>
              {dictionary.humanResources.designations.form.buttons.cancel}
            </Button>
            <LoadingButton
              type='submit'
              variant='contained'
              size='small'
              sx={{ display: 'flex' }}
              loading={isPending || updateIsLoading}
            >
              {dictionary.humanResources.designations.form.buttons.submit}
            </LoadingButton>
          </DialogActions>
        </form>
      </DialogContent>
    </>
  );
};

export default DesignationForm;
