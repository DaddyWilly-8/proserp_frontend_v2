'use client';
import { yupResolver } from '@hookform/resolvers/yup';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import React from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import assetsServices from '@/components/assets/register/assets-services';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { useStoreProfile } from '../StoreProfileProvider';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const fmt = (amount) =>
  Number(amount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Rendering an identification field per unit stops making sense past this
// many — the quantity is still convertible, the serials just can't all be
// keyed in up front and would need editing per-asset afterward instead.
const MAX_IDENTIFICATION_FIELDS = 50;

function ConvertToAssetDialogContent({ productStock, toggleOpen }) {
  const dictionary = useDictionary();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { activeStore } = useStoreProfile();
  const { authOrganization } = useJumboAuth();
  const multiCostCenters = authOrganization?.costCenters?.length > 1;
  // With a single cost center there's no selector, but the stock-out still has to be
  // recorded on it - otherwise it's invisible in the stock list and the stock never drops.
  const onlyCostCenterId = authOrganization?.costCenters?.length === 1 ? authOrganization.costCenters[0].id : null;

  const convertMutation = useMutation({
    mutationFn: assetsServices.convertFromStock,
    onSuccess: (data) => {
      toggleOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['storeStock'] });
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const validationSchema = yup.object({
    quantity: yup
      .number()
      .typeError(dictionary.forms.stores.convertToAsset.errors.validation.quantity.required)
      .required(dictionary.forms.stores.convertToAsset.errors.validation.quantity.required)
      .integer(dictionary.forms.stores.convertToAsset.errors.validation.quantity.integer)
      .positive(dictionary.forms.stores.convertToAsset.errors.validation.quantity.positive)
      .max(productStock.balance, dictionary.forms.stores.convertToAsset.errors.validation.quantity.max.replace('{count}', productStock.balance)),
    asset_product_id: yup.number().required(dictionary.forms.stores.convertToAsset.errors.validation.assetProduct.required).positive(),
    // With several cost centers the stock-out has to be recorded on one of them.
    cost_center_id: multiCostCenters
      ? yup
          .number()
          .typeError(dictionary.forms.stores.convertToAsset.errors.validation.costCenter.required)
          .required(dictionary.forms.stores.convertToAsset.errors.validation.costCenter.required)
      : yup.number().nullable(),
    conversion_date: yup.string().required(dictionary.forms.stores.convertToAsset.errors.validation.conversionDate.required),
    remarks: yup.string().nullable(),
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      quantity: 1,
      asset_product_id: null,
      cost_center_id: onlyCostCenterId,
      conversion_date: dayjs().toISOString(),
      remarks: '',
      identifications: [],
    },
  });

  const quantity = Number(watch('quantity')) || 0;
  const identifications = watch('identifications') || [];

  const onSubmit = (data) => {
    convertMutation.mutate({
      ...data,
      product_id: productStock.id,
      store_id: activeStore?.id,
      identifications: identifications.slice(0, data.quantity),
    });
  };

  return (
    <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
      <DialogTitle>{dictionary.forms.stores.convertToAsset.title}</DialogTitle>
      <DialogContent>
        <Grid container p={1} spacing={1} rowGap={1}>
          <Grid size={12}>
            <Alert severity="info">
              {dictionary.forms.stores.convertToAsset.messages.availableUnits
                .replace('{name}', productStock.name)
                .replace('{balance}', productStock.balance)
                .replace('{symbol}', productStock.measurement_unit?.symbol ?? '')}
              {productStock.latest_rate
                ? dictionary.forms.stores.convertToAsset.messages.atAverageCost.replace('{cost}', fmt(productStock.latest_rate))
                : ''}
            </Alert>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label={dictionary.forms.stores.convertToAsset.labels.quantityToConvert}
              error={Boolean(errors.quantity)}
              helperText={errors.quantity?.message}
              inputProps={{ min: 1, max: productStock.balance }}
              {...register('quantity')}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <DateTimePicker
              label={dictionary.forms.stores.convertToAsset.labels.conversionDate}
              defaultValue={dayjs()}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small',
                  error: Boolean(errors.conversion_date),
                  helperText: errors.conversion_date?.message,
                },
              }}
              onChange={(value) => setValue('conversion_date', value ? value.toISOString() : null, { shouldValidate: true })}
            />
          </Grid>
          <Grid size={{ xs: 12, md: multiCostCenters ? 6 : 12 }}>
            <ProductSelect
              label={dictionary.forms.stores.convertToAsset.labels.receivingAssetProduct}
              allowedTypes={['Asset']}
              showType={false}
              onChange={(newValue) => setValue('asset_product_id', newValue ? newValue.id : null, { shouldValidate: true })}
              frontError={errors.asset_product_id}
            />
          </Grid>
          {multiCostCenters && (
            <Grid size={{ xs: 12, md: 6 }}>
              <CostCenterSelector
                label={dictionary.forms.stores.convertToAsset.labels.costCenter}
                multiple={false}
                onChange={(newValue) => setValue('cost_center_id', newValue && !Array.isArray(newValue) ? newValue.id : null, { shouldValidate: true })}
                frontError={errors.cost_center_id}
              />
            </Grid>
          )}
          {quantity > 0 && quantity <= MAX_IDENTIFICATION_FIELDS && (
            <>
              <Grid size={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  {dictionary.forms.stores.convertToAsset.labels.identificationSerialNumbers}
                </Typography>
              </Grid>
              {Array.from({ length: quantity }).map((_, index) => (
                <Grid size={{ xs: 12, md: 6 }} key={index}>
                  <TextField
                    fullWidth
                    size="small"
                    label={dictionary.forms.stores.convertToAsset.labels.unitN.replace('{n}', index + 1)}
                    value={identifications[index] || ''}
                    onChange={(e) => {
                      const next = [...identifications];
                      next[index] = e.target.value;
                      setValue('identifications', next);
                    }}
                  />
                </Grid>
              ))}
            </>
          )}
          <Grid size={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              size="small"
              label={dictionary.forms.stores.convertToAsset.labels.remarks}
              {...register('remarks')}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button size="small" onClick={() => toggleOpen(false)}>{dictionary.forms.stores.convertToAsset.buttons.cancel}</Button>
        <LoadingButton
          variant="contained"
          type="submit"
          loading={convertMutation.isPending}
          size="small"
        >
          {dictionary.forms.stores.convertToAsset.buttons.convert}
        </LoadingButton>
      </DialogActions>
    </form>
  );
}

export default ConvertToAssetDialogContent;
