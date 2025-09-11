import {
  Grid,
  TextField,
  Button,
  Box,
  Alert,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Tooltip,
  IconButton,
} from '@mui/material';
import { AddOutlined } from '@mui/icons-material';
import React, { useEffect, useMemo, useState } from 'react';
import { useForm, Controller, Resolver } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import ProductQuickAdd from '@/components/productAndServices/products/ProductQuickAdd';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { Product } from '@/components/productAndServices/products/ProductType';
import { MeasurementUnit } from '@/components/masters/measurementUnits/MeasurementUnitType';
import AlternativesRow from './AlternativesRow';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';
import { BOMItem } from '../../BomType';

// Validation schema for BOM item
const validationSchema = yup.object({
  product: yup.object().required('Product is required').nullable(),
  quantity: yup
    .number()
    .required('Quantity is required')
    .positive('Quantity must be positive'),
  measurement_unit_id: yup.number().required('Unit is required').positive(),
  symbol: yup.string().required('Unit symbol is required'),
});

// Interface for form props
interface AlternativesFormProps {
  item: BOMItem;
  alternatives: BOMItem[];
  setAlternatives: React.Dispatch<React.SetStateAction<BOMItem[]>>;
  setItems: React.Dispatch<React.SetStateAction<BOMItem[]>>;
  index: number;
  isEditing: boolean;
}

// Utility function to resolve unit details
const resolveUnitDetails = (
  item: BOMItem,
  productOptions: Product[]
): Pick<BOMItem, 'product' | 'product_id' | 'measurement_unit_id' | 'measurement_unit' | 'symbol' | 'conversion_factor' | 'alternatives'> => {
  const product = item.product ?? productOptions.find((product:Product) => product.id === (item.product_id ?? item.product?.id));
  const measurementUnit =
    item.measurement_unit ??
    product?.primary_unit ??
    product?.measurement_unit ??
    null;
  const unitId = item.measurement_unit_id ?? measurementUnit?.id ?? null;
  const symbol =
    item.symbol ??
    measurementUnit?.unit_symbol ??
    product?.primary_unit?.unit_symbol ??
    product?.measurement_unit?.unit_symbol ??
    '';
  const conversionFactor =
    item.conversion_factor ??
    measurementUnit?.conversion_factor ??
    product?.primary_unit?.conversion_factor ??
    product?.measurement_unit?.conversion_factor ??
    1;

  return {
    product: product ?? null,
    product_id: product?.id ?? null,
    measurement_unit_id: unitId,
    measurement_unit: measurementUnit,
    symbol,
    conversion_factor: conversionFactor,
    alternatives: item.alternatives ?? [],
  };
};

