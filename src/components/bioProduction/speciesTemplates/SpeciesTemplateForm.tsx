'use client'

import React from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { AddOutlined, ArrowDownwardOutlined, ArrowUpwardOutlined, DeleteOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import * as yup from 'yup';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import BioSelect, { useStatusOptions } from '../BioSelect';
import InfoHint from '../InfoHint';
import { useBioAccess } from '../useBioAccess';
import NumberField from '../NumberField';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { speciesTemplateServices } from '../bio-production-services';
import { useAllFarmInputCategories } from '../useFarmCategories';
import { WeightUnit, fromGrams, normalizeUnit, toGrams, withUnit } from '../weightUnit';
import { BioFeedingBand, BioFormProps, BioSpeciesTemplate, BioSpeciesTemplateStage } from '../types';

interface TemplateFormData {
  name: string;
  description?: string | null;
  tracking_mode: 'batch' | 'individual';
  count_label?: string | null;
  weight_unit: WeightUnit;
  status: 'active' | 'inactive';
  stages: BioSpeciesTemplateStage[];
  feeding_bands: BioFeedingBand[];
  products: { id: number }[];
}

const emptyBand = (): BioFeedingBand => ({ from_weight_g: null, to_weight_g: null, rate_start_pct: null, rate_end_pct: null, feed_products: [], feed_items: [] });

const emptyStage = (): BioSpeciesTemplateStage => ({
  name: '',
  purpose: 'consumable',
  expected_duration_days: null,
  entry_weight_g: null,
  target_weight_g: null,
  normal_mortality_pct: null,
  useful_life_days: null,
  salvage_value_per_head: null,
});

// An empty number box means "not set", not zero or NaN.
const optionalNumber = (message: string) =>
  yup
    .number()
    .transform((value, original) => (original === '' || original == null ? null : value))
    .nullable()
    .min(0, message)
    .typeError(message);

/** The products are sent as ids. */
// The form holds weights in the species' unit; the server keeps grams.
const payload = ({ products, stages, feeding_bands, ...rest }: TemplateFormData) => ({
  ...rest,
  stages: stages.map((stage) => ({
    ...stage,
    entry_weight_g: stage.entry_weight_g != null && stage.entry_weight_g !== ('' as any) ? toGrams(Number(stage.entry_weight_g), rest.weight_unit) : null,
    target_weight_g: stage.target_weight_g != null && stage.target_weight_g !== ('' as any) ? toGrams(Number(stage.target_weight_g), rest.weight_unit) : null,
  })),
  feeding_bands: (feeding_bands ?? []).filter((band) => band.from_weight_g !== null && band.from_weight_g !== ('' as any) && band.to_weight_g !== null && band.to_weight_g !== ('' as any) && band.rate_start_pct !== null && band.rate_start_pct !== ('' as any)).map((band) => ({
    from_weight_g: toGrams(Number(band.from_weight_g), rest.weight_unit),
    to_weight_g: toGrams(Number(band.to_weight_g), rest.weight_unit),
    rate_start_pct: Number(band.rate_start_pct),
    rate_end_pct: band.rate_end_pct === null || band.rate_end_pct === ('' as any) || band.rate_end_pct === undefined ? null : Number(band.rate_end_pct),
    feed_products: (band.feed_products ?? []).map((feed) => ({ product_id: feed.product_id, share_pct: feed.share_pct === '' || feed.share_pct == null ? null : Number(feed.share_pct) })),
  })),
  product_ids: (products ?? []).map((product) => product.id),
});

const TemplateFormBody = ({ setOpenDialog, template }: { setOpenDialog: (open: boolean) => void; template: BioSpeciesTemplate | null }) => {
  const dictionary = useDictionary();
  const text = dictionary.bioProduction.speciesTemplates;
  const { finance } = useBioAccess();
  const common = dictionary.bioProduction.common;
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const isEdit = !!template?.id;
  const statuses = useStatusOptions();

  const validationSchema = yup.object({
    name: yup.string().trim().required(text.validation.nameRequired),
    description: yup.string().nullable(),
    tracking_mode: yup.string().oneOf(['batch', 'individual']).required(),
    count_label: yup.string().trim().max(30).nullable(),
    status: yup.string().oneOf(['active', 'inactive']).required(),
    stages: yup
      .array()
      .min(1, text.validation.atLeastOneStage)
      .of(
        yup.object({
          name: yup.string().trim().required(text.validation.stageNameRequired),
          purpose: yup.string().oneOf(['consumable', 'bearer']).required(),
          expected_duration_days: optionalNumber(text.validation.numberInvalid),
          entry_weight_g: optionalNumber(text.validation.numberInvalid),
          target_weight_g: optionalNumber(text.validation.numberInvalid),
          normal_mortality_pct: optionalNumber(text.validation.mortalityRange).max(100, text.validation.mortalityRange),
          useful_life_days: optionalNumber(text.validation.numberInvalid),
          salvage_value_per_head: optionalNumber(text.validation.numberInvalid),
        })
      ),
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<TemplateFormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      name: template?.name ?? '',
      description: template?.description ?? '',
      tracking_mode: template?.tracking_mode ?? 'batch',
      count_label: template?.count_label ?? 'fish',
      weight_unit: normalizeUnit(template?.weight_unit),
      status: template?.status ?? 'active',
      products: template?.products ?? [],
      feeding_bands: (template?.feeding_bands ?? []).map((band) => ({
        from_weight_g: fromGrams(Number(band.from_weight_g), template?.weight_unit),
        to_weight_g: fromGrams(Number(band.to_weight_g), template?.weight_unit),
        rate_start_pct: Number(band.rate_start_pct),
        rate_end_pct: band.rate_end_pct != null ? Number(band.rate_end_pct) : null,
        feed_products: (band.feeds ?? []).map((feed) => ({ product_id: feed.product_id, share_pct: feed.share_pct })),
        feed_items: (band.feeds ?? []).filter((feed) => feed.product).map((feed) => feed.product as any),
      })),
      stages: template?.stages?.length
        ? template.stages.map((stage) => ({
            name: stage.name,
            purpose: stage.purpose,
            expected_duration_days: stage.expected_duration_days ?? null,
            entry_weight_g: stage.entry_weight_g != null ? fromGrams(Number(stage.entry_weight_g), template?.weight_unit) : null,
            target_weight_g: stage.target_weight_g != null ? fromGrams(Number(stage.target_weight_g), template?.weight_unit) : null,
            normal_mortality_pct: stage.normal_mortality_pct != null ? Number(stage.normal_mortality_pct) : null,
            useful_life_days: stage.useful_life_days ?? null,
            salvage_value_per_head: stage.salvage_value_per_head != null ? Number(stage.salvage_value_per_head) : null,
          }))
        : [emptyStage()],
    },
  });

  const { fields, append, remove, move } = useFieldArray({ control, name: 'stages' });
  const { fields: bandFields, append: appendBand, remove: removeBand } = useFieldArray({ control, name: 'feeding_bands' });
  const bands = useWatch({ control, name: 'feeding_bands' });
  const inputCategories = useAllFarmInputCategories();
  const stagePurposes = useWatch({ control, name: 'stages' });
  const weightUnit = useWatch({ control, name: 'weight_unit' });

  // Changing the unit keeps the weights the same, only written in the new unit.
  const changeWeightUnit = (next: WeightUnit) => {
    if (next === weightUnit) return;
    (getValues('stages') ?? []).forEach((stage, index) => {
      (['entry_weight_g', 'target_weight_g'] as const).forEach((field) => {
        const value = stage[field];
        if (value != null && value !== ('' as any) && !Number.isNaN(Number(value))) setValue(`stages.${index}.${field}`, fromGrams(toGrams(Number(value), weightUnit), next));
      });
    });
    (getValues('feeding_bands') ?? []).forEach((band, index) => {
      (['from_weight_g', 'to_weight_g'] as const).forEach((field) => {
        const value = band[field];
        if (value != null && value !== ('' as any) && !Number.isNaN(Number(value))) setValue(`feeding_bands.${index}.${field}`, fromGrams(toGrams(Number(value), weightUnit), next));
      });
    });
    setValue('weight_unit', next);
  };

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data: TemplateFormData) =>
      isEdit ? speciesTemplateServices.update({ id: template!.id, ...payload(data) }) : speciesTemplateServices.add(payload(data)),
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['bioSpeciesTemplates'] });
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const stageErrors = errors.stages;

  return (
    <>
      <DialogTitle textAlign='center'>
        {isEdit ? text.editTitle.replace('{name}', template?.name ?? '') : text.newTitle}
      </DialogTitle>
      <DialogContent sx={{ pt: '10px !important' }}>
        <form autoComplete='off' onSubmit={handleSubmit((data) => save(data))}>
          <Grid container spacing={2} mt={0}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label={text.labels.name}
                size='small'
                fullWidth
                error={!!errors.name}
                helperText={errors.name?.message}
                {...register('name')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name='tracking_mode'
                control={control}
                render={({ field }) => (
                  <BioSelect required label={text.labels.trackingMode} options={[{ value: 'batch', label: text.trackingModes.batch }, { value: 'individual', label: text.trackingModes.individual }]} value={field.value} onChange={field.onChange} />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack direction='row' alignItems='center' spacing={0.5}>
                <TextField label={text.labels.countLabel} size='small' fullWidth {...register('count_label')} />
                <InfoHint text={text.help.countLabel} />
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack direction='row' alignItems='center' spacing={0.5}>
                <Box sx={{ flex: 1 }}>
                  <BioSelect required label={text.labels.weightUnit} options={[{ value: 'g', label: text.weightUnits.g }, { value: 'kg', label: text.weightUnits.kg }]} value={weightUnit} onChange={(value) => changeWeightUnit(value as WeightUnit)} />
                </Box>
                <InfoHint text={text.help.weightUnit} />
              </Stack>
            </Grid>
            {isEdit && (
              <Grid size={{ xs: 12, md: 6 }}>
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
              <Stack direction='row' alignItems='flex-start' spacing={0.5}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <ProductSelect
                    multiple
                    label={text.labels.products}
                    allowedTypes={['Inventory']}
                    defaultValue={template?.products ?? []}
                    onChange={(value: any) => setValue('products', (Array.isArray(value) ? value : value ? [value] : []).map((product: any) => ({ id: product.id })), { shouldDirty: true })}
                  />
                </Box>
                <InfoHint text={text.help.products} />
              </Stack>
            </Grid>
            <Grid size={12}>
              <TextField label={text.labels.description} size='small' fullWidth multiline minRows={2} {...register('description')} />
            </Grid>
            <Grid size={12}>
              <Stack direction='row' alignItems='center' spacing={0.5} mt={1}>
                <Typography variant='h5' mb={0}>{text.labels.stages}</Typography>
                <InfoHint text={text.help.stages} />
              </Stack>
              {typeof stageErrors?.message === 'string' && (
                <Typography color='error' variant='body2' mt={1}>{stageErrors.message}</Typography>
              )}
            </Grid>
            {fields.map((field, index) => (
              <Grid size={12} key={field.id}>
                <Divider sx={{ mb: 1.5 }} />
                <Grid container spacing={1} alignItems='flex-start'>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      label={`${text.labels.stageName} ${index + 1}`}
                      size='small'
                      fullWidth
                      error={!!stageErrors?.[index]?.name}
                      helperText={stageErrors?.[index]?.name?.message}
                      {...register(`stages.${index}.name`)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 5 }}>
                    <Controller
                      name={`stages.${index}.purpose`}
                      control={control}
                      render={({ field: purposeField }) => (
                        <BioSelect required label={text.labels.purpose} options={[{ value: 'consumable', label: text.purposes.consumable }, { value: 'bearer', label: text.purposes.bearer }]} value={purposeField.value} onChange={purposeField.onChange} />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Stack direction='row' justifyContent='flex-end'>
                      <Tooltip title={text.buttons.moveUp}>
                        <span>
                          <IconButton size='small' disabled={index === 0} onClick={() => move(index, index - 1)}>
                            <ArrowUpwardOutlined fontSize='small' />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={text.buttons.moveDown}>
                        <span>
                          <IconButton size='small' disabled={index === fields.length - 1} onClick={() => move(index, index + 1)}>
                            <ArrowDownwardOutlined fontSize='small' />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={text.buttons.removeStage}>
                        <span>
                          <IconButton size='small' color='error' disabled={fields.length === 1} onClick={() => remove(index)}>
                            <DeleteOutlined fontSize='small' />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </Grid>
                  {(
                    [
                      ['expected_duration_days', text.labels.durationDays],
                      ['entry_weight_g', withUnit(text.labels.entryWeight, weightUnit)],
                      ['target_weight_g', withUnit(text.labels.targetWeight, weightUnit)],
                      ['normal_mortality_pct', text.labels.normalMortality],
                    ] as const
                  ).map(([name, label]) => (
                    <Grid size={{ xs: 6, md: 3 }} key={name}>
                      <TextField
                        type='number'
                        label={label}
                        size='small'
                        fullWidth
                        slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                        error={!!stageErrors?.[index]?.[name]}
                        helperText={stageErrors?.[index]?.[name]?.message}
                        {...register(`stages.${index}.${name}`)}
                      />
                    </Grid>
                  ))}
                  {stagePurposes?.[index]?.purpose === 'bearer' &&
                    (
                      [
                        ['useful_life_days', text.labels.usefulLife, '1'],
                        ['salvage_value_per_head', text.labels.salvageValue, 'any'],
                      ] as const
                    ).filter(([name]) => finance || name !== 'salvage_value_per_head').map(([name, label, step]) => (
                      <Grid size={{ xs: 6, md: 3 }} key={name}>
                        {name === 'salvage_value_per_head' ? (
                          <Controller
                            name={`stages.${index}.salvage_value_per_head`}
                            control={control}
                            render={({ field }) => (
                              <NumberField label={label} error={!!stageErrors?.[index]?.[name]} helperText={stageErrors?.[index]?.[name]?.message as string} value={field.value as any} onChange={field.onChange} />
                            )}
                          />
                        ) : (
                          <TextField
                            type='number'
                            label={label}
                            size='small'
                            fullWidth
                            slotProps={{ htmlInput: { min: 0, step } }}
                            error={!!stageErrors?.[index]?.[name]}
                            helperText={stageErrors?.[index]?.[name]?.message}
                            {...register(`stages.${index}.${name}`)}
                          />
                        )}
                      </Grid>
                    ))}
                  {stagePurposes?.[index]?.purpose === 'bearer' && (
                    <Grid size={12}>
                      <Stack direction='row' alignItems='center' spacing={0.5}>
                        <Typography variant='caption' color='text.secondary'>{text.labels.depreciation}</Typography>
                        <InfoHint text={text.help.depreciation} />
                      </Stack>
                    </Grid>
                  )}
                </Grid>
              </Grid>
            ))}
            <Grid size={12}>
              <Box>
                <Button size='small' startIcon={<AddOutlined />} onClick={() => append(emptyStage())}>
                  {text.buttons.addStage}
                </Button>
              </Box>
            </Grid>
            <Grid size={12}>
              <Divider sx={{ my: 1 }} />
              <Stack direction='row' alignItems='center' spacing={0.5}>
                <Typography variant='h5' mb={0}>{text.labels.feedingBands}</Typography>
                <InfoHint text={text.help.feedingBands} />
              </Stack>
            </Grid>
            {bandFields.map((field, index) => (
              <Grid size={12} key={field.id}>
                <Grid container spacing={1} alignItems='flex-start'>
                  {(
                    [
                      ['from_weight_g', withUnit(text.labels.bandFrom, weightUnit)],
                      ['to_weight_g', withUnit(text.labels.bandTo, weightUnit)],
                      ['rate_start_pct', text.labels.rateStart],
                      ['rate_end_pct', text.labels.rateEnd],
                    ] as const
                  ).map(([name, label]) => (
                    <Grid size={{ xs: 6, md: 2.5 }} key={name}>
                      <TextField type='number' label={label} size='small' fullWidth slotProps={{ htmlInput: { min: 0, step: 'any' } }} {...register(`feeding_bands.${index}.${name}`)} />
                    </Grid>
                  ))}
                  <Grid size={{ xs: 12, md: 2 }}>
                    <Stack direction='row' justifyContent='flex-end'>
                      <Tooltip title={text.buttons.removeBand}>
                        <IconButton size='small' onClick={() => removeBand(index)}><DeleteOutlined fontSize='small' /></IconButton>
                      </Tooltip>
                    </Stack>
                  </Grid>
                  <Grid size={12}>
                    <ProductSelect
                      multiple
                      label={text.labels.feedProducts}
                      allowedTypes={['Inventory']}
                      allowedCategoryIds={inputCategories}
                      defaultValue={(bands?.[index] as any)?.feed_items ?? []}
                      onChange={(value: any) => {
                        const chosen: any[] = Array.isArray(value) ? value : value ? [value] : [];
                        setValue(`feeding_bands.${index}.feed_items` as any, chosen);
                        setValue(`feeding_bands.${index}.feed_products` as any, chosen.map((product) => ({ product_id: product.id, share_pct: null })), { shouldDirty: true });
                      }}
                    />
                  </Grid>
                </Grid>
                <Divider sx={{ mt: 1.5 }} />
              </Grid>
            ))}
            <Grid size={12}>
              <Box>
                <Button size='small' startIcon={<AddOutlined />} onClick={() => appendBand(emptyBand())}>{text.buttons.addBand}</Button>
              </Box>
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

/** A list row has no stages, so editing loads the full template first. */
const SpeciesTemplateForm = ({ setOpenDialog, item = null }: BioFormProps<BioSpeciesTemplate>) => {
  const { data: template, isFetching } = useQuery<BioSpeciesTemplate>({
    queryKey: ['bioSpeciesTemplate', item?.id],
    queryFn: () => speciesTemplateServices.get(item!.id),
    enabled: !!item?.id,
    gcTime: 0,
  });

  if (item?.id && (isFetching || !template)) {
    return <LinearProgress />;
  }

  return <TemplateFormBody setOpenDialog={setOpenDialog} template={template ?? null} />;
};

export default SpeciesTemplateForm;
