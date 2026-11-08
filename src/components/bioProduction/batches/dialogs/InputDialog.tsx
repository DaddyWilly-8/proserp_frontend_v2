'use client'

import React from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { AddOutlined, DeleteOutlined } from '@mui/icons-material';
import { Box, Button, Divider, Grid, IconButton, InputAdornment, LinearProgress, TextField, Tooltip, Typography } from '@mui/material';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import * as yup from 'yup';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import BioSelect from '../../BioSelect';
import { useFarmCategories } from '../../useFarmCategories';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import StoreSelector from '@/components/procurement/stores/StoreSelector';
import { batchServices } from '../../bio-production-services';
import { useAvailableStock } from '../../rounds/useAvailableStock';
import { BatchInput, BioInputType, DialogProps } from '../batchTypes';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';
import ActionDialog, { FormDate, useBatchAction } from './ActionDialog';
import { nowStamp } from '../../dateTime';
import { FormNumber } from '../../NumberField';

interface ItemRow {
  product: any;
  product_id: number | null;
  measurement_unit_id: number | null;
  quantity: number | undefined;
}

const emptyRow = (): ItemRow => ({ product: null, product_id: null, measurement_unit_id: null, quantity: undefined });

const unitOptions = (product: any): { id: number; name: string; symbol?: string }[] =>
  product ? [product.primary_unit, ...(product.secondary_units ?? [])].filter(Boolean) : [];

/** The stock held for the farm of this product, read-only like the sales form's available balance; it also reports what may be issued. */
const StockField = ({ productId, storeId, costCenterId, unitId, date, symbol, onUsable }: {
  productId?: number | null;
  storeId?: number | null;
  costCenterId?: number | null;
  unitId?: number | string | null;
  date?: string;
  symbol?: string;
  onUsable: (usable: number | null) => void;
}) => {
  const text = useDictionary().bioProduction.rounds.labels;
  const { usable, isFetching } = useAvailableStock({ productId, storeId, costCenterId, unitId, date });

  React.useEffect(() => onUsable(usable), [usable]); // eslint-disable-line react-hooks/exhaustive-deps

  return isFetching ? (
    <Box sx={{ pt: 2 }}><LinearProgress /></Box>
  ) : (
    <TextField
      size='small'
      fullWidth
      label={text.available}
      value={usable == null ? '—' : usable.toLocaleString(undefined, { maximumFractionDigits: 4 })}
      error={usable === 0 && !!productId}
      color={usable ? 'success' : undefined}
      focused={usable != null}
      slotProps={{ input: { readOnly: true, endAdornment: <InputAdornment position='end'>{symbol}</InputAdornment> } }}
    />
  );
};

