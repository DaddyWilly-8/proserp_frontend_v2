'use client'

import React from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { LoadingButton } from '@mui/lab';
import { Autocomplete, Button, DialogActions, DialogContent, DialogTitle, Grid, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import MeasurementSelector from '@/components/masters/measurementUnits/MeasurementSelector';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import BioSelect, { useStatusOptions } from '../BioSelect';
import InfoHint from '../InfoHint';
import { measurementParameterServices } from '../bio-production-services';
import { BioFormProps, BioMeasurementParameter, BioProductionUnit } from '../types';

const UNIT_TYPES: BioProductionUnit['type'][] = ['pond', 'cage', 'tank', 'house', 'pen'];
const LIMITS = ['watch_min', 'watch_max', 'critical_min', 'critical_max'] as const;

interface ParameterFormData {
  name: string;
  unit_types: BioProductionUnit['type'][];
  decimals: number | '';
  watch_min: string;
  watch_max: string;
  critical_min: string;
  critical_max: string;
  status: 'active' | 'inactive';
}

const asText = (value?: number | null) => (value == null ? '' : String(value));

const ParameterForm = ({ setOpenDialog, item: parameter = null }: BioFormProps<BioMeasurementParameter>) => {
  const dictionary = useDictionary();
  const text = dictionary.bioProduction.measurementParameters;
  const common = dictionary.bioProduction.common;
  const types = dictionary.bioProduction.productionUnits.types;
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const isEdit = !!parameter?.id;
  const statuses = useStatusOptions();

  const limit = yup.string().nullable().test('number', text.validation.numberInvalid, (value) => !value || !Number.isNaN(Number(value)));
  const schema = yup.object({
    name: yup.string().trim().required(text.validation.nameRequired),
    unit_types: yup.array().of(yup.string()),
    decimals: yup.number().typeError(text.validation.decimalsInvalid).integer(text.validation.decimalsInvalid).min(0, text.validation.decimalsInvalid).max(6, text.validation.decimalsInvalid).required(text.validation.decimalsInvalid),
    watch_min: limit, watch_max: limit, critical_min: limit, critical_max: limit,
    status: yup.string().oneOf(['active', 'inactive']).required(),
  });

  // The unit is chosen from the organization's measurement units, and may be left out (pH has none).
  const [unitId, setUnitId] = React.useState<number | null>(parameter?.measurement_unit_id ?? null);

  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm<ParameterFormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      name: parameter?.name ?? '',
      unit_types: parameter?.unit_types ?? [],
      decimals: parameter?.decimals ?? 2,
      watch_min: asText(parameter?.watch_min), watch_max: asText(parameter?.watch_max),
      critical_min: asText(parameter?.critical_min), critical_max: asText(parameter?.critical_max),
      status: parameter?.status ?? 'active',
    },
  });

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data: ParameterFormData) => {
      const payload: Record<string, unknown> = { ...data, unit_types: data.unit_types, measurement_unit_id: unitId };
      LIMITS.forEach((key) => { payload[key] = data[key] === '' ? null : Number(data[key]); });

      return isEdit ? measurementParameterServices.update({ id: parameter!.id, ...payload }) : measurementParameterServices.add(payload);
    },
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['bioMeasurementParameters'] });
      queryClient.invalidateQueries({ queryKey: ['bioMeasurementParameterOptions'] });
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const limitField = (name: (typeof LIMITS)[number], label: string) => (
    <Grid size={{ xs: 6, md: 3 }} key={name}>
      <TextField
        size='small'
        fullWidth
        label={label}
        value={watch(name)}
        error={!!errors[name]}
        helperText={errors[name]?.message}
        onChange={(event) => setValue(name, event.target.value.replace(/,/g, ''), { shouldValidate: true, shouldDirty: true })}
        InputProps={{ inputComponent: CommaSeparatedField }}
      />
    </Grid>
  );

  return (
    <>
      <DialogTitle textAlign='center'>{isEdit ? text.editTitle.replace('{name}', parameter?.name ?? '') : text.newTitle}</DialogTitle>
      <DialogContent sx={{ pt: '10px !important' }}>
        <form autoComplete='off' onSubmit={handleSubmit((data) => save(data))}>
          <Grid container spacing={2} mt={0}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label={text.labels.name} size='small' fullWidth error={!!errors.name} helperText={errors.name?.message} {...register('name')} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <MeasurementSelector
                label={text.labels.unit}
                defaultValue={parameter?.measurement_unit_id ?? null}
                onChange={(value) => setUnitId(value && !Array.isArray(value) ? value.id : null)}
              />
              {!unitId && parameter?.unit_label && (
                <Typography variant='caption' color='text.secondary'>{text.help.legacyUnit.replace('{label}', parameter.unit_label)}</Typography>
              )}
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <TextField type='number' label={text.labels.decimals} size='small' fullWidth error={!!errors.decimals} helperText={errors.decimals?.message}
                slotProps={{ htmlInput: { min: 0, max: 6, step: 1 } }} {...register('decimals')} />
            </Grid>
            <Grid size={12}>
              <Stack direction='row' alignItems='flex-start' spacing={0.5}>
                <Controller
                  name='unit_types'
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      multiple
                      fullWidth
                      size='small'
                      options={UNIT_TYPES}
                      getOptionLabel={(type) => types[type]}
                      value={field.value}
                      onChange={(_, value) => field.onChange(value)}
                      renderInput={(params) => <TextField {...params} label={text.labels.types} placeholder={field.value.length ? undefined : text.allTypes} />}
                    />
                  )}
                />
                <InfoHint text={text.help.types} />
              </Stack>
            </Grid>
            <Grid size={12}>
              <Stack direction='row' alignItems='center' spacing={0.5}>
                <Typography variant='subtitle2'>{text.labels.limits}</Typography>
                <InfoHint text={text.help.limits} />
              </Stack>
            </Grid>
            {limitField('watch_min', `${text.labels.watch}: ${text.labels.min}`)}
            {limitField('watch_max', `${text.labels.watch}: ${text.labels.max}`)}
            {limitField('critical_min', `${text.labels.critical}: ${text.labels.min}`)}
            {limitField('critical_max', `${text.labels.critical}: ${text.labels.max}`)}
            {isEdit && (
              <Grid size={{ xs: 12, md: 4 }}>
                <Controller name='status' control={control} render={({ field }) => (
                  <BioSelect required label={text.labels.status} options={statuses} value={field.value} onChange={field.onChange} />
                )} />
              </Grid>
            )}
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

export default ParameterForm;
