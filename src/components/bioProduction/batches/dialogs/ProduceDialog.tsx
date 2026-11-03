'use client'

import React from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { Alert, Box, Divider, Grid, Stack, TextField, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';
import * as yup from 'yup';
import { animalText } from '../../animalText';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import StoreSelector from '@/components/procurement/stores/StoreSelector';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import { useFarmCategories } from '../../useFarmCategories';
import { useSpeciesProducts } from '../../useSpeciesProducts';
import { batchServices } from '../../bio-production-services';
import { BatchProduce, EditableDialogProps, ProduceCostPreview } from '../batchTypes';
import { money } from '../BatchTables';
import ActionDialog, { FormDate, useBatchAction } from './ActionDialog';
import { nowStamp } from '../../dateTime';
import { FormNumber } from '../../NumberField';

/**
 * Produce collected from animals that stay in the batch (eggs from laying hens). The cost shown is what
 * the stock will go in at: the flock's running cost since the last collection plus its depreciation.
 */
const ProduceDialog = ({ batch, open, onClose, record = null }: EditableDialogProps<BatchProduce>) => {
  const categories = useFarmCategories(batch.farm_id);
  const speciesProducts = useSpeciesProducts(batch.species_template_id);
  const { productOptions } = useProductsSelect();
  const savedProduct = record ? productOptions.find((option: any) => option.id === record.product_id) ?? null : null;
  const text = useDictionary().bioProduction.batches;
  const dialog = text.dialogs.produce;

  const schema = yup.object({
    collection_date: yup.string().required(text.validation.dateRequired),
    product_id: yup.number().typeError(text.validation.productRequired).required(text.validation.productRequired),
    store_id: yup.number().typeError(text.validation.storeRequired).required(text.validation.storeRequired),
    product_quantity: yup.number().typeError(text.validation.numberInvalid).moreThan(0, text.validation.numberInvalid).required(text.validation.numberInvalid),
    remarks: yup.string().nullable(),
  });
  const { control, register, handleSubmit, setValue, reset, formState: { errors } } = useForm<any>({
    resolver: yupResolver(schema) as any,
    defaultValues: record
      ? { collection_date: record.collection_date, product_id: record.product_id, store_id: record.store_id, product_quantity: Number(record.product_quantity), remarks: record.remarks ?? '' }
      : { collection_date: nowStamp(), product_id: null, store_id: null, product_quantity: undefined, remarks: '' },
  });
  const date = useWatch({ control, name: 'collection_date' });
  const quantity = Number(useWatch({ control, name: 'product_quantity' }));

  const { data: cost, isFetching } = useQuery<ProduceCostPreview>({
    queryKey: ['bioProduceCost', batch.id, date],
    queryFn: () => batchServices.getProduceCostPreview(batch.id, date),
    enabled: open && !!date && !record,
  });

  const { mutate, isPending } = useBatchAction(batch.id, record ? batchServices.updateProduce : batchServices.collectProduce, () => { reset(); onClose(); });
  const unitCost = cost && quantity > 0 ? cost.cost / quantity : null;
  const row = (label: string, value: React.ReactNode, bold = false) => (
    <Stack direction='row' justifyContent='space-between'>
      <Typography variant='body2' color='text.secondary'>{label}</Typography>
      <Typography variant='body2' fontWeight={bold ? 700 : 400}>{value}</Typography>
    </Stack>
  );

  return (
    <ActionDialog open={open} title={record ? dialog.editTitle : dialog.title} help={animalText(dialog.help, batch.species_template?.count_label)} loading={isPending} onClose={onClose}
      onSubmit={handleSubmit((data: any) => mutate({ id: batch.id, ...(record ? { collectionId: record.id } : {}), ...data }))}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormDate control={control} name='collection_date' label={text.labels.date} minDate={cost?.last_collection_date ?? batch.current_stage?.start_date} />
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
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
        <Grid size={{ xs: 12, md: 6 }}>
          <FormNumber control={control} name='product_quantity' label={dialog.quantity} error={!!errors.product_quantity} helperText={errors.product_quantity?.message as string} />
        </Grid>
        <Grid size={12}>
          <TextField size='small' fullWidth label={text.labels.remarks} {...register('remarks')} />
        </Grid>
        <Grid size={12}>
          <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5, opacity: isFetching ? 0.6 : 1 }}>
            <Typography variant='overline' color='text.secondary'>{dialog.costTitle}</Typography>
            {record ? (
              <Typography variant='body2' color='text.secondary' mt={0.5}>{dialog.recalculated}</Typography>
            ) : cost ? (
              <Stack spacing={0.5} mt={0.5}>
                {row(dialog.running, money(cost.running_cost))}
                {row(dialog.depreciation.replace('{days}', String(cost.days)), money(cost.depreciation))}
                <Divider />
                {row(dialog.total, money(cost.cost), true)}
                {row(dialog.perUnit, unitCost == null ? '—' : money(unitCost), true)}
                {row(dialog.carried, money(cost.carrying_value))}
                {cost.days_left === 0 && <Alert severity='info' sx={{ mt: 1, py: 0 }}>{dialog.fullyDepreciated}</Alert>}
              </Stack>
            ) : (
              <Typography variant='body2' color='text.secondary'>—</Typography>
            )}
          </Box>
        </Grid>
      </Grid>
    </ActionDialog>
  );
};

export default ProduceDialog;
