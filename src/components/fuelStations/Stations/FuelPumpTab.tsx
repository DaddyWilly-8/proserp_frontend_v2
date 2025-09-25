'use client';

import React, { useState } from 'react';
import { Grid, TextField, Button, IconButton, Typography, Tooltip } from '@mui/material';
import { Add, Delete, AddOutlined } from '@mui/icons-material';
import { useFieldArray, Controller, useFormContext } from 'react-hook-form';
import * as yup from 'yup';
import StoreSelector from '@/components/procurement/stores/StoreSelector';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { Station, FuelPump } from './StationType';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';

interface FuelPumpTabProps {
  station?: Station;
}

// Validation schema for fuel pumps
export const fuelPumpSchema = yup.object({
  fuel_pumps: yup
    .array()
    .of(
      yup.object({
        product_id: yup.number().nullable().required('Fuel name is required'),
        name: yup.string().required('Pump name is required'),
        tank_id: yup.number().nullable().required('Tank name is required'),
      })
    )
    .min(1, 'At least one fuel pump is required'),
});

const FuelPumpTab: React.FC<FuelPumpTabProps> = ({ station }) => {
  const { control, formState: { errors }, setValue } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'fuel_pumps',
  });
  const { checkOrganizationPermission } = useJumboAuth();
  const canCreateProduct = checkOrganizationPermission([PERMISSIONS.PRODUCTS_CREATE]);
  const [openProductQuickAdd, setOpenProductQuickAdd] = useState<boolean[]>([]);
  const [nonInventoryIds, setNonInventoryIds] = useState<number[]>([]); // Adjust as needed
  const [addedProduct, setAddedProduct] = useState<any>(null); // Adjust type as needed
  const { productOptions } = useProductsSelect();

  // Initialize openProductQuickAdd state for each field
  React.useEffect(() => {
    setOpenProductQuickAdd(fields.map(() => false));
  }, [fields.length]);

  return (
    <Grid container spacing={2}>
      <Grid size={12}>
        <Typography variant="h6">Fuel Pumps</Typography>
      </Grid>
      {fields.map((field, index) => (
        <Grid container spacing={1} key={field.id} sx={{ mb: 2 }} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
            <Controller
              name={`fuel_pumps.${index}.product_id`}
              control={control}
              render={({ field }) => (
                <ProductSelect
                  label="Fuel Name"
                  frontError={errors.fuel_pumps?.[index]?.product_id}
                  addedProduct={addedProduct}
                  defaultValue={station?.fuel_pumps?.[index]?.fuelName}
                  excludeIds={nonInventoryIds}
                  onChange={(newValue) => {
                    if (newValue) {
                      field.onChange(newValue.id);
                      setValue(`fuel_pumps.${index}.fuelName`, newValue, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    } else {
                      field.onChange(null);
                      setValue(`fuel_pumps.${index}.fuelName`, null, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }
                  }}
                  startAdornment={
                    canCreateProduct && (
                      <Tooltip title="Add New Fuel Product">
                        <AddOutlined
                          onClick={() => {
                            const newOpen = [...openProductQuickAdd];
                            newOpen[index] = true;
                            setOpenProductQuickAdd(newOpen);
                          }}
                          sx={{ cursor: 'pointer' }}
                        />
                      </Tooltip>
                    )
                  }
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Controller
              name={`fuel_pumps.${index}.name`}
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Pump Name"
                  size="small"
                  error={!!errors.fuel_pumps?.[index]?.name}
                  helperText={errors.fuel_pumps?.[index]?.name?.message}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Controller
              name={`fuel_pumps.${index}.tank_id`}
              control={control}
              render={({ field }) => (
                <StoreSelector
                  label="Tank Name"
                  frontError={errors.fuel_pumps?.[index]?.tank_id}
                  defaultValue={station?.fuel_pumps?.[index]?.tankName}
                  onChange={(newValue) => {
                    if (newValue) {
                      field.onChange(newValue.id);
                      setValue(`fuel_pumps.${index}.tankName`, newValue, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    } else {
                      field.onChange(null);
                      setValue(`fuel_pumps.${index}.tankName`, null, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }
                  }}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 1 }} sx={{ display: 'flex', alignItems: 'center' }}>
            {fields.length > 1 && (
              <IconButton onClick={() => remove(index)} color="error">
                <Delete />
              </IconButton>
            )}
          </Grid>
        </Grid>
      ))}
      <Grid size={12} textAlign="end">
        <Button
          variant="outlined"
          size="small"
          startIcon={<Add />}
          onClick={() => append({ product_id: null, name: '', tank_id: null })}
        >
          Add Fuel Pump
        </Button>
      </Grid>
    </Grid>
  );
};

export default FuelPumpTab;