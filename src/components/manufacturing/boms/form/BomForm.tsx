import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  MenuItem,
  Select,
  TextField,
  Typography,
  Box,
  Tooltip,
  IconButton,
} from '@mui/material';
import { AddOutlined } from '@mui/icons-material';
import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useSnackbar } from 'notistack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Product } from '@/components/productAndServices/products/ProductType';
import bomsServices from '../boms-services';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import { BOMPayload, BOMItem } from '../BomType';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import BomItemForm from './BomItemForm';
import BomItemRow from './BomItemRow';
import ProductQuickAdd from '@/components/productAndServices/products/ProductQuickAdd';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';

// Validation schema
const schema = yup.object().shape({
  product_id: yup.number().required('Product is required').positive(),
  quantity: yup.number().required('Quantity is required').min(0, 'Quantity must be non-negative'),
  measurement_unit_id: yup.number().required('Unit is required').positive(),
  conversion_factor: yup.number().required('Conversion factor is required').min(1),
  symbol: yup.string().required('Unit symbol is required'),
});

// Default form values
const defaultValues: BOMPayload = {
  product_id: null,
  product: null,
  quantity: null,
  measurement_unit_id: null,
  measurement_unit: null,
  symbol: '',
  conversion_factor: 1,
  items: [],
  alternatives: [],
  bomNo: '',
};

interface BomFormProps {
  open: boolean;
  toggleOpen: (open: boolean) => void;
  bomId?: number | null;
  bomData?: BOMPayload | null;
  onSuccess?: () => void;
}

