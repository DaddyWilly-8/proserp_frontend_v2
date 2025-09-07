import {
  Grid,
  TextField,
  Button,
  Box,
  Tooltip,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  Typography,
} from '@mui/material';
import { CheckOutlined, DisabledByDefault, EditOutlined, DeleteOutlined } from '@mui/icons-material';
import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { BOMItem } from '../../BomType';
import { Product } from '@/components/productAndServices/products/ProductType';
import { MeasurementUnit } from '@/components/masters/measurementUnits/MeasurementUnitType';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';

// Validation schema for alternative item
const validationSchema = yup.object({
  product: yup.object().required('Product is required').nullable(),
  quantity: yup
    .number()
    .required('Quantity is required')
    .positive('Quantity must be positive'),
  measurement_unit_id: yup.number().required('Unit is required').positive(),
  symbol: yup.string().required('Unit symbol is required'),
});

// Default values for the alternative form
const defaultValues: BOMItem = {
  product_id: null,
  product: null,
  quantity: null,
  measurement_unit_id: null,
  measurement_unit: null,
  symbol: '',
  conversion_factor: 1,
  alternatives: [],
};

interface AlternativesRowProps {
  alternative: BOMItem;
  index: number;
  onUpdate: (updatedItem: BOMItem, index: number) => void;
  onRemove: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  isEditing: boolean;
  isDisabled: boolean;
}

