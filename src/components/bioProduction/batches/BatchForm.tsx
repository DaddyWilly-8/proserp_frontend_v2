'use client'

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { yupResolver } from '@hookform/resolvers/yup';
import { LoadingButton } from '@mui/lab';
import { Button, DialogActions, DialogContent, DialogTitle, Grid, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import BioSelect from '../BioSelect';
import { unitOccupancy } from '../unitOccupancy';
import { unitSuits } from '../unitSuitability';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { useBioFarm } from '../FarmFirstPage';
import { batchServices, productionUnitServices, speciesTemplateServices } from '../bio-production-services';
import { toGrams, withUnit } from '../weightUnit';
import { BioFarm, BioFormProps, BioProductionUnit, BioSpeciesTemplate } from '../types';
import { Batch } from './batchTypes';
import { FormDate } from './dialogs/ActionDialog';
import { nowStamp } from '../dateTime';

const BatchForm = ({ setOpenDialog }: BioFormProps<Batch>) => {
  const dictionary = useDictionary();
  const text = dictionary.bioProduction.batches;
  const common = dictionary.bioProduction.common;
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { authOrganization } = useJumboAuth();
  const recordingStart = authOrganization?.organization?.recording_start_date;
  const { lang } = useParams<{ lang: string }>();

  const schema = yup.object({
    species_template_id: yup.number().typeError(text.validation.templateRequired).required(text.validation.templateRequired),
    species_template_stage_id: yup.number().transform((value, original) => (original === '' ? null : value)).nullable(),
    production_unit_id: yup.number().typeError(text.validation.unitRequired).required(text.validation.unitRequired),
    start_date: yup.string().required(text.validation.dateRequired),
    initial_quantity: yup.number().typeError(text.validation.quantityRequired).integer(text.validation.quantityRequired)
      .min(1, text.validation.quantityRequired).required(text.validation.quantityRequired),
    average_weight_g: yup.number().transform((value, original) => (original === '' || original == null ? null : value))
      .nullable().min(0, text.validation.numberInvalid).typeError(text.validation.numberInvalid),
    remarks: yup.string().nullable(),
  });

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<any>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      species_template_id: '', species_template_stage_id: '', production_unit_id: '',
      start_date: nowStamp(), initial_quantity: undefined, average_weight_g: '', remarks: '',
    },
  });
  const templateId = watch('species_template_id');
  // The farm is chosen once, at the top of the page.
  const { farm } = useBioFarm();
  const farmId = farm.id;

  const { data: templates } = useQuery<{ data: BioSpeciesTemplate[] }>({
    queryKey: ['bioSpeciesTemplateOptions'],
    queryFn: () => speciesTemplateServices.getList({ status: 'active', limit: 500 }),
  });
  const chosenTemplate = templates?.data.find((item) => item.id === Number(templateId));
  const { data: template } = useQuery<BioSpeciesTemplate>({
    queryKey: ['bioSpeciesTemplate', templateId],
    queryFn: () => speciesTemplateServices.get(templateId),
    enabled: !!templateId,
  });
  const { data: units } = useQuery<{ data: BioProductionUnit[] }>({
    queryKey: ['bioFarmUnits', farmId],
    queryFn: () => productionUnitServices.getList({ farm_id: farmId, status: 'active', limit: 500 }),
    enabled: !!farmId,
  });

  // The stage the batch starts in (the first, unless another is chosen): units must be set up for it.
  const stageId = watch('species_template_stage_id');
  const startStage = [...(template?.stages ?? [])].sort((x, y) => (x.sequence ?? 0) - (y.sequence ?? 0)).find((stage) => (stageId ? stage.id === stageId : true));
  const suitsUnit = (unit: BioProductionUnit) => unitSuits(unit, template?.id, startStage?.name);
  const chosenUnitId = watch('production_unit_id');
  React.useEffect(() => {
    const chosen = units?.data.find((unit) => unit.id === chosenUnitId);
    if (chosen && !suitsUnit(chosen)) setValue('production_unit_id', '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template?.id, startStage?.name, units]);

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data: any) => batchServices.add({ ...data, farm_id: farm.id, average_weight_g: data.average_weight_g == null || data.average_weight_g === '' ? data.average_weight_g : toGrams(Number(data.average_weight_g), chosenTemplate?.weight_unit) }),
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['bioBatches'] });
      router.push(`/${lang}/bioProduction/batches/${data.id}`);
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  return (
    <>
      <DialogTitle textAlign='center'>
        {text.newTitle}
        <Typography variant='body2' color='text.secondary'>{farm.name}</Typography>
      </DialogTitle>
      <DialogContent sx={{ pt: '10px !important' }}>
        <form autoComplete='off' onSubmit={handleSubmit((data: any) => save(data))}>
          <Grid container spacing={2} mt={0}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller name='species_template_id' control={control} render={({ field }) => (
                <BioSelect required label={text.labels.species} options={(templates?.data ?? []).map((item) => ({ value: item.id, label: item.name }))} value={field.value}
                  onChange={(value) => { field.onChange(value); setValue('species_template_stage_id', ''); }} error={!!errors.species_template_id} helperText={errors.species_template_id?.message as string} />
              )} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller name='species_template_stage_id' control={control} render={({ field }) => (
                <BioSelect label={text.labels.startStage} disabled={!template} options={(template?.stages ?? []).map((stage) => ({ value: stage.id as number, label: stage.name }))} value={field.value} onChange={field.onChange} />
              )} />
            </Grid>
            <Grid size={{ xs: 12, md: 12 }}>
              <Controller name='production_unit_id' control={control} render={({ field }) => (
                <BioSelect required label={text.labels.unit} options={(units?.data ?? []).map((unit) => {
                  const { held, max, full, names } = unitOccupancy(unit);

                  const suits = suitsUnit(unit);

                  return { value: unit.id, label: unit.name, disabled: full || !suits, hint: !suits ? text.labels.notSetUp.replace('{species}', template?.name ?? '').replace('{stage}', startStage?.name ?? '') : full ? text.labels.occupiedBy.replace('{batches}', names) : held > 0 ? text.labels.partlyOccupied.replace('{held}', String(held)).replace('{max}', String(max)) : undefined };
                })} value={field.value} onChange={field.onChange} error={!!errors.production_unit_id} helperText={errors.production_unit_id?.message as string} />
              )} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormDate control={control} name='start_date' label={text.labels.startDate} minDate={recordingStart} />
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
              <TextField type='number' size='small' fullWidth label={text.labels.initialQuantity} error={!!errors.initial_quantity}
                helperText={errors.initial_quantity?.message as string} {...register('initial_quantity')} />
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
              <TextField type='number' size='small' fullWidth label={withUnit(text.labels.averageWeight, chosenTemplate?.weight_unit)} error={!!errors.average_weight_g}
                slotProps={{ htmlInput: { step: 'any' } }} helperText={errors.average_weight_g?.message as string} {...register('average_weight_g')} />
            </Grid>
            <Grid size={12}>
              <TextField size='small' fullWidth label={text.labels.remarks} {...register('remarks')} />
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

export default BatchForm;
