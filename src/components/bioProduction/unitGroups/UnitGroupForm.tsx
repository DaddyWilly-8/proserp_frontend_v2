'use client'

import React from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { LoadingButton } from '@mui/lab';
import { Button, DialogActions, DialogContent, DialogTitle, Grid, Stack, TextField } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { Controller, useForm, useWatch } from 'react-hook-form';
import * as yup from 'yup';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import BioSelect, { useStatusOptions } from '../BioSelect';
import InfoHint from '../InfoHint';
import { farmServices, unitGroupServices } from '../bio-production-services';
import { unitGroupOptions, useUnitGroups } from '../useUnitGroups';
import { BioFarm, BioFormProps, BioUnitGroup } from '../types';

interface GroupFormData {
  farm_id: number | '';
  parent_id: number | '' | null;
  name: string;
  code?: string | null;
  description?: string | null;
  status: 'active' | 'inactive';
}

const UnitGroupForm = ({ setOpenDialog, item: group = null }: BioFormProps<BioUnitGroup>) => {
  const dictionary = useDictionary();
  const text = dictionary.bioProduction.unitGroups;
  const common = dictionary.bioProduction.common;
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const isEdit = !!group?.id;
  const statuses = useStatusOptions();

  const { data: farms, isLoading: loadingFarms } = useQuery<{ data: BioFarm[] }>({
    queryKey: ['bioFarmOptions'],
    queryFn: () => farmServices.getList({ limit: 500 }),
  });

  const schema = yup.object({
    farm_id: yup.number().typeError(text.validation.farmRequired).required(text.validation.farmRequired),
    parent_id: yup.number().nullable().transform((value, original) => (original === '' || original == null ? null : value)),
    name: yup.string().trim().required(text.validation.nameRequired),
    code: yup.string().nullable().max(20),
    description: yup.string().nullable(),
    status: yup.string().oneOf(['active', 'inactive']).required(),
  });

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<GroupFormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      farm_id: group?.farm_id ?? '',
      parent_id: group?.parent_id ?? '',
      name: group?.name ?? '',
      code: group?.code ?? '',
      description: group?.description ?? '',
      status: group?.status ?? 'active',
    },
  });
  const farmId = useWatch({ control, name: 'farm_id' });
  const { data: groups, isLoading: loadingGroups } = useUnitGroups(farmId || null);

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data: GroupFormData) => {
      const payload = { ...data, parent_id: data.parent_id || null };

      return isEdit ? unitGroupServices.update({ id: group!.id, ...payload }) : unitGroupServices.add(payload);
    },
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['bioUnitGroups'] });
      queryClient.invalidateQueries({ queryKey: ['bioUnitGroupOptions'] });
      queryClient.invalidateQueries({ queryKey: ['bioProductionUnits'] });
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  return (
    <>
      <DialogTitle textAlign='center'>{isEdit ? text.editTitle.replace('{name}', group?.name ?? '') : text.newTitle}</DialogTitle>
      <DialogContent sx={{ pt: '10px !important' }}>
        <form autoComplete='off' onSubmit={handleSubmit((data) => save(data))}>
          <Grid container spacing={2} mt={0}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller name='farm_id' control={control} render={({ field }) => (
                <BioSelect required disabled={isEdit} label={text.labels.farm} loading={loadingFarms} options={(farms?.data ?? []).map((farm) => ({ value: farm.id, label: farm.name }))}
                  value={field.value} onChange={(value) => { field.onChange(value); setValue('parent_id', ''); }} error={!!errors.farm_id} helperText={errors.farm_id?.message} />
              )} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack direction='row' alignItems='center'>
                <Controller name='parent_id' control={control} render={({ field }) => (
                  <BioSelect disabled={!farmId} loading={loadingGroups} label={text.labels.parent} options={unitGroupOptions(groups?.data, group?.id)}
                    value={field.value} onChange={field.onChange} />
                )} />
                <InfoHint text={text.noParent} />
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: isEdit ? 5 : 8 }}>
              <TextField label={text.labels.name} placeholder={text.placeholders.name} size='small' fullWidth error={!!errors.name} helperText={errors.name?.message} {...register('name')} />
            </Grid>
            <Grid size={{ xs: 6, md: isEdit ? 3 : 4 }}>
              <TextField label={text.labels.code} size='small' fullWidth slotProps={{ input: { endAdornment: <InfoHint text={text.help.code} /> } }} {...register('code')} />
            </Grid>
            {isEdit && (
              <Grid size={{ xs: 6, md: 4 }}>
                <Controller name='status' control={control} render={({ field }) => (
                  <BioSelect required label={text.labels.status} options={statuses} value={field.value} onChange={field.onChange} />
                )} />
              </Grid>
            )}
            <Grid size={12}>
              <TextField label={text.labels.description} size='small' fullWidth multiline minRows={2} {...register('description')} />
            </Grid>
          </Grid>
          <DialogActions>
            <Button size='small' onClick={() => setOpenDialog(false)}>{common.cancel}</Button>
            <LoadingButton type='submit' variant='contained' size='small' loading={isPending}>{common.submit}</LoadingButton>
          </DialogActions>
        </form>
      </DialogContent>
    </>
  );
};

export default UnitGroupForm;
