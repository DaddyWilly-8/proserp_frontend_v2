'use client'

import React from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { Alert, Grid, TextField } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';
import * as yup from 'yup';
import { animalText } from '../../animalText';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import StoreSelector from '@/components/procurement/stores/StoreSelector';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import { useFarmCategories } from '../../useFarmCategories';
import { useSpeciesProducts } from '../../useSpeciesProducts';
import { batchServices } from '../../bio-production-services';
import { BatchHarvest, EditableDialogProps } from '../batchTypes';
import ActionDialog, { FormDate, useBatchAction } from './ActionDialog';
import { nowStamp } from '../../dateTime';
import { useWriteOffPreview } from './WriteOffDialog';
import { FormNumber } from '../../NumberField';

const HarvestDialog = ({ batch, open, onClose, record = null }: EditableDialogProps<BatchHarvest>) => {
  const categories = useFarmCategories(batch.farm_id);
  const speciesProducts = useSpeciesProducts(batch.species_template_id);
  const { productOptions } = useProductsSelect();
  const savedProduct = record ? productOptions.find((option: any) => option.id === record.product_id) ?? null : null;
  // Taking the harvest back first returns its animals to the batch.
  const available = batch.current_quantity + (record?.quantity ?? 0);
  const text = useDictionary().bioProduction.batches;
  const dialog = text.dialogs.harvest;
  const { data: preview } = useWriteOffPreview(batch.id, open);
  const blocked = (preview?.quantity ?? 0) > 0;

  const schema = yup.object({
    harvest_date: yup.string().required(text.validation.dateRequired),
    quantity: yup.number().typeError(text.validation.quantityRequired).integer(text.validation.quantityRequired)
      .min(1, text.validation.quantityRequired).max(available, text.validation.tooMany).required(text.validation.quantityRequired),
    product_id: yup.number().typeError(text.validation.productRequired).required(text.validation.productRequired),
    store_id: yup.number().typeError(text.validation.storeRequired).required(text.validation.storeRequired),
    product_quantity: yup.number().typeError(text.validation.numberInvalid).moreThan(0, text.validation.numberInvalid).required(text.validation.numberInvalid),
    remarks: yup.string().nullable(),
  });
  const { control, register, handleSubmit, setValue, reset, formState: { errors } } = useForm<any>({
    resolver: yupResolver(schema) as any,
    defaultValues: record
      ? { harvest_date: record.harvest_date, quantity: record.quantity, product_id: record.product_id, store_id: record.store_id, product_quantity: Number(record.product_quantity), remarks: record.remarks ?? '' }
      : { harvest_date: nowStamp(), quantity: undefined, product_id: null, store_id: null, product_quantity: undefined, remarks: '' },
  });

  const { mutate, isPending } = useBatchAction(batch.id, record ? batchServices.updateHarvest : batchServices.harvest, () => { reset(); onClose(); });

  return (
    <ActionDialog open={open} title={record ? dialog.editTitle : dialog.title} help={animalText(dialog.help, batch.species_template?.count_label)} loading={isPending} disableSubmit={blocked} onClose={onClose}
      onSubmit={handleSubmit((data: any) => mutate({ id: batch.id, ...(record ? { harvestId: record.id } : {}), ...data }))}>
      {blocked && <Alert severity='warning' sx={{ mb: 2 }}>{dialog.blocked}</Alert>}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormDate control={control} name='harvest_date' label={text.labels.date} minDate={batch.start_date} />
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <FormNumber control={control} name='quantity' integer label={`${animalText(dialog.fish, batch.species_template?.count_label)} (max ${available.toLocaleString()})`} error={!!errors.quantity} helperText={errors.quantity?.message as string} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ProductSelect
            label={dialog.product}
            allowedTypes={['Inventory']}
            allowedCategoryIds={categories.output}
            requiredProducts={speciesProducts}
            defaultValue={savedProduct}
            frontError={errors.product_id as any}
            onChange={(product: any) => setValue('product_id', product?.id ?? null, { shouldValidate: true })}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <StoreSelector
            label={dialog.store}
            defaultValue={record?.store ?? null}
            frontError={errors.store_id as any}
            onChange={(store: any) => setValue('store_id', store?.id ?? null, { shouldValidate: true })}
          />
        </Grid>
        <Grid size={12}>
          <FormNumber control={control} name='product_quantity' label={dialog.weight} error={!!errors.product_quantity} helperText={errors.product_quantity?.message as string} />
        </Grid>
        <Grid size={12}>
          <TextField size='small' fullWidth label={text.labels.remarks} {...register('remarks')} />
        </Grid>
      </Grid>
    </ActionDialog>
  );
};

export default HarvestDialog;
