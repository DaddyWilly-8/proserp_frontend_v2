import { Button, FormControl, Grid, IconButton, LinearProgress, MenuItem, Select, TextField, Tooltip } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form';
import * as yup  from "yup";
import {yupResolver} from '@hookform/resolvers/yup'
import { AddOutlined, CheckOutlined, DisabledByDefault } from '@mui/icons-material';
import { useProjectProfile } from '../../../../ProjectProfileProvider';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';
import productServices from '@/components/productAndServices/products/productServices';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import StoreSelector from '@/components/procurement/stores/StoreSelector';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';


function SubContractMaterialIssuedItemForm({setClearFormKey, submitMainForm, submitItemForm, setSubmitItemForm, setIsDirty, issue_date, item = null, index = -1, setItems, items = [], setShowForm = null}) {
    const { productOptions } = useProductsSelect();
    const nonInventoryIds = productOptions.filter(product => product.type !== 'Inventory').map(product => product.id);
    const { project} = useProjectProfile();
    const [isRetrieving, setIsRetrieving] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState(item && (item.measurement_unit_id ? item.measurement_unit_id : item.measurement_unit?.id));

    const validationSchema = yup.object({
        product: yup.object().required("Material is required").typeError('Material is required'),
        quantity: yup
        .number()
        .when(['product'], {
          is: (product) =>
            !!product && product.type === 'Inventory',
          then: yup
            .number()
            .required("Quantity is required")
            .positive("Quantity must be a positive number")
            .typeError('Quantity is required')
            .when(['current_balance', 'available_balance'], {
              is: (currentBalance, availableBalance) => currentBalance < availableBalance,
              then: yup.number()
                .test('currentBalanceCheck', 'This quantity will lead to negative balance', function (value) {
                  const currentBalance = parseFloat(watch('current_balance'));
                  return value <= currentBalance;
                }
              ),
              otherwise: yup.number().positive("Quantity must be a positive number").typeError('Quantity is required'),
            }
          )        
          .test('quantity Exceeded', 'The quantity exceeds the balance', function (value) {
            const availableBalance = parseFloat(watch('available_balance'));
            return availableBalance === 'N/A' || !value || value <= availableBalance;
          }),
          otherwise: yup.number().positive("Quantity must be a positive number").typeError('Quantity is required'),
        }),
    })

    const {setValue, clearErrors, handleSubmit, watch, reset, formState: {errors, dirtyFields}} = useForm({
        resolver: yupResolver(validationSchema),
        defaultValues: {
            product: item && productOptions.find(product => product.id === (item.product_id || item.product?.id)),
            product_id: item && item.product_id,
            store: item && item.store,
            store_id: item && (item.store_id || item.store?.id),
            quantity: item && item.quantity,
            measurement_unit_id: item && (item.measurement_unit_id ? item.measurement_unit_id : item.measurement_unit?.id),
            conversion_factor: item ? item.conversion_factor : 1,
            unit_symbol: item && (item.measurement_unit?.symbol ? item.measurement_unit?.symbol : item.unit_symbol),
        }
    });

    useEffect(() => {
        setIsDirty(Object.keys(dirtyFields).length > 0); // Update dirty state
    }, [dirtyFields, setIsDirty, watch]);

    const product = watch('product');
    const measurement_unit_id = watch('measurement_unit_id');
    const store_id = watch('store_id');

    const [isAdding, setIsAdding] = useState(false);

    const updateItems = async (item) => {
        setIsAdding(true);
        if (index > -1) {
            // Replace the existing item with the edited item
            let updatedItems = [...items];
            updatedItems[index] = item;
            await setItems(updatedItems);
            setClearFormKey(prevKey => prevKey + 1);
        } else {
            // Add the new item to the items array
            await setItems((items) => [...items, item]);
            if (!!submitItemForm) {
                submitMainForm()
            }
            setSubmitItemForm(false)
            setClearFormKey(prevKey => prevKey + 1);
        }

        reset();
        setIsAdding(false);
        setShowForm && setShowForm(false);
    };

    useEffect(() => {
      if (submitItemForm) {
        handleSubmit(updateItems, () => {
          setSubmitItemForm(false); // Reset submitItemForm if there are errors
        })();
      }
    }, [submitItemForm, handleSubmit]);

    const combinedUnits = product?.secondary_units?.concat(product?.primary_unit) || [];

    const retrieveBalances = async (issue_date, storeId = null, product, measurement_unit_id) => {
        if (!!product && !!storeId && !isRetrieving) { 
          setIsRetrieving(true);

          try {
            const balances = await productServices.getStoreBalances({
              as_at: issue_date,
              productId: product.id,
              storeIds: [storeId],
              costCenterId: project?.cost_center?.id,
              measurement_unit_id: measurement_unit_id
            });

            if (balances) {
                const pickedUnit = combinedUnits?.find(unit => unit.id === measurement_unit_id);

                const existingItems = items?.filter((existingItem, itemIndex) => {
                    return existingItem?.store?.id === storeId 
                    && existingItem.product?.id === product?.id 
                    && itemIndex !== index
                });

                const existingQuantity = existingItems.reduce((total, existingItem) => {
                    const itemUnitFactor = combinedUnits.find(unit => unit.id === existingItem?.measurement_unit_id)?.conversion_factor || 1;
                    const pickedUnitFactor = pickedUnit?.conversion_factor || 1;
                    const primaryUnitId = product?.primary_unit?.id;
        
                    const conversionFactor = pickedUnit?.id === primaryUnitId
                    ? (existingItem?.measurement_unit_id !== primaryUnitId ? 1 / itemUnitFactor : 1) // Primary to secondary or same unit
                    : (existingItem?.measurement_unit_id === primaryUnitId ? pickedUnitFactor : pickedUnitFactor / itemUnitFactor); // Secondary to primary or another secondary

                    return total + (existingItem.quantity * conversionFactor);
                }, 0);

                const balance = balances?.stock_balances?.find(storeBalance => storeBalance.cost_center_id === project?.cost_center?.id)?.balance;
                const currentBalance = balances?.stock_balances?.find(storeBalance => storeBalance.cost_center_id === project?.cost_center?.id)?.current_balance;

                const updatedBalance = parseFloat((balance - existingQuantity).toFixed(6));

                setValue(`available_balance`, !balance ? 0 : updatedBalance);
                setValue(`current_balance`, !balance
                    ? 0
                    : parseFloat(currentBalance) + parseFloat(item ? item.quantity : 0 || existingQuantity) || 0);

            }
          } catch (error) {
            console.error('Error retrieving balances:', error);
          } finally {
            setIsRetrieving(false);
          }
        } else {
          setValue(`available_balance`, 'N/A');
          clearErrors(`rate`);
        }
    };  

    useEffect(() => {
       retrieveBalances(issue_date, store_id, product, measurement_unit_id)
    }, [store_id, product, measurement_unit_id, item, issue_date]);

    if(isAdding){
        return <LinearProgress/>
    }

  return (
    <form autoComplete='off' onSubmit={handleSubmit(updateItems)} >
        <Grid container columnSpacing={1} rowSpacing={1} mt={1}>
            <Grid size={{xs: 12, md: 4}}>
                <ProductSelect
                    label='Material'
                    frontError={errors.product}
                    defaultValue={item?.product}
                    excludeIds={nonInventoryIds}
                    onChange={async(newValue) => {
                        if (!!newValue) {
                            await setSelectedUnit(null)
                            setValue(`product`, newValue, {
                                shouldDirty: true,
                                shouldValidate: true
                            });
                            setSelectedUnit(newValue.primary_unit ? newValue?.primary_unit?.id : newValue?.measurement_unit_id)
                            setValue(`measurement_unit_id`, newValue.primary_unit ? newValue?.primary_unit?.id : newValue?.measurement_unit_id);
                            setValue(`unit_symbol`, newValue.primary_unit ? newValue?.primary_unit?.unit_symbol : newValue?.measurement_unit?.symbol)
                            setValue(`product_id`,newValue?.id);

                            await retrieveBalances(issue_date, store_id, newValue, newValue.primary_unit?.id);
                        } else {
                            await setValue(`available_balance`,'N/A');
                            setValue(`product`, null, {
                                shouldDirty: true,
                                shouldValidate: true
                            });
                            setValue(`measurement_unit_id`, null);
                            setValue(`unit_symbol`, null);
                            setValue(`product_id`,null);
                        }
                    }}
                />
            </Grid>
            <Grid size={{xs: 12, md: !!product && !!store_id ? 3 : 4}}>
                <StoreSelector
                    allowSubStores={true}
                    proposedOptions={project?.stores}
                    defaultValue={item?.store}
                    onChange={(newValue) => {
                    newValue !== null && retrieveBalances(issue_date, newValue.id, product, measurement_unit_id);
                        setValue(`store`, newValue);
                        setValue(`store_id`, newValue && newValue.id, {
                            shouldValidate: true,
                            shouldDirty: true,
                        });
                    }}
                />
            </Grid>
            {!!product && !!store_id &&
                <Grid size={{xs: 12, md: 2}}>
                    {
                        isRetrieving ? <LinearProgress/> :
                            <TextField
                                label="Available Balance"
                                fullWidth
                                size='small'
                                value={watch('available_balance')}
                                InputProps={{
                                    readOnly: true,
                                    endAdornment: <span>{combinedUnits?.find(unit => unit.id === selectedUnit)?.unit_symbol}</span>
                                }}
                            />
                    }
                </Grid>
            }
            <Grid size={{xs: 12, md: !!product && !!store_id ? 3 : 4}}>
                <TextField
                    label="Quantity"
                    fullWidth
                    size='small'
                    defaultValue={item?.quantity}
                    InputProps={{ 
                        endAdornment: (
                            !!product && !!selectedUnit &&
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <FormControl fullWidth>
                                    <Select
                                        value={!!selectedUnit && selectedUnit}
                                        onChange={async(e) => {
                                            setSelectedUnit(e.target.value)
                                            const selectedUnitId = e.target.value;
                                            const selectedUnit = combinedUnits?.find(unit => unit.id === selectedUnitId);
                                            if (selectedUnit) {
                                                await setValue(`conversion_factor`, selectedUnit.conversion_factor);
                                                await setValue(`measurement_unit_id`, selectedUnit.id);
                                                setValue(`unit_symbol`, selectedUnit?.unit_symbol);
                                                retrieveBalances(issue_date, store_id, product, selectedUnit.id);
                                            }
                                        }}
                                        variant="standard"
                                        size="small"
                                        MenuProps={{
                                            PaperProps: {
                                                style: {
                                                    borderRadius: 0, 
                                                },
                                            },
                                        }}
                                    >
                                        {product?.primary_unit ? (
                                            combinedUnits?.map((unit) => (
                                                <MenuItem key={unit.id} value={unit.id}>
                                                    {unit.unit_symbol}
                                                </MenuItem>
                                            ))
                                        ) : (
                                            <MenuItem key={product.measurement_unit?.id} value={product.measurement_unit?.id}>
                                                {product.measurement_unit?.symbol}
                                            </MenuItem>
                                        )}
                                    </Select>
                                </FormControl>
                            </div>
                        ),
                    }}
                    error={!!errors?.quantity}
                    helperText={errors?.quantity?.message}
                    onChange={(e)=> {
                        setValue(`quantity`,e.target.value ? sanitizedNumber(e.target.value ) : 0,{
                          shouldValidate: true,
                          shouldDirty: true
                        });
                    }}
                />
            </Grid>
            <Grid size={{xs: 12, md: 12}} textAlign={'end'}>
                <Button
                    variant='contained'
                    size='small'
                    type='submit'                        
                >
                    {
                        item ? (
                            <><CheckOutlined fontSize='small' /> Done</>
                        ) : (
                            <><AddOutlined fontSize='small' /> Add</>
                        )
                    }
                </Button>
                {
                    item && 
                    <Tooltip title='Close Edit'>
                        <IconButton size='small' 
                            onClick={() => {
                                setShowForm(false);
                            }}
                        >
                            <DisabledByDefault fontSize='small' color='success'/>
                        </IconButton>
                    </Tooltip>
                }
            </Grid>
        </Grid>
    </form>
  )
}

export default SubContractMaterialIssuedItemForm