const BomForm: React.FC<BomFormProps> = ({ open, toggleOpen, bomId, bomData, onSuccess }) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { checkOrganizationPermission } = useJumboAuth();

  const [items, setItems] = useState<BOMItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitItemForm, setSubmitItemForm] = useState(false);
  const [clearFormKey, setClearFormKey] = useState(0);
  const { productOptions } = useProductsSelect();
  const [openProductQuickAdd, setOpenProductQuickAdd] = useState(false);
  const [addedProduct, setAddedProduct] = useState<Product | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<BOMPayload>({
    resolver: yupResolver(schema) as any,
    defaultValues: defaultValues,
  });

  const product = watch('product');
  const selectedUnitId = watch('measurement_unit_id');

  // Build unit list from product
  const combinedUnits = [
    ...(product?.secondary_units || []),
    ...(product?.primary_unit ? [product.primary_unit] : []),
  ];

  // Handle unit changes
  useEffect(() => {
    if (selectedUnitId && combinedUnits.length > 0) {
      const selectedUnit = combinedUnits.find((unit) => unit.id === selectedUnitId);
      if (selectedUnit) {
        setValue('symbol', selectedUnit.unit_symbol ?? '', { shouldValidate: true });
        setValue('conversion_factor', selectedUnit.conversion_factor ?? 1, { shouldValidate: true });
        setValue('measurement_unit', selectedUnit, { shouldValidate: true });
      }
    }
  }, [selectedUnitId]);

  // Sync form with provided BOM data
  useEffect(() => {
    if (bomData) {
      const measurementUnit = bomData.measurement_unit ?? bomData.product?.primary_unit;
      const symbol = measurementUnit?.unit_symbol ?? bomData.symbol ?? '';
      
      reset({
        ...defaultValues,
        product_id: bomData.product_id ?? bomData.product?.id ?? null,
        product: bomData.product && productOptions.find((product: Product) => product.id === (bomData.product_id ?? bomData.product?.id)),
        quantity: bomData.quantity ?? null,
        measurement_unit_id: bomData.measurement_unit_id ?? measurementUnit?.id ?? null,
        measurement_unit: measurementUnit ?? null,
        symbol: symbol,
        conversion_factor: bomData.conversion_factor ?? measurementUnit?.conversion_factor ?? 1,
        items: bomData.items ?? [],
        alternatives: bomData.alternatives ?? [],
      });
      setItems(
        (bomData.items || []).map(item => ({
          ...item,
          symbol: item.symbol ?? item.measurement_unit?.symbol ?? '',
          alternatives: (item.alternatives || []).map(alt => ({
            ...alt,
            symbol: alt.symbol ?? alt.measurement_unit?.symbol ?? '',
          })),
        }))
      );
    }
  }, [bomData, reset]);

  // Sync items with form state
  useEffect(() => {
    setValue('items', items);
    if (items.length > 0) clearErrors('items');
  }, [items, setValue, clearErrors]);

  // Handle new product addition
  useEffect(() => {
    if (addedProduct) {
      const unit = addedProduct.primary_unit ?? addedProduct.measurement_unit;
      setValue('product', addedProduct);
      setValue('product_id', addedProduct.id);
      setValue('measurement_unit_id', unit?.id ?? null);
      setValue('measurement_unit', unit ?? null);
      setValue('symbol', unit?.unit_symbol ?? '');
      setValue('conversion_factor', unit?.conversion_factor ?? 1);
      setOpenProductQuickAdd(false);
    }
  }, [addedProduct, setValue]);

  // Handle dialog close
  const handleClose = () => {
    reset(defaultValues);
    setItems([]);
    setClearFormKey(prev => prev + 1);
    setAddedProduct(null);
    clearErrors();
    toggleOpen(false);
  };

  // Mutation for adding/updating BOM
  const bomMutation = useMutation({
    mutationFn: (payload: BOMPayload) =>
      bomId ? bomsServices.update(bomId, payload) : bomsServices.add(payload),
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['boms'] });
      handleClose();
      onSuccess?.();
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to save BOM', {
        variant: 'error',
      });
      setIsSubmitting(false);
    },
  });

  // Form submission
  const onSubmit = (data: BOMPayload) => {
    if (items.length === 0) {
      setError('items', { type: 'manual', message: 'Please add at least one item' });
      return;
    }

    const payload: BOMPayload = {
      product_id: Number(data.product_id),
      quantity: Number(data.quantity),
      measurement_unit_id: Number(data.measurement_unit_id),
      symbol: String(data.symbol),
      conversion_factor: Number(data.conversion_factor),
      items: items.map(item => ({
        product_id: Number(item.product?.id ?? item.product_id),
        quantity: Number(item.quantity),
        measurement_unit_id: Number(item.measurement_unit_id),
        conversion_factor: Number(item.conversion_factor) || 1,
        symbol: item.symbol ?? '',
        alternatives:
          item.alternatives?.map(alt => ({
            product_id: Number(alt.product?.id ?? alt.product_id),
            quantity: Number(alt.quantity),
            measurement_unit_id: Number(alt.measurement_unit_id),
            conversion_factor: Number(alt.conversion_factor) || 1,
            symbol: alt.symbol ?? '',
          })) ?? [],
      })),
    };

    setIsSubmitting(true);
    bomMutation.mutate(payload);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ textAlign: 'center' }}>
        <Typography variant="h4" component="span">
          {bomId ? `Edit ${bomData?.bomNo ?? ''}` : 'New Bill of Material'}
        </Typography>
      </DialogTitle>
      <DialogContent>
        {/* Main Product and Quantity */}
        <Grid container spacing={2} mb={3} sx={{ pt: 2 }}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Controller
              name="product"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <ProductSelect
                  label="Output Product"
                  frontError={error}
                  defaultValue={bomData?.product ?? null}
                  addedProduct={addedProduct}
                  onChange={(newValue: Product | null) => {
                    if (newValue) {
                      const unit = newValue.primary_unit ?? newValue.measurement_unit;
                      setValue('product', newValue);
                      setValue('product_id', newValue.id);
                      setValue('measurement_unit_id', unit?.id ?? null);
                      setValue('measurement_unit', unit ?? null);
                      setValue('symbol', unit?.unit_symbol ?? '');
                      setValue('conversion_factor', unit?.conversion_factor ?? 1);
                      field.onChange(newValue);
                    } else {
                      setValue('product', null);
                      setValue('product_id', null);
                      setValue('measurement_unit_id', null);
                      setValue('measurement_unit', null);
                      setValue('symbol', '');
                      setValue('conversion_factor', 1);
                    }
                  }}
                  startAdornment={
                    checkOrganizationPermission(['products_create']) && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Tooltip title="Add New Product">
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenProductQuickAdd(true);
                            }}
                            size="small"
                          >
                            <AddOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )
                  }
                  sx={{ '& .MuiInputBase-root': { paddingRight: '8px' } }}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Controller
              name="quantity"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  label="Quantity"
                  fullWidth
                  size="small"
                  value={field.value ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    const numValue = value ? parseFloat(value.replace(/,/g, '')) : null;
                    field.onChange(numValue);
                  }}
                  InputProps={{
                    inputComponent: CommaSeparatedField,
                    endAdornment: product && (
                      <Controller
                        name="measurement_unit_id"
                        control={control}
                        render={({ field: unitField, fieldState: { error: unitError } }) => (
                          <FormControl variant="standard" sx={{ minWidth: 80, ml: 1 }} error={!!unitError}>
                            <Select
                              size="small"
                              value={selectedUnitId ?? ''}
                              onChange={(e) => {
                                const unitId = Number(e.target.value);
                                setValue('measurement_unit_id', unitId, { shouldValidate: true });
                                const selected = combinedUnits.find((unit) => unit.id === unitId);
                                if (selected) {
                                  setValue('measurement_unit', selected, { shouldValidate: true });
                                  setValue('symbol', selected.unit_symbol ?? '', { shouldValidate: true });
                                  setValue('conversion_factor', selected.conversion_factor ?? 1, { shouldValidate: true });
                                }
                              }}
                            >
                              {combinedUnits.map((unit) => (
                                <MenuItem key={unit.id} value={unit.id}>
                                  {unit.unit_symbol}
                                </MenuItem>
                              ))}
                            </Select>
                            {errors.measurement_unit_id && (
                            <Typography variant="caption" color="error">
                              {errors.measurement_unit_id.message}
                            </Typography>
                          )}
                          </FormControl>
                        )}
                      />
                    ),
                  }}
                  error={!!error}
                  helperText={error?.message}
                  sx={{ '& .MuiInputBase-root': { paddingRight: product ? 0 : '14px' } }}
                />
              )}
            />
          </Grid>
        </Grid>

        {/* BOM Items */}
        <Grid container spacing={2}>
          <Grid size={12}>
            <Divider />
          </Grid>
          <Grid size={12}>
            <BomItemForm
              setItems={setItems}
              items={items}
              key={clearFormKey}
              setClearFormKey={setClearFormKey}
              setSubmitItemForm={setSubmitItemForm}
              submitItemForm={submitItemForm}
              submitMainForm={handleSubmit(onSubmit)}
            />
          </Grid>
          <Grid size={12}>
            {errors.items?.message && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errors.items.message}
              </Alert>
            )}
            {items.map((item, index) => (
              <BomItemRow
                key={index}
                index={index}
                item={{ ...item, symbol: item.symbol ?? item.measurement_unit?.unit_symbol ?? '' }}
                items={items}
                setItems={setItems}
                setClearFormKey={setClearFormKey}
                setSubmitItemForm={setSubmitItemForm}
                submitItemForm={submitItemForm}
                submitMainForm={handleSubmit(onSubmit)}
              />
            ))}
          </Grid>
        </Grid>

        {/* Quick Add Product Dialog */}
        {openProductQuickAdd && (
          <ProductQuickAdd setOpen={setOpenProductQuickAdd} setAddedProduct={setAddedProduct} />
        )}
      </DialogContent>

      <DialogActions>
        <Button size="small" onClick={handleClose} disabled={isSubmitting} variant="outlined">
          Cancel
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BomForm;