const AlternativesForm: React.FC<AlternativesFormProps> = ({
  item,
  alternatives,
  setAlternatives,
  setItems,
  index,
  isEditing,
}) => {
  const { checkOrganizationPermission } = useJumboAuth();
  const { productOptions } = useProductsSelect();
  const [openProductQuickAdd, setOpenProductQuickAdd] = useState(false);
  const [addedProduct, setAddedProduct] = useState<Product | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  // Initialize default values with productOptions
  const defaultValues = useMemo(() => {
    if (editingIndex !== null && alternatives[editingIndex]) {
      return {
        ...resolveUnitDetails(alternatives[editingIndex], productOptions),
        quantity: alternatives[editingIndex].quantity ?? null,
      };
    }
    return {
      product: null,
      product_id: null,
      quantity: null,
      measurement_unit_id: null,
      measurement_unit: null,
      symbol: '',
      conversion_factor: 1,
      alternatives: [],
    };
  }, [editingIndex, alternatives, productOptions]);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<BOMItem>({
    resolver: yupResolver(validationSchema as any),
    defaultValues,
  });

  const product = watch('product');
  const selectedUnitId = watch('measurement_unit_id');

  // Build unit list from product
  const combinedUnits = useMemo(() => {
    return [
      ...(product?.secondary_units ?? []),
      ...(product?.primary_unit ? [product.primary_unit] : []),
    ];
  }, [product]);

  // Handle unit changes
  useEffect(() => {
    if (product && selectedUnitId && combinedUnits.length > 0) {
      const selectedUnit = combinedUnits.find((unit: MeasurementUnit) => unit.id === selectedUnitId);
      if (selectedUnit) {
        setValue('symbol', selectedUnit.unit_symbol ?? '', { shouldValidate: true });
        setValue('conversion_factor', selectedUnit.conversion_factor ?? 1, { shouldValidate: true });
        setValue('measurement_unit', selectedUnit, { shouldValidate: true });
      }
    }
  }, [product, selectedUnitId, combinedUnits, setValue]);

  // Handle added product
  useEffect(() => {
    if (addedProduct) {
      const unit = addedProduct.primary_unit ?? addedProduct.measurement_unit;
      setValue('product', addedProduct, { shouldValidate: true });
      setValue('product_id', addedProduct.id);
      setValue('measurement_unit_id', unit?.id ?? null);
      setValue('measurement_unit', unit ?? null);
      setValue('symbol', unit?.unit_symbol ?? '');
      setValue('conversion_factor', unit?.conversion_factor ?? 1);
      setOpenProductQuickAdd(false);
    }
  }, [addedProduct, setValue]);

  // Reset form when defaultValues change
  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  // Handle form submission
  const handleFormSubmit = (data: BOMItem) => {
    if (!data.product) {
      setWarning('Please select a product.');
      return;
    }

    if (data.product.id === item.product?.id) {
      setWarning(`${data.product.name} is already the main input product.`);
      return;
    }

    if (alternatives.some((alt, i) => i !== editingIndex && alt.product?.id === data.product!.id)) {
      setWarning(`${data.product.name} is already an alternative product.`);
      return;
    }

    const newItem: BOMItem = {
      ...data,
      product_id: data.product.id,
      measurement_unit_id: data.measurement_unit_id ?? data.measurement_unit?.id ?? null,
      symbol: data.symbol ?? data.measurement_unit?.unit_symbol ?? '',
      conversion_factor: data.conversion_factor ?? 1,
      alternatives: data.alternatives ?? [],
    };

    const updatedAlternatives = [...alternatives];
    if (editingIndex !== null) {
      updatedAlternatives[editingIndex] = newItem;
      setEditingIndex(null);
    } else {
      updatedAlternatives.push(newItem);
    }

    setAlternatives(updatedAlternatives);
    setItems((prevItems) =>
      prevItems.map((prevItem, i) =>
        i === index ? { ...prevItem, alternatives: updatedAlternatives } : prevItem
      )
    );
    setAddedProduct(null);
    reset(defaultValues);
    setWarning(null);
  };

  // Handle updating an alternative
  const handleUpdateAlternative = (updatedItem: BOMItem , altIndex: number) => {
    if (!updatedItem.product) {
      setWarning('Please select a product.');
      return;
    }

    if (updatedItem.product.id === item.product?.id) {
      setWarning(`${updatedItem.product.name} is already the main input product.`);
      return;
    }

    if (alternatives.some((alt, i) => i !== altIndex && alt.product?.id === updatedItem.product!.id)) {
      setWarning(`${updatedItem.product.name} is already an alternative product.`);
      return;
    }

    const updatedAlternatives = [...alternatives];
    updatedAlternatives[altIndex] = {
      ...updatedItem,
      product_id: updatedItem.product.id,
      measurement_unit_id: updatedItem.measurement_unit_id ?? updatedItem.measurement_unit?.id ?? null,
      symbol: updatedItem.symbol ?? updatedItem.measurement_unit?.unit_symbol ?? '',
      conversion_factor: updatedItem.conversion_factor ?? 1,
      alternatives: updatedItem.alternatives ?? [],
    };
    setAlternatives(updatedAlternatives);
    setItems((prevItems) =>
      prevItems.map((prevItem, i) =>
        i === index ? { ...prevItem, alternatives: updatedAlternatives } : prevItem
      )
    );

    setEditingIndex(null);
    setWarning(null);
    reset(defaultValues);
  };

  // Handle removing an alternative
  const handleRemoveAlternative = (altIndex: number) => {
    const updatedAlternatives = alternatives.filter((_, i) => i !== altIndex);
    setAlternatives(updatedAlternatives);
    setItems((prevItems) =>
      prevItems.map((prevItem, i) =>
        i === index ? { ...prevItem, alternatives: updatedAlternatives } : prevItem
      )
    );

    if (editingIndex === altIndex) {
      setEditingIndex(null);
      reset(defaultValues);
    }
  };

  // Handle starting edit mode
  const handleStartEdit = (altIndex: number) => {
    if (altIndex < 0 || altIndex >= alternatives.length) {
      setWarning('Invalid alternative index.');
      return;
    }

    setEditingIndex(altIndex);
    setWarning(null);
  };

  // Handle canceling edit mode
  const handleCancelEdit = () => {
    setEditingIndex(null);
    setWarning(null);
    reset(defaultValues);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
        Alternative Input Products
      </Typography>

      {warning && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {warning}
        </Alert>
      )}

      {!isEditing && (
        <form onSubmit={handleSubmit(handleFormSubmit)} autoComplete="off">
          <Grid container spacing={1} alignItems="flex-end" sx={{ mb: 1 }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Controller
                name="product"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <ProductSelect
                    label="Alternative Input Product"
                    frontError={error}
                    defaultValue={field.value ?? null}
                    addedProduct={addedProduct}
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
                      setWarning(null);
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
                              sx={{ p: 0.5 }}
                              aria-label="Add new product"
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
                              const selected = combinedUnits.find((unit: MeasurementUnit) => unit.id === unitId);
                              if (selected) {
                                setValue('measurement_unit', selected, { shouldValidate: true });
                                setValue('symbol', selected.unit_symbol ?? '', { shouldValidate: true });
                                setValue('conversion_factor', selected.conversion_factor ?? 1, { shouldValidate: true });
                              }
                            }}
                          >
                            {combinedUnits.map((unit: MeasurementUnit) => (
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
                    inputProps={{ autoComplete: 'off' }}
                  />
                )}
              />
            </Grid>
            <Grid size={12} container justifyContent="flex-end">
              <Button
                variant="contained"
                size="small"
                type="submit"
                startIcon={<AddOutlined />}
                sx={{ mt: 1 }}
                aria-label="Add alternative product"
              >
                Add
              </Button>
            </Grid>
          </Grid>
        </form>
      )}

      {openProductQuickAdd && (
        <ProductQuickAdd setOpen={setOpenProductQuickAdd} setAddedProduct={setAddedProduct} />
      )}

      {alternatives.length > 0 && (
        <Box>
          {alternatives.map((alternative, altIndex) => (
            <AlternativesRow
              key={altIndex}
              alternative={alternative}
              index={altIndex}
              onUpdate={(updatedItem) => handleUpdateAlternative(updatedItem, altIndex)}
              onRemove={() => handleRemoveAlternative(altIndex)}
              onStartEdit={() => handleStartEdit(altIndex)}
              onCancelEdit={handleCancelEdit}
              isEditing={editingIndex === altIndex}
              isDisabled={isEditing && editingIndex !== altIndex}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default AlternativesForm;