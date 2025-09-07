import {
  Grid,
  TextField,
  Button,
  LinearProgress,
  Box,
  Tooltip,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  Typography,
} from '@mui/material';
import { AddOutlined, CheckOutlined, DisabledByDefault } from '@mui/icons-material';
import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import ProductQuickAdd from '@/components/productAndServices/products/ProductQuickAdd';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { BOMItem } from '../BomType';
import { Product } from '@/components/productAndServices/products/ProductType';
import { MeasurementUnit } from '@/components/masters/measurementUnits/MeasurementUnitType';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';

interface BomItemFormProps {
  setClearFormKey: React.Dispatch<React.SetStateAction<number>>;
  submitMainForm: () => void;
  submitItemForm: boolean;
  setSubmitItemForm: React.Dispatch<React.SetStateAction<boolean>>;
  item?: BOMItem;
  index?: number;
  setItems: React.Dispatch<React.SetStateAction<BOMItem[]>>;
  items: BOMItem[];
  setShowForm?: React.Dispatch<React.SetStateAction<boolean>>;
}

const validationSchema = yup.object({
  product: yup.object().required('Product is required').nullable(),
  quantity: yup
    .number()
    .required('Quantity is required')
    .positive('Quantity must be positive'),
  measurement_unit_id: yup.number().required('Unit is required').positive(),
  symbol: yup.string().required('Unit symbol is required'),
});

// Utility function to handle symbol resolution
const getUnitSymbol = (item: BOMItem): string => {
  return (
    item.symbol ||
    item.measurement_unit?.unit_symbol ||
    item.product?.primary_unit?.unit_symbol ||
    item.product?.measurement_unit?.unit_symbol ||
    ''
  );
};

const BomItemForm: React.FC<BomItemFormProps> = ({
  setClearFormKey,
  submitMainForm,
  submitItemForm,
  setSubmitItemForm,
  item = null,
  index = -1,
  setItems,
  items = [],
  setShowForm = null,
}) => {
  const [openProductQuickAdd, setOpenProductQuickAdd] = useState(false);
  const [addedProduct, setAddedProduct] = useState<Product | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const { productOptions } = useProductsSelect();
  const { checkOrganizationPermission } = useJumboAuth();

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
      product: item && productOptions.find((product: Product) => product.id === (item.product_id ?? item.product?.id)),
      product_id: item?.product_id ?? item?.product?.id ?? null,
      quantity: item?.quantity ?? null,
      measurement_unit_id: 
        item?.measurement_unit_id ??
        item?.measurement_unit?.id ??
        item?.product?.primary_unit?.id ??
        item?.product?.measurement_unit?.id ??
        null,
      measurement_unit: 
        item?.measurement_unit ??
        item?.product?.primary_unit ??
        item?.product?.measurement_unit ??
        null,
      symbol: 
        item?.symbol ??
        item?.measurement_unit?.unit_symbol ??
        item?.product?.primary_unit?.unit_symbol ??
        item?.product?.measurement_unit?.unit_symbol ??
        '',
      conversion_factor: 
        item?.conversion_factor ??
        item?.measurement_unit?.conversion_factor ??
        item?.product?.primary_unit?.conversion_factor ??
        item?.product?.measurement_unit?.conversion_factor ??
        1,
      alternatives: item?.alternatives ?? [],
    },
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

  // Update items on submit
  const onSubmit = (data: BOMItem) => {
    setIsAdding(true);

    const newItem: BOMItem = {
      ...data,
      product_id: data.product?.id ?? data.product_id,
      measurement_unit_id: data.measurement_unit_id ?? data.measurement_unit?.id,
      symbol: data.symbol ?? data.measurement_unit?.unit_symbol ?? '',
      conversion_factor: data.conversion_factor ?? 1,
      alternatives: data.alternatives?.map(alt => ({
        ...alt,
        symbol: alt.symbol ?? alt.measurement_unit?.unit_symbol ?? '',
      })) ?? [],
    };

    const updatedItems = [...items];
    if (index > -1) {
      updatedItems[index] = newItem;
      setShowForm?.(false);
    } else {
      updatedItems.push(newItem);
      reset();
      setClearFormKey((prev) => prev + 1);
    }
    setItems(updatedItems);

    if (submitItemForm) {
      submitMainForm();
    }
  };

  // Handle external submit trigger
  useEffect(() => {
    if (submitItemForm) {
      handleSubmit(onSubmit, () => setSubmitItemForm(false))();
    }
  }, [submitItemForm, handleSubmit]);

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
  }, [addedProduct]);

  if (isAdding) return <LinearProgress />;

  return (
    <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
      <Grid container spacing={2} alignItems="flex-end" mb={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Controller
            name="product"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <ProductSelect
                label="Input Product"
                frontError={error}
                defaultValue={item?.product ?? null}
                addedProduct={addedProduct}
                onChange={(newValue: Product | null) => {
                  if (newValue) {
                    const unit = newValue.primary_unit ?? newValue.measurement_unit;
                    setValue('product', newValue, { shouldDirty: true, shouldValidate: true });
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
                sx={{
                  '& .MuiInputBase-root': {
                    paddingRight: '8px',
                  },
                }}
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
      </Grid>

      <Grid size={12} textAlign="right">
        <Button variant="contained" size="small" type="submit">
          {index > -1 ? (
            <>
              <CheckOutlined fontSize="small" /> Done
            </>
          ) : (
            <>
              <AddOutlined fontSize="small" /> Add
            </>
          )}
        </Button>
        {index > -1 && (
          <Tooltip title="Close Edit">
            <IconButton size="small" onClick={() => setShowForm?.(false)}>
              <DisabledByDefault fontSize="small" color="success" />
            </IconButton>
          </Tooltip>
        )}
      </Grid>

      {openProductQuickAdd && (
        <ProductQuickAdd setOpen={setOpenProductQuickAdd} setAddedProduct={setAddedProduct} />
      )}
    </form>
  );
};

export { getUnitSymbol };
export default BomItemForm;