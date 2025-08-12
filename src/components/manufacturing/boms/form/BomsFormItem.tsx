import {
  Grid,
  TextField,
  Button,
  Divider,
  Typography,
  LinearProgress,
  Box,
  Tooltip,
  IconButton,
  FormControl,
  Select,
  MenuItem
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { AddOutlined, CheckOutlined, DisabledByDefault } from '@mui/icons-material';
import { Product } from '@/components/productAndServices/products/ProductType';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { MeasurementUnit } from '@/components/masters/measurementUnits/MeasurementUnitType';
import ProductQuickAdd from '@/components/productAndServices/products/ProductQuickAdd';
import { useForm, SubmitHandler } from 'react-hook-form';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';

interface FormValues {
  product?: Product | null;
  product_id?: number;
  quantity: number;
  measurement_unit_id?: number | null;
  unit_symbol?: string | null;
  conversion_factor?: number | null;
}

interface BomsFormItemProps {
  setClearFormKey: React.Dispatch<React.SetStateAction<number>>;
  submitMainForm: () => void;
  submitItemForm: boolean;
  setSubmitItemForm: React.Dispatch<React.SetStateAction<boolean>>;
  item?: {
    product_id?: number;
    product?: Product;
    quantity: number;
    measurement_unit_id?: number;
    measurement_unit?: MeasurementUnit;
    unit_symbol?: string;
  };
  index?: number;
  setItems: React.Dispatch<React.SetStateAction<any[]>>;
  items?: any[];
  setShowForm?: React.Dispatch<React.SetStateAction<boolean>>;
}

const validationSchema = yup.object({
  product: yup.object().required("Product is required"),
  quantity: yup.number().required("Quantity is required").positive("Quantity must be positive"),
  measurement_unit_id: yup.number().required("Unit is required")
});

const BomsFormItem: React.FC<BomsFormItemProps> = ({
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
  const { checkOrganizationPermission } = useJumboAuth();
  const [addedProduct, setAddedProduct] = useState<Product | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<number | null>(item?.measurement_unit_id ?? item?.measurement_unit?.id ?? null);
  const [isAdding, setIsAdding] = useState(false);

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: yupResolver(validationSchema)as any,
    defaultValues: {
      product: item?.product ?? null,
      quantity: item?.quantity ?? 0,
      measurement_unit_id: item?.measurement_unit_id ?? item?.measurement_unit?.id ?? null,
      unit_symbol: item?.unit_symbol ?? item?.measurement_unit?.unit_symbol ?? null,
      conversion_factor: item?.product?.primary_unit?.conversion_factor ?? 1,
    }
  });

  const product = watch('product') as Product | undefined;
  const quantity = watch('quantity');

  const combinedUnits: MeasurementUnit[] = [
    ...(product?.secondary_units || []),
    ...(product?.primary_unit ? [product.primary_unit] : []),
  ];

  const updateItems: SubmitHandler<FormValues> = async (data) => {
    setIsAdding(true);

    const newItem = {
      ...data,
      product_id: data.product?.id,
      measurement_unit_id: selectedUnit,
      unit_symbol: data.unit_symbol,
      conversion_factor: data.conversion_factor ?? 1
    };

    if (index > -1) {
      const updatedItems = [...items];
      updatedItems[index] = newItem;
      await setItems(updatedItems);
    } else {
      await setItems(prev => [...prev, newItem]);
    }

    setClearFormKey(k => k + 1);
    setSubmitItemForm(false);
    setIsAdding(false);
    reset();
    setShowForm?.(false);

    if (!index && submitItemForm) {
      submitMainForm();
    }
  };

  useEffect(() => {
    if (submitItemForm) {
      handleSubmit(updateItems, () => setSubmitItemForm(false))();
    }
  }, [submitItemForm]);

  useEffect(() => {
    if (addedProduct) {
      const unitId = addedProduct.primary_unit?.id ?? addedProduct.measurement_unit_id;
      const unitSymbol = addedProduct.primary_unit?.unit_symbol ?? addedProduct.measurement_unit?.unit_symbol ?? '';

      setValue('product', addedProduct);
      setValue('product_id', addedProduct.id);
      setValue('measurement_unit_id', unitId);
      setValue('unit_symbol', unitSymbol);
      setValue('conversion_factor', addedProduct.primary_unit?.conversion_factor ?? 1);
      setSelectedUnit(unitId);
      setOpenProductQuickAdd(false);
    }
  }, [addedProduct]);

  if (isAdding) return <LinearProgress />;

  return (
    <form onSubmit={handleSubmit(updateItems)} autoComplete="off">
      <Grid container spacing={2} alignItems="flex-end" mb={2}>
        {/* Product Selector */}
        <Grid size={{xs: 12, md: 8}}>
          <ProductSelect
            label="Input Product"
            frontError={errors.product}
            defaultValue={item?.product}
            addedProduct={addedProduct}
            onChange={(newValue: Product | null) => {
              if (newValue) {
                const unitId = newValue.primary_unit?.id ?? newValue.measurement_unit_id;
                const unitSymbol = newValue.primary_unit?.unit_symbol ?? 
                                  newValue.measurement_unit?.unit_symbol ?? '';

                setValue('product', newValue, { shouldValidate: true, shouldDirty: true });
                setValue('product_id', newValue.id);
                setValue('measurement_unit_id', unitId);
                setValue('unit_symbol', unitSymbol);
                setValue('conversion_factor', newValue.primary_unit?.conversion_factor ?? 1);
                setSelectedUnit(unitId);
              } else {
                setValue('product', null);
                setSelectedUnit(null);
              }
            }}
            startAdornment={
              checkOrganizationPermission(['products_create']) && (
                <Tooltip title="Add New Product">
                  <IconButton 
                    onClick={() => setOpenProductQuickAdd(true)} 
                    size="small"
                    sx={{ p: 0.5 }}
                  >
                    <AddOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
              )
            }
            sx={{ 
              '& .MuiInputBase-root': { 
                paddingRight: '8px' 
              } 
            }}
          />
        </Grid>

        {/* Quantity + Units */}
        <Grid size={{xs: 12, md: 4}}>
          <TextField
            label="Quantity"
            fullWidth
            size="small"
            value={quantity}
            {...register('quantity', { 
              valueAsNumber: true,
              required: 'Quantity is required',
              min: {
                value: 0.01,
                message: 'Quantity must be greater than zero'
              }
            })}
            InputProps={{
              inputComponent: CommaSeparatedField,
              endAdornment: product && selectedUnit ? (
                <FormControl 
                  variant="standard" 
                  sx={{ 
                    minWidth: 80,
                    ml: 1 
                  }}
                >
                  <Select
                    value={selectedUnit ?? ''}
                    onChange={(e) => {
                      const selectedUnitId = e.target.value as number;
                      setSelectedUnit(selectedUnitId);
                      const selectedUnit = combinedUnits.find((unit) => unit.id === selectedUnitId);
                      if (selectedUnit) {
                        setValue('conversion_factor', selectedUnit.conversion_factor ?? 1);
                        setValue('measurement_unit_id', selectedUnit.id);
                        setValue('unit_symbol', selectedUnit.unit_symbol);
                      }
                    }}
                    size="small"
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          maxHeight: 300,
                          borderRadius: 1
                        }
                      }
                    }}
                  >
                    {combinedUnits.map((unit) => (
                      <MenuItem key={unit.id} value={unit.id}>
                        {unit.unit_symbol}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : null
            }}
            error={!!errors.quantity}
            helperText={errors.quantity?.message}
            inputProps={{
              step: "any",
              min: 0.01
            }}
            sx={{
              '& .MuiInputBase-root': {
                paddingRight: product && selectedUnit ? 0 : '14px'
              }
            }}
          />
        </Grid>
      </Grid>

      {/* Actions */}
      <Grid size={12} textAlign="right">
        <Button
          variant="contained"
          size="small"
          type="submit"
          onClick={() => setAddedProduct(null)}
        >
          {item ? <><CheckOutlined fontSize="small" /> Done</> : <><AddOutlined fontSize="small" /> Add</>}
        </Button>
        {item && (
          <Tooltip title="Close Edit">
            <IconButton size="small" onClick={() => setShowForm?.(false)}>
              <DisabledByDefault fontSize="small" color="success" />
            </IconButton>
          </Tooltip>
        )}
      </Grid>

      {/* Quick Add Dialog */}
      {openProductQuickAdd && (
        <ProductQuickAdd setOpen={setOpenProductQuickAdd} setAddedProduct={setAddedProduct} />
      )}
    </form>
  );
};

export default BomsFormItem;