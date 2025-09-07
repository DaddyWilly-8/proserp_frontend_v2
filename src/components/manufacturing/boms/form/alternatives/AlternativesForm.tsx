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
import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import ProductQuickAdd from '@/components/productAndServices/products/ProductQuickAdd';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { BOMItem } from '../../BomType';
import { Product } from '@/components/productAndServices/products/ProductType';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';
import AlternativesRow from './AlternativesRow';

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

// Default values for a new alternative
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

// Utility function to resolve measurement unit, symbol, and conversion factor
const resolveUnitDetails = (
  alternative: BOMItem,
  productOptions: Product[]
): Pick<BOMItem, 'product' | 'product_id' | 'measurement_unit_id' | 'measurement_unit' | 'symbol' | 'conversion_factor'> => {
  const product = alternative.product ?? productOptions.find((p) => p.id === alternative.product_id) ?? null;
  const measurementUnit =
    alternative.measurement_unit ??
    product?.primary_unit ??
    product?.measurement_unit ??
    null;
  const unitId = alternative.measurement_unit_id ?? measurementUnit?.id ?? null;
  const symbol =
    alternative.symbol ??
    measurementUnit?.unit_symbol ??
    product?.primary_unit?.unit_symbol ??
    product?.measurement_unit?.unit_symbol ??
    '';
  const conversionFactor =
    alternative.conversion_factor ??
    measurementUnit?.conversion_factor ??
    product?.primary_unit?.conversion_factor ??
    product?.measurement_unit?.conversion_factor ??
    1;

  return {
    product,
    product_id: alternative.product_id ?? product?.id ?? null,
    measurement_unit_id: unitId,
    measurement_unit: measurementUnit,
    symbol,
    conversion_factor: conversionFactor,
  };
};

interface AlternativesFormProps {
  item: BOMItem;
  alternatives: BOMItem[];
  setAlternatives: React.Dispatch<React.SetStateAction<BOMItem[]>>;
  setItems: React.Dispatch<React.SetStateAction<BOMItem[]>>;
  index: number;
  isEditing: boolean;
}

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
  const [openProductQuickAdd, setOpenProductQuickAdd] = React.useState(false);
  const [addedProduct, setAddedProduct] = React.useState<Product | null>(null);
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [warning, setWarning] = React.useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<BOMItem>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues,
  });

  const product = watch('product');
  const selectedUnitId = watch('measurement_unit_id');

  // Build unit list from product
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

  // Handle added product
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

  // Reset form when editingIndex changes
  useEffect(() => {
    if (editingIndex !== null) {
      reset(defaultValues); // Reset to default values (clear product) when entering edit mode
    }
  }, [editingIndex, reset]);

  // Handle form submission
  const onSubmit = (data: BOMItem) => {
    if (!data.product) {
      setWarning('⚠️ Please select a product.');
      return;
    }

    if (data.product.id === item.product?.id) {
      setWarning(`⚠️ ${data.product.name} is already the main input product.`);
      return;
    }

    if (alternatives.some((alt, i) => i !== editingIndex && alt.product?.id === data.product!.id)) {
      setWarning(`⚠️ ${data.product.name} has already been added as an alternative.`);
      return;
    }

    const newAlternative: BOMItem = {
      ...data,
      product_id: data.product.id,
      measurement_unit_id: data.measurement_unit_id ?? data.measurement_unit?.id,
      symbol: data.symbol ?? data.measurement_unit?.unit_symbol ?? '',
      conversion_factor: data.conversion_factor ?? 1,
      alternatives: data.alternatives ?? [],
    };

    let updatedAlternatives: BOMItem[];
    if (editingIndex !== null) {
      updatedAlternatives = [...alternatives];
      updatedAlternatives[editingIndex] = newAlternative;
      setEditingIndex(null);
    } else {
      updatedAlternatives = [...alternatives, newAlternative];
    }

    setAlternatives(updatedAlternatives);
    setItems((prevItems) =>
      prevItems.map((prevItem, i) =>
        i === index ? { ...prevItem, alternatives: updatedAlternatives } : prevItem
      )
    );
    setAddedProduct(null); // Clear added product to prevent persistence
    reset(defaultValues); // Reset form to default values after submission
    setWarning(null);
  };

  // Handle updating an alternative
  const handleUpdateAlternative = (updatedItem: BOMItem, altIndex: number) => {
    if (!updatedItem.product) {
      setWarning('⚠️ Please select a product.');
      return;
    }

    if (updatedItem.product.id === item.product?.id) {
      setWarning(`⚠️ ${updatedItem.product.name} is already the main input product.`);
      return;
    }

    if (alternatives.some((alt, i) => i !== altIndex && alt.product?.id === updatedItem.product!.id)) {
      setWarning(`⚠️ ${updatedItem.product.name} has already been added as an alternative.`);
      return;
    }

    const updatedAlternatives = [...alternatives];
    updatedAlternatives[altIndex] = {
      ...updatedItem,
      product_id: updatedItem.product.id,
      measurement_unit_id: updatedItem.measurement_unit_id ?? updatedItem.measurement_unit?.id,
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
    reset(defaultValues); // Reset form after updating an alternative
  };

  const handleRemoveAlternative = (altIndex: number) => {
    const newAlternatives = alternatives.filter((_, i) => i !== altIndex);
    setAlternatives(newAlternatives);
    setItems((prevItems) =>
      prevItems.map((prevItem, i) =>
        i === index ? { ...prevItem, alternatives: newAlternatives } : prevItem
      )
    );

    if (editingIndex === altIndex) {
      setEditingIndex(null);
      reset(defaultValues);
    }
  };

  const handleStartEdit = (altIndex: number) => {
    if (altIndex < 0 || altIndex >= alternatives.length) {
      setWarning('Invalid alternative index.');
      return;
    }

    setEditingIndex(altIndex);
    setWarning(null);
    reset(defaultValues); // Reset form to default values when starting edit
  };

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
        <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
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
            <Grid size={12} container justifyContent="flex-end">
              <Button
                variant="contained"
                size="small"
                type="submit"
                startIcon={<AddOutlined />}
                sx={{ mt: 1 }}
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