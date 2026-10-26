'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { Button, DialogActions, DialogContent, DialogTitle, Grid, TextField } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { Div } from '@jumbo/shared';
import stakeholderGroupServices from './stakeholderGroup-services';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface StakeholderGroup {
  id: number;
  name: string;
  description?: string | null;
}

interface FormData {
  name: string;
  description: string;
}

const StakeholderGroupForm = ({
  group,
  setOpenDialog,
}: {
  group?: StakeholderGroup | null;
  setOpenDialog: (open: boolean) => void;
}) => {
  const dictionary = useDictionary();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const isEdit = !!group;

  const validationSchema = yup.object({
    name: yup.string().required(dictionary.forms.stakeholderGroups.form.errors.validation.nameRequired),
    description: yup.string().default(''),
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: { name: group?.name || '', description: group?.description || '' },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) =>
      isEdit ? stakeholderGroupServices.update({ id: group!.id, ...data }) : stakeholderGroupServices.add(data),
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar(isEdit ? dictionary.forms.stakeholderGroups.form.messages.updateSuccess : dictionary.forms.stakeholderGroups.form.messages.createSuccess, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['stakeholder-groups'] });
    },
    onError: (error) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  const onSubmit = handleSubmit((data) => mutate(data));

  return (
    <>
      <DialogTitle>{isEdit ? dictionary.forms.stakeholderGroups.form.title.edit : dictionary.forms.stakeholderGroups.form.title.new}</DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={onSubmit}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={12}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='name'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={dictionary.forms.stakeholderGroups.form.labels.name}
                      fullWidth
                      size='small'
                      autoFocus
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  )}
                />
              </Div>
            </Grid>
            <Grid size={12}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='description'
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label={dictionary.forms.stakeholderGroups.form.labels.description} fullWidth multiline minRows={2} size='small' />
                  )}
                />
              </Div>
            </Grid>
          </Grid>
          <DialogActions>
            <Button size='small' onClick={() => setOpenDialog(false)}>
              {dictionary.forms.stakeholderGroups.form.buttons.cancel}
            </Button>
            <LoadingButton type='submit' variant='contained' size='small' loading={isPending}>
              {dictionary.forms.stakeholderGroups.form.buttons.save}
            </LoadingButton>
          </DialogActions>
        </form>
      </DialogContent>
    </>
  );
};

export default StakeholderGroupForm;
