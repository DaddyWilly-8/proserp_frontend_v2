'use client'

import React from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { LoadingButton } from '@mui/lab';
import { AddOutlined, DeleteOutlined } from '@mui/icons-material';
import { Autocomplete, Box, Button, DialogActions, DialogContent, DialogTitle, Grid, IconButton, LinearProgress, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import BioSelect, { useStatusOptions } from '../BioSelect';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import InfoHint from '../InfoHint';
import { farmServices, productionUnitServices, speciesTemplateServices } from '../bio-production-services';
import { BioFarm, BioFormProps, BioProductionUnit, BioSpeciesTemplate } from '../types';

const UNIT_TYPES = ['pond', 'cage', 'tank', 'house', 'pen'] as const;

interface UnitFormData {
  farm_id: number | '';
  name: string;
  type: (typeof UNIT_TYPES)[number] | '';
  capacity?: number | null;
  capacity_unit?: string | null;
  max_batches: number | '';
  status: 'active' | 'inactive';
}

const ProductionUnitForm = ({ setOpenDialog, item: unit = null }: BioFormProps<BioProductionUnit>) => {
  const dictionary = useDictionary();
  const text = dictionary.bioProduction.productionUnits;
  const common = dictionary.bioProduction.common;
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const isEdit = !!unit?.id;
  const statuses = useStatusOptions();

  const { data: farms, isLoading: loadingFarms } = useQuery<{ data: BioFarm[] }>({
    queryKey: ['bioFarmOptions'],
    queryFn: () => farmServices.getList({ limit: 500 }),
  });

  // What the unit is set up for: a species, and optionally some of its stages (none chosen means every stage).
  const [suitability, setSuitability] = React.useState<{ species_template_id: number | ''; stages: string[] }[]>(
    (unit?.suitability ?? []).map((entry) => ({ species_template_id: entry.species_template_id, stages: entry.stages }))
  );
  const { data: templates } = useQuery<{ data: BioSpeciesTemplate[] }>({
    queryKey: ['bioSpeciesTemplateOptions'],
    queryFn: () => speciesTemplateServices.getList({ status: 'active', limit: 500 }),
  });
  const updateRow = (index: number, patch: Partial<{ species_template_id: number | ''; stages: string[] }>) =>
    setSuitability((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const validationSchema = yup.object({
    farm_id: yup.number().typeError(text.validation.farmRequired).required(text.validation.farmRequired),
    name: yup.string().trim().required(text.validation.nameRequired),
    type: yup.string().oneOf([...UNIT_TYPES], text.validation.typeRequired).required(text.validation.typeRequired),
    capacity: yup
      .number()
      .transform((value, original) => (original === '' || original == null ? null : value))
      .nullable()
      .min(0, text.validation.capacityInvalid)
      .typeError(text.validation.capacityInvalid),
    capacity_unit: yup.string().nullable(),
    max_batches: yup.number().typeError(text.validation.maxBatchesInvalid).integer(text.validation.maxBatchesInvalid).min(1, text.validation.maxBatchesInvalid).required(text.validation.maxBatchesInvalid),
    status: yup.string().oneOf(['active', 'inactive']).required(),
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<UnitFormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      farm_id: unit?.farm_id ?? '',
      name: unit?.name ?? '',
      type: unit?.type ?? '',
      capacity: unit?.capacity != null && unit.capacity !== '' ? Number(unit.capacity) : null,
      capacity_unit: unit?.capacity_unit ?? '',
      max_batches: unit?.max_batches ?? 1,
      status: unit?.status ?? 'active',
    },
  });

  const payload = () => suitability.filter((row) => row.species_template_id !== '').map((row) => ({ species_template_id: row.species_template_id, stages: row.stages }));

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data: UnitFormData) =>
      isEdit ? productionUnitServices.update({ id: unit!.id, ...data, suitability: payload() }) : productionUnitServices.add({ ...data, suitability: payload() }),
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['bioProductionUnits'] });
      queryClient.invalidateQueries({ queryKey: ['bioFarms'] });
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  return (
    <>
      <DialogTitle textAlign='center'>
        {isEdit ? text.editTitle.replace('{name}', unit?.name ?? '') : text.newTitle}
      </DialogTitle>
      <DialogContent sx={{ pt: '10px !important' }}>
        {loadingFarms && <LinearProgress />}
        <form autoComplete='off' onSubmit={handleSubmit((data) => save(data))}>
          <Grid container spacing={2} mt={0}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name='farm_id'
                control={control}
                render={({ field }) => (
                  <BioSelect required label={text.labels.farm} loading={loadingFarms} options={(farms?.data ?? []).map((farm) => ({ value: farm.id, label: farm.name }))} value={field.value} onChange={field.onChange} error={!!errors.farm_id} helperText={errors.farm_id?.message} />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label={text.labels.name}
                placeholder={text.placeholders.name}
                size='small'
                fullWidth
                error={!!errors.name}
                helperText={errors.name?.message}
                {...register('name')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name='type'
                control={control}
                render={({ field }) => (
                  <BioSelect required label={text.labels.type} options={UNIT_TYPES.map((type) => ({ value: type, label: text.types[type] }))} value={field.value} onChange={field.onChange} error={!!errors.type} helperText={errors.type?.message} />
                )}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
              <TextField
                type='number'
                label={text.labels.capacity}
                size='small'
                fullWidth
                slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                error={!!errors.capacity}
                helperText={errors.capacity?.message}
                {...register('capacity')}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
              <TextField
                label={text.labels.capacityUnit}
                placeholder={text.placeholders.capacityUnit}
                size='small'
                fullWidth
                {...register('capacity_unit')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: isEdit ? 4 : 12 }}>
              <TextField
                type='number'
                label={text.labels.maxBatches}
                helperText={errors.max_batches?.message ?? text.help.maxBatches}
                error={!!errors.max_batches}
                size='small'
                fullWidth
                slotProps={{ htmlInput: { min: 1, step: 1 } }}
                {...register('max_batches')}
              />
            </Grid>
            <Grid size={12}>
              <Stack direction='row' alignItems='center' spacing={0.5}>
                <Typography variant='subtitle2'>{text.labels.suitability}</Typography>
                <InfoHint text={text.help.suitability} />
              </Stack>
              {suitability.map((row, index) => {
                const template = templates?.data.find((item) => item.id === row.species_template_id);
                const taken = suitability.filter((_, i) => i !== index).map((other) => other.species_template_id);

                return (
                  <Grid container spacing={1} key={index} mt={0.5} alignItems='flex-start'>
                    <Grid size={{ xs: 12, md: 5 }}>
                      <BioSelect
                        label={text.labels.species}
                        options={(templates?.data ?? []).filter((item) => !taken.includes(item.id)).map((item) => ({ value: item.id, label: item.name }))}
                        value={row.species_template_id}
                        onChange={(value) => updateRow(index, { species_template_id: value as number | '', stages: [] })}
                      />
                    </Grid>
                    <Grid size={{ xs: 10, md: 6 }}>
                      <Autocomplete
                        multiple
                        size='small'
                        disabled={!template}
                        options={[...(template?.stages ?? [])].sort((x, y) => (x.sequence ?? 0) - (y.sequence ?? 0)).map((stage) => stage.name)}
                        value={row.stages}
                        onChange={(_, value) => updateRow(index, { stages: value })}
                        renderInput={(params) => <TextField {...params} label={text.labels.suitableStages} placeholder={row.stages.length ? undefined : text.labels.allStages} />}
                      />
                    </Grid>
                    <Grid size={{ xs: 2, md: 1 }} textAlign='end'>
                      <Tooltip title={text.buttons.removeSpecies}>
                        <IconButton size='small' color='error' onClick={() => setSuitability((rows) => rows.filter((_, i) => i !== index))}>
                          <DeleteOutlined fontSize='small' />
                        </IconButton>
                      </Tooltip>
                    </Grid>
                  </Grid>
                );
              })}
              <Box mt={0.5}>
                <Button size='small' startIcon={<AddOutlined />} onClick={() => setSuitability((rows) => [...rows, { species_template_id: '', stages: [] }])}>
                  {text.buttons.addSpecies}
                </Button>
              </Box>
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

export default ProductionUnitForm;
