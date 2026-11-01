'use client'

import React from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import BioSelect, { useStatusOptions } from '../BioSelect';
import InfoHint from '../InfoHint';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import ProductCategoriesSelector from '@/components/productAndServices/productCategories/ProductCategoriesSelector';
import UsersSelector from '@/components/sharedComponents/UsersSelector';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { farmServices } from '../bio-production-services';
import { BioFarm, BioFormProps } from '../types';

interface FarmFormData {
  name: string;
  address?: string | null;
  status: 'active' | 'inactive';
  cost_center_mode: 'create' | 'adopt';
  cost_center_id?: number | null;
  users: { id: number; name: string }[];
  input_categories: { id: number; name: string }[];
  output_categories: { id: number; name: string }[];
}

const FarmForm = ({ setOpenDialog, item: farm = null }: BioFormProps<BioFarm>) => {
  const dictionary = useDictionary();
  const text = dictionary.bioProduction.farms;
  const common = dictionary.bioProduction.common;
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const isEdit = !!farm?.id;
  const statuses = useStatusOptions();

  const validationSchema = yup.object({
    name: yup.string().trim().required(text.validation.nameRequired),
    address: yup.string().nullable(),
    status: yup.string().oneOf(['active', 'inactive']).required(),
    cost_center_mode: yup.string().oneOf(['create', 'adopt']).required(),
    users: yup.array().of(yup.object({ id: yup.number().required(), name: yup.string() })),
    cost_center_id: yup
      .number()
      .nullable()
      .when('cost_center_mode', {
        is: (mode: string) => mode === 'adopt' && !isEdit,
        then: (schema) => schema.required(text.validation.costCenterRequired).typeError(text.validation.costCenterRequired),
      }),
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FarmFormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      name: farm?.name ?? '',
      address: farm?.address ?? '',
      status: farm?.status ?? 'active',
      cost_center_mode: 'create',
      users: farm?.users ?? [],
      input_categories: farm?.input_categories ?? [],
      output_categories: farm?.output_categories ?? [],
      cost_center_id: null,
    },
  });

  const mode = watch('cost_center_mode');

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data: FarmFormData) => {
      // The cost center is chosen once, when the farm is created; the server refuses to change it later.
      const payload: Record<string, unknown> = { name: data.name, address: data.address, status: data.status, user_ids: (data.users ?? []).map((user) => user.id),
        input_category_ids: (data.input_categories ?? []).map((category) => category.id), output_category_ids: (data.output_categories ?? []).map((category) => category.id) };
      if (!isEdit && data.cost_center_mode === 'adopt') {
        payload.cost_center_id = data.cost_center_id;
      }

      return isEdit ? farmServices.update({ id: farm!.id, ...payload }) : farmServices.add(payload);
    },
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['bioFarms'] });
      queryClient.invalidateQueries({ queryKey: ['bioFarmOptions'] });
      queryClient.invalidateQueries({ queryKey: ['bioFarm'] });
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  return (
    <>
      <DialogTitle textAlign='center'>
        {isEdit ? text.editTitle.replace('{name}', farm?.name ?? '') : text.newTitle}
      </DialogTitle>
      <DialogContent sx={{ pt: '10px !important' }}>
        <form autoComplete='off' onSubmit={handleSubmit((data) => save(data))}>
          <Grid container spacing={2} mt={0}>
            <Grid size={{ xs: 12, md: isEdit ? 8 : 12 }}>
              <TextField
                label={text.labels.name}
                size='small'
                fullWidth
                error={!!errors.name}
                helperText={errors.name?.message}
                {...register('name')}
              />
            </Grid>
            {isEdit && (
              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name='status'
                  control={control}
                  render={({ field }) => (
                    <BioSelect required label={text.labels.status} options={statuses} value={field.value} onChange={field.onChange} />
                  )}
                />
              </Grid>
            )}
            <Grid size={12}>
              <TextField label={text.labels.address} size='small' fullWidth {...register('address')} />
            </Grid>
            <Grid size={12}>
              <Stack direction='row' alignItems='flex-start' spacing={0.5}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <UsersSelector
                    multiple
                    label={text.labels.users}
                    defaultValue={farm?.users ?? []}
                    onChange={(value) => setValue('users', (Array.isArray(value) ? value : value ? [value] : []).map((user) => ({ id: user.id, name: user.name })), { shouldDirty: true })}
                  />
                </Box>
                <InfoHint text={text.help.users} />
              </Stack>
            </Grid>
            {(['input', 'output'] as const).map((usage) => (
              <Grid size={{ xs: 12, md: 6 }} key={usage}>
                <Stack direction='row' alignItems='flex-start' spacing={0.5}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <ProductCategoriesSelector
                      multiple
                      label={text.labels[`${usage}Categories`]}
                      defaultValue={farm?.[`${usage}_categories`] ?? []}
                      onChange={(value: any) => setValue(`${usage}_categories`, (Array.isArray(value) ? value : value ? [value] : []).map((category: any) => ({ id: category.id, name: category.name })), { shouldDirty: true })}
                    />
                  </Box>
                  <InfoHint text={text.help[`${usage}Categories`]} />
                </Stack>
              </Grid>
            ))}
            <Grid size={12}>
              {isEdit ? (
                <>
                  <Stack direction='row' alignItems='center' spacing={0.5}>
                    <Typography variant='body2' color='text.secondary'>{text.labels.costCenter}</Typography>
                    <InfoHint text={text.costCenterMode.fixedHelp} />
                  </Stack>
                  <Typography>{farm?.cost_center?.name}</Typography>
                </>
              ) : (
                <FormControl error={!!errors.cost_center_id} fullWidth>
                  <Stack direction='row' alignItems='center' spacing={0.5}>
                    <FormLabel>{text.costCenterMode.heading}</FormLabel>
                    <InfoHint text={mode === 'adopt' ? text.costCenterMode.adoptHelp : text.costCenterMode.createHelp} />
                  </Stack>
                  <RadioGroup
                    value={mode}
                    onChange={(e) => {
                      setValue('cost_center_mode', e.target.value as 'create' | 'adopt');
                      if (e.target.value === 'create') setValue('cost_center_id', null);
                    }}
                  >
                    <FormControlLabel value='create' control={<Radio size='small' />} label={text.costCenterMode.create} />
                    <FormControlLabel value='adopt' control={<Radio size='small' />} label={text.costCenterMode.adopt} />
                  </RadioGroup>
                  {mode === 'adopt' && (
                    <CostCenterSelector
                      multiple={false}
                      label={text.costCenterMode.select}
                      frontError={errors.cost_center_id}
                      onChange={(value) => {
                        const costCenter = Array.isArray(value) ? value[0] : value;
                        setValue('cost_center_id', costCenter?.id ?? null, { shouldValidate: true });
                      }}
                    />
                  )}
                </FormControl>
              )}
            </Grid>
          </Grid>
          <DialogActions>
            <Button size='small' onClick={() => setOpenDialog(false)}>{common.cancel}</Button>
            <LoadingButton type='submit' variant='contained' size='small' loading={isPending}>
              {common.submit}
            </LoadingButton>
          </DialogActions>
        </form>
      </DialogContent>
    </>
  );
};

export default FarmForm;
