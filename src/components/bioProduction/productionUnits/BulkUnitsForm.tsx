'use client'

import React from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { LoadingButton } from '@mui/lab';
import { Alert, Button, DialogActions, DialogContent, DialogTitle, Grid, TextField } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { Controller, useForm, useWatch } from 'react-hook-form';
import * as yup from 'yup';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import MeasurementSelector from '@/components/masters/measurementUnits/MeasurementSelector';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import BioSelect from '../BioSelect';
import { farmServices, productionUnitServices } from '../bio-production-services';
import { unitGroupOptions, useUnitGroups } from '../useUnitGroups';
import { BioFarm } from '../types';
import { FormNumber } from '../NumberField';

const UNIT_TYPES = ['pond', 'cage', 'tank', 'house', 'pen'] as const;

interface BulkData {
  farm_id: number | '';
  unit_group_id: number | '' | null;
  type: (typeof UNIT_TYPES)[number] | '';
  prefix: string;
  from: number | '';
  to: number | '';
  capacity?: number | null;
  capacity_unit_id?: number | null;
  max_batches: number | '';
}

/** Makes a run of units at once: a prefix and the numbers from one to another (3G1C, 1 to 10 gives 3G1C1 ... 3G1C10). */
const BulkUnitsForm = ({ setOpenDialog }: { setOpenDialog: (open: boolean) => void }) => {
  const dictionary = useDictionary();
  const text = dictionary.bioProduction.productionUnits;
  const bulk = text.bulk;
  const common = dictionary.bioProduction.common;
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const { data: farms, isLoading: loadingFarms } = useQuery<{ data: BioFarm[] }>({
    queryKey: ['bioFarmOptions'],
    queryFn: () => farmServices.getList({ limit: 500 }),
  });

  const schema = yup.object({
    farm_id: yup.number().typeError(text.validation.farmRequired).required(text.validation.farmRequired),
    unit_group_id: yup.number().nullable().transform((value, original) => (original === '' || original == null ? null : value)),
    type: yup.string().oneOf([...UNIT_TYPES], text.validation.typeRequired).required(text.validation.typeRequired),
    prefix: yup.string().trim().required(bulk.validation.prefixRequired),
    from: yup.number().typeError(bulk.validation.numberInvalid).integer(bulk.validation.numberInvalid).min(0, bulk.validation.numberInvalid).required(bulk.validation.numberInvalid),
    to: yup.number().typeError(bulk.validation.numberInvalid).integer(bulk.validation.numberInvalid).min(yup.ref('from'), bulk.validation.toBeforeFrom).required(bulk.validation.numberInvalid),
    capacity: yup.number().transform((value, original) => (original === '' || original == null ? null : value)).nullable().min(0, text.validation.capacityInvalid).typeError(text.validation.capacityInvalid),
    capacity_unit_id: yup.number().nullable().transform((value, original) => (original === '' || original == null ? null : value)),
    max_batches: yup.number().typeError(text.validation.maxBatchesInvalid).integer(text.validation.maxBatchesInvalid).min(1, text.validation.maxBatchesInvalid).required(text.validation.maxBatchesInvalid),
  });

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<BulkData>({
    resolver: yupResolver(schema) as any,
    defaultValues: { farm_id: '', unit_group_id: '', type: '', prefix: '', from: 1, to: 10, capacity: null, capacity_unit_id: null, max_batches: 1 },
  });
  const [farmId, prefix, from, to] = useWatch({ control, name: ['farm_id', 'prefix', 'from', 'to'] });
  const { data: groups, isLoading: loadingGroups } = useUnitGroups(farmId || null, 'active');

  const count = from !== '' && to !== '' && Number(to) >= Number(from) ? Number(to) - Number(from) + 1 : 0;

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data: BulkData) => productionUnitServices.addMany({ ...data, unit_group_id: data.unit_group_id || null }),
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['bioProductionUnits'] });
      queryClient.invalidateQueries({ queryKey: ['bioUnitGroups'] });
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  return (
    <>
      <DialogTitle textAlign='center'>{bulk.title}</DialogTitle>
      <DialogContent sx={{ pt: '10px !important' }}>
        <form autoComplete='off' onSubmit={handleSubmit((data) => save(data))}>
          <Grid container spacing={2} mt={0}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller name='farm_id' control={control} render={({ field }) => (
                <BioSelect required label={text.labels.farm} loading={loadingFarms} options={(farms?.data ?? []).map((farm) => ({ value: farm.id, label: farm.name }))} value={field.value}
                  onChange={(value) => { field.onChange(value); setValue('unit_group_id', ''); }} error={!!errors.farm_id} helperText={errors.farm_id?.message} />
              )} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller name='unit_group_id' control={control} render={({ field }) => (
                <BioSelect disabled={!farmId} loading={loadingGroups} label={text.labels.group} options={unitGroupOptions(groups?.data)} value={field.value} onChange={field.onChange} />
              )} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label={bulk.labels.prefix} placeholder={bulk.placeholders.prefix} size='small' fullWidth error={!!errors.prefix} helperText={errors.prefix?.message} {...register('prefix')} />
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <TextField type='number' label={bulk.labels.from} size='small' fullWidth error={!!errors.from} helperText={errors.from?.message} slotProps={{ htmlInput: { min: 0, step: 1 } }} {...register('from')} />
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <TextField type='number' label={bulk.labels.to} size='small' fullWidth error={!!errors.to} helperText={errors.to?.message} slotProps={{ htmlInput: { min: 0, step: 1 } }} {...register('to')} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller name='type' control={control} render={({ field }) => (
                <BioSelect required label={text.labels.type} options={UNIT_TYPES.map((type) => ({ value: type, label: text.types[type] }))} value={field.value} onChange={field.onChange} error={!!errors.type} helperText={errors.type?.message} />
              )} />
            </Grid>
            {count > 0 && prefix.trim() !== '' && (
              <Grid size={12}>
                <Alert severity='info' icon={false}>{bulk.preview.replace('{first}', `${prefix.trim()}${from}`).replace('{last}', `${prefix.trim()}${to}`).replace('{count}', String(count))}</Alert>
              </Grid>
            )}
            <Grid size={{ xs: 6, md: 4 }}>
              <FormNumber control={control} name='capacity' label={text.labels.capacity} error={!!errors.capacity} helperText={errors.capacity?.message} />
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
              <Controller name='capacity_unit_id' control={control} render={({ field }) => (
                <MeasurementSelector label={text.labels.capacityUnit} defaultValue={field.value ?? null} onChange={(value) => field.onChange(value && !Array.isArray(value) ? value.id : null)} />
              )} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField type='number' label={text.labels.maxBatches} size='small' fullWidth error={!!errors.max_batches} helperText={errors.max_batches?.message} slotProps={{ htmlInput: { min: 1, step: 1 } }} {...register('max_batches')} />
            </Grid>
          </Grid>
          <DialogActions>
            <Button size='small' onClick={() => setOpenDialog(false)}>{common.cancel}</Button>
            <LoadingButton type='submit' variant='contained' size='small' loading={isPending}>{bulk.submit.replace('{count}', String(count))}</LoadingButton>
          </DialogActions>
        </form>
      </DialogContent>
    </>
  );
};

export default BulkUnitsForm;
