import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { yupResolver } from '@hookform/resolvers/yup';
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
import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import projectCategoryServices from './project-category-services';
import {
  AddCategoryResponse,
  Category,
  UpdateCategoryResponse,
} from './ProjectCategoriesType';

interface ProjectCategoryFormProps {
  category: Category;
  setOpenDialog: (open: boolean) => void;
}

interface FormData {
  id?: number;
  name: string;
  description?: string;
}

const getValidationSchema = (dictionary: any) =>
  yup.object({
    name: yup
      .string()
      .required(dictionary.forms.projectCategories.errors.nameRequired),
    description: yup.string().optional(),
  });

const ProjectCategoryFormDialog: React.FC<ProjectCategoryFormProps> = ({
  category,
  setOpenDialog,
}) => {
  const dictionary = useDictionary();
  const t = dictionary.forms.projectCategories;
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      id: category?.id || undefined,
      name: category ? category.name : '',
      description: category?.description || '',
    },
    resolver: yupResolver(getValidationSchema(dictionary)) as any,
  });

  const { mutate: addCategory, isPending: isAdding } = useMutation<
    AddCategoryResponse,
    unknown,
    Category
  >({
    mutationFn: projectCategoryServices.add,
    onSuccess: (data) => {
      const message = (data as { message: string })?.message ?? t.messages.success;
      enqueueSnackbar(message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['projectCategories'] });
      setOpenDialog(false);
    },
    onError: (error: unknown) => {
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

  const { mutate: updateCategory, isPending: updateLoading } = useMutation<
    UpdateCategoryResponse,
    unknown,
    ProjectCategoryFormProps & { id: number }
  >({
    mutationFn: projectCategoryServices.update,
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['projectCategories'] });
      setOpenDialog(false);
    },
    onError: (error: unknown) => {
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

  const saveMutation = useMemo(() => {
    return category?.id ? updateCategory : addCategory;
  }, [category, updateCategory, addCategory]);

  const onSubmit = (formData: FormData) => {
    const dataToSend = {
      ...formData,
      ...(category?.id ? { id: category.id } : {}),
    };

    saveMutation(dataToSend as any);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <DialogTitle sx={{ textAlign: 'center' }}>
        {!category?.id ? t.titles.new : t.titles.edit.replace('{name}', category.name)}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} p={1}>
          <Grid size={12}>
            <TextField
              fullWidth
              label={t.labels.categoryName}
              size='small'
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
              {...register('name')}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              multiline
              label={t.labels.description}
              fullWidth
              size='small'
              rows={2}
              {...register('description')}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenDialog(false)} size='small'>
          {t.buttons.cancel}
        </Button>
        <LoadingButton
          type='submit'
          variant='contained'
          size='small'
          loading={isAdding || updateLoading}
        >
          {t.buttons.submit}
        </LoadingButton>
      </DialogActions>
    </form>
  );
};

export default ProjectCategoryFormDialog;