/** Records feed, medication or another input, or, with a record, corrects one made before inputs were daily records. */
const InputDialog = ({ batch, open, onClose, record }: DialogProps & { record?: BatchInput }) => {
  const { productOptions } = useProductsSelect();
  const categories = useFarmCategories(batch.farm_id);
  const text = useDictionary().bioProduction.batches;
  const dialog = text.dialogs.input;
  const rounds = useDictionary().bioProduction.rounds;
  const { authOrganization } = useJumboAuth();

  const schema = yup.object({
    event_date: yup.string().required(text.validation.dateRequired),
    type: yup.string().oneOf(['feed', 'medication', 'other']).required(),
    store_id: yup.number().typeError(text.validation.storeRequired).required(text.validation.storeRequired),
    reason: yup.string().nullable(),
    remarks: yup.string().nullable(),
    items: yup.array().min(1, text.validation.itemsRequired).of(
      yup.object({
        product_id: yup.number().typeError(text.validation.productRequired).required(text.validation.productRequired),
        measurement_unit_id: yup.number().typeError(text.validation.unitOfMeasureRequired).required(text.validation.unitOfMeasureRequired),
        quantity: yup.number().typeError(text.validation.numberInvalid).moreThan(0, text.validation.numberInvalid).required(text.validation.numberInvalid),
      })
    ),
  });

  const { register, handleSubmit, control, setValue, watch, reset, formState: { errors } } = useForm<any>({
    resolver: yupResolver(schema) as any,
    defaultValues: record
      ? {
          event_date: record.event_date, type: record.type, store_id: record.store?.id ?? null, reason: record.reason ?? '', remarks: record.remarks ?? '',
          items: record.items.map((item): ItemRow => ({
            product: productOptions.find((option: any) => option.id === item.product?.id) ?? null,
            product_id: item.product?.id ?? null, measurement_unit_id: item.measurement_unit?.id ?? null, quantity: item.quantity,
          })),
        }
      : { event_date: nowStamp(), type: 'feed' as BioInputType, store_id: null, reason: '', remarks: '', items: [emptyRow()] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  // What each row may issue, reported by its stock field, and the problems that follow from the quantities typed.
  const [usable, setUsable] = React.useState<Record<string, number | null>>({});
  const watchedItems: any[] = watch('items') ?? [];
  const costCenterId = (batch.farm as any)?.cost_center?.id ?? (batch.farm as any)?.cost_center_id;
  const stockIssue = (index: number): string | undefined => {
    const item = watchedItems[index];
    // Correcting an input puts its own stock back first, so what it gave counts as available again.
    const given = record && record.store?.id === watch('store_id') ? record.items.filter((original) => original.product?.id === item?.product_id && original.measurement_unit?.id === item?.measurement_unit_id).reduce((sum, original) => sum + Number(original.quantity), 0) : 0;
    const available = usable[fields[index]?.id] == null ? null : usable[fields[index]?.id]! + given;
    if (!item || available == null || !(Number(item.quantity) > 0)) return undefined;
    // Rows for the same product in the same unit draw on the same stock.
    const others = watchedItems.reduce((sum, other, j) => (j !== index && other.product_id === item.product_id && other.measurement_unit_id === item.measurement_unit_id ? sum + Number(other.quantity || 0) : sum), 0);
    const remaining = available - others;

    return Number(item.quantity) > remaining + 1e-9
      ? available === 0 ? rounds.messages.noStock : rounds.messages.exceedsStock.replace('{remaining}', Math.max(0, remaining).toLocaleString(undefined, { maximumFractionDigits: 4 })).replace('{unit}', '')
      : undefined;
  };
  const hasStockIssue = fields.some((_, index) => !!stockIssue(index));

  const { mutate, isPending } = useBatchAction(batch.id, record ? batchServices.updateInput : batchServices.recordInput, () => { reset(); onClose(); });

  const submit = (data: any) =>
    mutate({
      id: batch.id,
      ...(record ? { eventId: record.id } : {}),
      event_date: data.event_date,
      type: data.type,
      reason: data.reason,
      remarks: data.remarks,
      store_id: data.store_id,
      items: data.items.map((item: ItemRow) => ({
        product_id: item.product_id,
        measurement_unit_id: item.measurement_unit_id,
        quantity: item.quantity,
      })),
    } as any);

  return (
    <ActionDialog open={open} title={record ? dialog.editTitle : dialog.title} help={dialog.help} maxWidth='md' loading={isPending} disableSubmit={hasStockIssue} onClose={onClose}
      onSubmit={handleSubmit(submit)}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Controller name='type' control={control} render={({ field }) => (
            <BioSelect required label={dialog.type} options={(['feed', 'medication', 'other'] as const).map((type) => ({ value: type, label: text.inputTypes[type] }))} value={field.value} onChange={field.onChange} />
          )} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <FormDate control={control} name='event_date' label={text.labels.date} minDate={batch.start_date} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <StoreSelector
            label={dialog.store}
            allowSubStores={true}
            includeStores={authOrganization?.stores?.length ? authOrganization.stores : undefined}
            defaultValue={record?.store ?? null}
            frontError={errors.store_id as any}
            onChange={(store: any) => setValue('store_id', store?.id ?? null, { shouldValidate: true })}
          />
        </Grid>
        {watch('type') === 'medication' && (
          <Grid size={12}>
            <TextField size='small' fullWidth label={dialog.reason} {...register('reason')} />
          </Grid>
        )}
        {fields.map((field, index) => {
          const product = watch(`items.${index}.product`);
          const units = unitOptions(product);
          const itemErrors = (errors.items as any)?.[index];

          return (
            <Grid size={12} key={field.id}>
              <Divider sx={{ mb: 1.5 }} />
              <Grid container spacing={1} alignItems='flex-start'>
                <Grid size={{ xs: 12, md: 4 }}>
                  <ProductSelect
                    label={dialog.product}
                    allowedTypes={['Inventory']}
                    allowedCategoryIds={categories.input}
                    defaultValue={record ? product : null}
                    frontError={itemErrors?.product_id}
                    onChange={(selected: any) => {
                      const unit = selected?.primary_unit?.id ?? selected?.measurement_unit_id ?? null;
                      setValue(`items.${index}.product`, selected ?? null);
                      setValue(`items.${index}.product_id`, selected?.id ?? null, { shouldValidate: true });
                      setValue(`items.${index}.measurement_unit_id`, unit, { shouldValidate: true });
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 2 }}>
                  <Controller name={`items.${index}.measurement_unit_id`} control={control} render={({ field: unitField }) => (
                    <BioSelect required label={dialog.unit} options={units.map((unit) => ({ value: unit.id, label: unit.symbol ?? unit.name }))} value={unitField.value ?? ''} onChange={unitField.onChange} error={!!itemErrors?.measurement_unit_id} helperText={itemErrors?.measurement_unit_id?.message} />
                  )} />
                </Grid>
                <Grid size={{ xs: 6, md: 2 }}>
                  <StockField
                    productId={product?.id}
                    storeId={watch('store_id')}
                    costCenterId={costCenterId}
                    unitId={watchedItems[index]?.measurement_unit_id}
                    date={watch('event_date')}
                    symbol={units.find((unit) => unit.id === watchedItems[index]?.measurement_unit_id)?.symbol}
                    onUsable={(value) => setUsable((current) => (current[field.id] === value ? current : { ...current, [field.id]: value }))}
                  />
                </Grid>
                <Grid size={{ xs: 11, md: 3 }}>
                  <FormNumber control={control} name={`items.${index}.quantity`} label={text.labels.quantity} error={!!itemErrors?.quantity || !!stockIssue(index)} helperText={itemErrors?.quantity?.message ?? stockIssue(index)} />
                </Grid>
                <Grid size={{ xs: 1, md: 1 }} textAlign='end'>
                  <Tooltip title={dialog.removeItem}>
                    <span>
                      <IconButton size='small' color='error' disabled={fields.length === 1} onClick={() => remove(index)}>
                        <DeleteOutlined fontSize='small' />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Grid>
              </Grid>
            </Grid>
          );
        })}
        {typeof (errors.items as any)?.message === 'string' && (
          <Grid size={12}><Typography color='error' variant='body2'>{(errors.items as any).message}</Typography></Grid>
        )}
        <Grid size={12}>
          <Box>
            <Button size='small' startIcon={<AddOutlined />} onClick={() => append(emptyRow())}>{dialog.addItem}</Button>
          </Box>
        </Grid>
        <Grid size={12}>
          <TextField size='small' fullWidth label={text.labels.remarks} {...register('remarks')} />
        </Grid>
      </Grid>
    </ActionDialog>
  );
};

export default InputDialog;