const AlternativesRow: React.FC<AlternativesRowProps> = ({
  alternative,
  index,
  onUpdate,
  onRemove,
  onStartEdit,
  onCancelEdit,
  isEditing,
  isDisabled,
}) => {
  const { productOptions } = useProductsSelect();

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<BOMItem>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      ...defaultValues,
      product: productOptions.find((p: Product) => p.id === (alternative.product_id ?? alternative.product?.id)) ?? null,
      product_id: alternative.product_id ?? alternative.product?.id ?? null,
      quantity: alternative.quantity ?? null,
      measurement_unit_id:
        alternative.measurement_unit_id ??
        alternative.measurement_unit?.id ??
        alternative.product?.primary_unit?.id ??
        alternative.product?.measurement_unit?.id ??
        null,
      measurement_unit:
        alternative.measurement_unit ??
        alternative.product?.primary_unit ??
        alternative.product?.measurement_unit ??
        null,
      symbol:
        alternative.symbol ??
        alternative.measurement_unit?.unit_symbol ??
        alternative.product?.primary_unit?.unit_symbol ??
        alternative.product?.measurement_unit?.unit_symbol ??
        '',
      conversion_factor:
        alternative.conversion_factor ??
        alternative.measurement_unit?.conversion_factor ??
        alternative.product?.primary_unit?.conversion_factor ??
        alternative.product?.measurement_unit?.conversion_factor ??
        1,
      alternatives: alternative.alternatives ?? [],
    },
  });

  const product = watch('product');
  const selectedUnitId = watch('measurement_unit_id');

  // Build unit list from product with fallback to empty array
  const combinedUnits = React.useMemo(() => {
    return [
      ...(product?.secondary_units ?? []),
      ...(product?.primary_unit ? [product.primary_unit] : []),
    ];
  }, [product]);

  // Handle unit changes
  useEffect(() => {
    if (product && selectedUnitId && combinedUnits.length > 0) {
      const selectedUnit = combinedUnits.find((unit) => unit.id === selectedUnitId);
      if (selectedUnit) {
        setValue('symbol', selectedUnit.unit_symbol ?? '', { shouldValidate: true });
        setValue('conversion_factor', selectedUnit.conversion_factor ?? 1, { shouldValidate: true });
        setValue('measurement_unit', selectedUnit, { shouldValidate: true });
      }
    }
  }, [product, selectedUnitId, combinedUnits, setValue]);

  // Reset form when alternative changes
  useEffect(() => {
    reset({
      ...defaultValues,
      product: productOptions.find((p: Product) => p.id === (alternative.product_id ?? alternative.product?.id)) ?? null,
      product_id: alternative.product_id ?? alternative.product?.id ?? null,
      quantity: alternative.quantity ?? null,
      measurement_unit_id:
        alternative.measurement_unit_id ??
        alternative.measurement_unit?.id ??
        alternative.product?.primary_unit?.id ??
        alternative.product?.measurement_unit?.id ??
        null,
      measurement_unit:
        alternative.measurement_unit ??
        alternative.product?.primary_unit ??
        alternative.product?.measurement_unit ??
        null,
      symbol:
        alternative.symbol ??
        alternative.measurement_unit?.unit_symbol ??
        alternative.product?.primary_unit?.unit_symbol ??
        alternative.product?.measurement_unit?.unit_symbol ??
        '',
      conversion_factor:
        alternative.conversion_factor ??
        alternative.measurement_unit?.conversion_factor ??
        alternative.product?.primary_unit?.conversion_factor ??
        alternative.product?.measurement_unit?.conversion_factor ??
        1,
      alternatives: alternative.alternatives ?? [],
    });
  }, [alternative, productOptions, reset]);

  // Handle form submission
  const onSubmit = (data: BOMItem) => {
    const updatedItem: BOMItem = {
      ...data,
      product_id: data.product?.id ?? data.product_id,
      measurement_unit_id: data.measurement_unit_id ?? data.measurement_unit?.id,
      symbol: data.symbol ?? data.measurement_unit?.unit_symbol ?? '',
      conversion_factor: data.conversion_factor ?? 1,
      alternatives: data.alternatives ?? [],
    };
    onUpdate(updatedItem, index);
  };

  if (isEditing) {
    return (
      <Box sx={{ mb: 2, p: 2 }}>
        <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
          <Grid container spacing={2} alignItems="flex-end">
            <Grid size={{ xs: 12, md: 8}}>
              <Controller
                name="product"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <ProductSelect
                    label="Alternative Product"
                    frontError={error}
                    defaultValue={field.value ?? null}
                    onChange={(newValue: Product | null) => {
                      if (newValue) {
                        const unit = newValue.primary_unit ?? newValue.measurement_unit;
                        setValue('product', newValue, { shouldValidate: true });
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
                        field.onChange(null);
                      }
                    }}
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
                        <FormControl
                          variant="standard"
                          sx={{ minWidth: 80, ml: 1 }}
                          error={!!errors.measurement_unit_id}
                        >
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
                      ),
                    }}
                    error={!!error}
                    helperText={error?.message}
                    sx={{
                      '& .MuiInputBase-root': {
                        paddingRight: product ? 0 : '14px',
                      },
                    }}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 12 }} textAlign="right">
              <Button variant="contained" size="small" type="submit">
                <CheckOutlined fontSize="small" /> Done
              </Button>
              <Tooltip title="Cancel">
              <IconButton size="small" onClick={onCancelEdit}>
                <DisabledByDefault fontSize="small" color="success" />
              </IconButton>
            </Tooltip>
            </Grid>
          </Grid>
        </form>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1,
        bgcolor: 'action.hover',
        borderRadius: 1,
      }}
    >
      <Typography
        variant="body2"
        sx={{ fontWeight: 600, minWidth: 24, textAlign: 'center', color: 'text.secondary' }}
      >
        {index + 1}.
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 22 }}>
        <Typography
          variant="body2"
          sx={{ fontWeight: 500, minWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, mr: 2 }}
        >
          {alternative.product?.name}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 60 }}>
          <Typography variant="body2">{alternative.quantity}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {alternative.symbol ?? alternative.measurement_unit?.unit_symbol ?? alternative.product?.primary_unit?.unit_symbol ?? ''}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
          <IconButton size="small" onClick={onStartEdit} color="primary" disabled={isDisabled}>
            <EditOutlined fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={onRemove} color="error" disabled={isDisabled}>
            <DeleteOutlined fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default AlternativesRow;