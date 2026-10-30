import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { MeasurementUnit } from '@/components/masters/measurementUnits/MeasurementUnitType';
import ProductQuickAdd from '@/components/productAndServices/products/ProductQuickAdd';
import productServices from '@/components/productAndServices/products/productServices';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';
import { Product } from '@/components/productAndServices/products/ProductType';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  AddOutlined,
  CheckOutlined,
  DisabledByDefault,
} from '@mui/icons-material';
import {
  Button,
  Divider,
  FormControl,
  Grid,
  IconButton,
  LinearProgress,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import * as yup from 'yup';
import ProductSelect from '../../../productAndServices/products/ProductSelect';
import { useSalesOutlet } from '../../outlet/OutletProvider';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface FormValues {
  product?: Product | null;
  product_id?: number;
  quantity: number;
  rate: number;
  measurement_unit_id?: number | null;
  unit_symbol?: string | null;
  description?: string;
  currency_id?: number;
}

interface ProformaItemFormProps {
  selectedCurrencyId?: number;
  setClearFormKey: React.Dispatch<React.SetStateAction<number>>;
  submitMainForm: () => void;
  submitItemForm: boolean;
  setSubmitItemForm: React.Dispatch<React.SetStateAction<boolean>>;
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
  item?: {
    product_id?: number;
    product?: Product;
    quantity: number;
    rate: number;
    measurement_unit_id?: number;
    measurement_unit?: MeasurementUnit;
    unit_symbol?: string;
    store_id?: number;
    amount?: number;
    vat_amount?: number;
    description?: string;
  } | null;
  index?: number;
  setItems: React.Dispatch<React.SetStateAction<any[]>>;
  items?: any[];
  setShowForm?: React.Dispatch<React.SetStateAction<boolean>>;
  vat_percentage: number;
}

const getValidationSchema = (dictionary: any) =>
  yup.object({
    product: yup
      .object()
      .required(dictionary.forms.proformaInvoices.validation.productRequired)
      .typeError(dictionary.forms.proformaInvoices.validation.productRequired)
      .nullable(),
    quantity: yup
      .number()
      .positive(dictionary.forms.proformaInvoices.validation.quantityRequired)
      .required(dictionary.forms.proformaInvoices.validation.quantityRequired)
      .typeError(dictionary.forms.proformaInvoices.validation.quantityRequired),
    rate: yup
      .number()
      .required(dictionary.forms.proformaInvoices.validation.priceRequired)
      .positive(dictionary.forms.proformaInvoices.validation.priceRequired)
      .typeError(dictionary.forms.proformaInvoices.validation.priceRequired),
  });

const ProformaItemForm: React.FC<ProformaItemFormProps> = ({
  setClearFormKey,
  submitMainForm,
  submitItemForm,
  setSubmitItemForm,
  setIsDirty,
  item = null,
  index = -1,
  setItems,
  items = [],
  setShowForm = null,
  vat_percentage,
  selectedCurrencyId,
}) => {
  const dictionary = useDictionary();
  const validationSchema = React.useMemo(
    () => getValidationSchema(dictionary),
    [dictionary]
  );
  const { activeOutlet } = useSalesOutlet();
  const vat_factor = vat_percentage * 0.01;
  const [openProductQuickAdd, setOpenProductQuickAdd] = useState(false);
  const { productOptions } = useProductsSelect();
  const [addedProduct, setAddedProduct] = useState<Product | null>(null);
  const { checkOrganizationPermission } = useJumboAuth();
  const [calculatedAmount, setCalculatedAmount] = useState(0);
  const [selectedUnit, setSelectedUnit] = useState<number | null>(
    item
      ? (item.measurement_unit_id ?? item.measurement_unit?.id ?? null)
      : null
  );
  const [priceInclusiveVAT, setPriceInclusiveVAT] = useState(0);
  const [isVatfieldChange, setIsVatfieldChange] = useState(false);
  const [priceFieldKey, setPriceFieldKey] = useState(0);
  const [vatPriceFieldKey, setVatPriceFieldKey] = useState(0);

  const {
    setValue,
    handleSubmit,
    watch,
    control,
    reset,
    register,
    formState: { errors, dirtyFields },
  } = useForm<FormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      product:
        item &&
        productOptions.find(
          (product: Product) =>
            product.id === (item.product_id ?? item.product?.id)
        ),
      quantity: item?.quantity,
      rate: item?.rate,
      measurement_unit_id: item
        ? (item.measurement_unit_id ?? item.measurement_unit?.id ?? null)
        : null,
      unit_symbol: item
        ? (item.measurement_unit?.unit_symbol ?? item.unit_symbol ?? null)
        : null,
      description: item?.description,
    },
  });

  useEffect(() => {
    setIsDirty(Object.keys(dirtyFields).length > 0);
  }, [dirtyFields, setIsDirty]);

  const { isFetching } = useQuery({
    queryKey: [
      'sellingPrice',
      {
        id: watch('product')?.id,
        sales_outlet_id: activeOutlet?.id,
        currency_id: selectedCurrencyId,
      },
    ],
    queryFn: async () => {
      const product_id = watch('product')?.id;
      if (product_id && activeOutlet?.id) {
        const response = await productServices.getSellingPrices({
          productId: product_id,
          sales_outlet_id: activeOutlet.id,
          currency_id: selectedCurrencyId,
        });
        setValue('rate', response.price, {
          shouldDirty: true,
          shouldValidate: true,
        });
        setValue('currency_id' as keyof FormValues, response.currency_id);
        return response;
      }
      return null;
    },
    enabled: !!watch('product')?.id && !!activeOutlet?.id && !item,
  });

  const calculateAmount = (): number => {
    const quantity = parseFloat(watch('quantity')?.toString() ?? '0');
    const rate = parseFloat(watch('rate')?.toString() ?? '0');
    return quantity * rate * (1 + (product?.vat_exempted ? 0 : vat_factor));
  };

  useEffect(() => {
    const amount = calculateAmount();
    setCalculatedAmount(amount);
  }, [watch('quantity'), watch('rate'), vat_factor]);

  const [isAdding, setIsAdding] = useState(false);

  const updateItems: SubmitHandler<FormValues> = async (data) => {
    setIsAdding(true);
    const product = watch('product');
    const newItem = {
      ...data,
      product_id: product?.id,
      measurement_unit_id: selectedUnit,
      unit_symbol: watch('unit_symbol'),
      amount: calculateAmount(),
      vat_amount: product?.vat_exempted ? 0 : calculateAmount() * vat_factor,
      description: watch('description'),
    };

    if (index > -1) {
      const updatedItems = [...items];
      updatedItems[index] = newItem;
      await setItems(updatedItems);
      setClearFormKey((prevKey) => prevKey + 1);
    } else {
      await setItems((prevItems) => [...prevItems, newItem]);
      if (submitItemForm) {
        submitMainForm();
      }
      setSubmitItemForm(false);
      setClearFormKey((prevKey) => prevKey + 1);
    }

    reset();
    setIsAdding(false);
    setShowForm && setShowForm(false);
  };

  useEffect(() => {
    if (submitItemForm) {
      handleSubmit(updateItems, () => {
        setSubmitItemForm(false);
      })();
    }
  }, [submitItemForm, handleSubmit]);

  const product = watch('product') as Product | undefined;
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const combinedUnits: MeasurementUnit[] = [
    ...(currentProduct?.secondary_units?.map((unit) => ({
      id: unit.id,
      name: unit.name ?? unit.unit_symbol,
      unit_symbol: unit.unit_symbol,
      conversion_factor: unit.conversion_factor,
    })) ?? []),
    ...(currentProduct?.primary_unit
      ? [
          {
            id: currentProduct.primary_unit.id,
            name:
              currentProduct.primary_unit.name ??
              currentProduct.primary_unit.unit_symbol,
            unit_symbol: currentProduct.primary_unit.unit_symbol,
            conversion_factor: undefined,
          },
        ]
      : []),
  ];

  useEffect(() => {
    if (addedProduct?.id) {
      setCurrentProduct(addedProduct);
      setValue('product', addedProduct);
      setSelectedUnit(addedProduct.measurement_unit_id);
      setValue('measurement_unit_id', addedProduct.measurement_unit_id);
      setValue('unit_symbol', addedProduct.measurement_unit?.symbol ?? '');
      setOpenProductQuickAdd(false);
    }
  }, [addedProduct, setValue]);

  if (isAdding) {
    return <LinearProgress />;
  }

  return (
    <form autoComplete='off' onSubmit={handleSubmit(updateItems)}>
      <Divider />
      <Grid container columnSpacing={1} rowSpacing={1} mb={1} mt={1}>
        {!openProductQuickAdd && !item && (
          <Grid size={{ xs: 12 }} textAlign={'center'}>
            <Typography variant='h5'>{dictionary.forms.proformaInvoices.labels.addItem}</Typography>
          </Grid>
        )}
        {openProductQuickAdd && !item && (
          <Grid size={{ xs: 12 }} textAlign={'center'}>
            <Typography variant='h5'>
              {dictionary.forms.proformaInvoices.labels.quickProductRegistration}
            </Typography>
          </Grid>
        )}

        {!openProductQuickAdd && (
          <>
            <Grid size={{ xs: 12, md: vat_factor ? 3.5 : 5 }}>
              <ProductSelect
                label={dictionary.forms.proformaInvoices.labels.productService}
                frontError={errors.product}
                defaultValue={item?.product}
                addedProduct={addedProduct}
                onChange={(newValue: Product | null) => {
                  if (newValue) {
                    setCurrentProduct(newValue);
                    setIsVatfieldChange(false);
                    setValue('product', newValue, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    setAddedProduct(null);
                    setSelectedUnit(
                      newValue.primary_unit
                        ? newValue.primary_unit.id
                        : newValue.measurement_unit_id
                    );
                    setValue(
                      'measurement_unit_id',
                      newValue.primary_unit
                        ? newValue.primary_unit.id
                        : newValue.measurement_unit_id
                    );
                    setValue(
                      'unit_symbol',
                      newValue.primary_unit
                        ? newValue.primary_unit.unit_symbol
                        : (newValue.measurement_unit?.symbol ?? '')
                    );
                    setValue('product_id', newValue.id);
                  } else {
                    setCurrentProduct(null);
                    setValue('product', null, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    setSelectedUnit(null);
                    setValue('measurement_unit_id', null);
                    setValue('unit_symbol', '');
                    setValue('product_id', undefined);
                    setValue('rate', 0, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }
                }}
                startAdornment={
                  checkOrganizationPermission([
                    PERMISSIONS.PRODUCTS_CREATE,
                  ]) && (
                    <Tooltip title={dictionary.tooltips.quickAddNewProduct}>
                      <AddOutlined
                        onClick={() => setOpenProductQuickAdd(true)}
                        sx={{ cursor: 'pointer' }}
                      />
                    </Tooltip>
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: vat_factor ? 2.5 : 3 }}>
              <TextField
                label={dictionary.forms.proformaInvoices.labels.quantity}
                fullWidth
                size='small'
                defaultValue={item?.quantity ?? ''}
                onChange={(e) => {
                  setValue(
                    'quantity',
                    e.target.value ? sanitizedNumber(e.target.value) : 0,
                    { shouldDirty: true, shouldValidate: true }
                  );
                }}
                InputProps={{
                  inputComponent: CommaSeparatedField,
                  endAdornment: product && selectedUnit && (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <FormControl fullWidth>
                        <Select
                          value={selectedUnit ?? ''}
                          onChange={(e) => {
                            const selectedUnitId = e.target.value as number;
                            setSelectedUnit(selectedUnitId);
                            const selectedUnit = combinedUnits.find(
                              (unit) => unit.id === selectedUnitId
                            );
                            if (selectedUnit) {
                              setValue('measurement_unit_id', selectedUnit.id);
                              setValue('unit_symbol', selectedUnit.unit_symbol);
                            }
                          }}
                          variant='standard'
                          size='small'
                          MenuProps={{
                            PaperProps: {
                              style: {
                                borderRadius: 0,
                              },
                            },
                          }}
                        >
                          {combinedUnits.map((unit: MeasurementUnit) => (
                            <MenuItem key={unit.id} value={unit.id}>
                              {unit.unit_symbol}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </div>
                  ),
                }}
                error={!!errors.quantity}
                helperText={errors.quantity?.message}
                // {...register('quantity')}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              {isFetching ? (
                <LinearProgress />
              ) : (
                <TextField
                  label={dictionary.forms.proformaInvoices.labels.price}
                  fullWidth
                  key={priceFieldKey}
                  size='small'
                  error={!!errors.rate}
                  helperText={errors.rate?.message}
                  InputProps={{
                    inputComponent: CommaSeparatedField,
                  }}
                  defaultValue={
                    watch('rate')
                      ? Math.round((watch('rate') ?? 0) * 100000) / 100000
                      : ''
                  }
                  onChange={(e) => {
                    setIsVatfieldChange(false);
                    setPriceInclusiveVAT(0);
                    setValue(
                      'rate',
                      e.target.value ? sanitizedNumber(e.target.value) : 0,
                      {
                        shouldValidate: true,
                        shouldDirty: true,
                      }
                    );
                    setVatPriceFieldKey((key) => key + 1);
                  }}
                />
              )}
            </Grid>

            {vat_factor > 0 && (
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField
                  label={dictionary.forms.proformaInvoices.labels.priceVatInclusive}
                  fullWidth
                  key={vatPriceFieldKey}
                  size='small'
                  error={!!errors.rate}
                  helperText={errors.rate?.message}
                  InputProps={{
                    inputComponent: CommaSeparatedField,
                  }}
                  value={
                    isVatfieldChange
                      ? priceInclusiveVAT
                        ? Math.round(priceInclusiveVAT * 100000) / 100000
                        : ''
                      : watch('rate')
                        ? Math.round(
                            (watch('rate') ?? 0) *
                              (1 + (product?.vat_exempted ? 0 : vat_factor)) *
                              100000
                          ) / 100000
                        : ''
                  }
                  onChange={(e) => {
                    setIsVatfieldChange(true);
                    setPriceInclusiveVAT(
                      e.target.value ? sanitizedNumber(e.target.value) : 0
                    );
                    setValue(
                      'rate',
                      e.target.value
                        ? sanitizedNumber(e.target.value) /
                            (1 + (product?.vat_exempted ? 0 : vat_factor))
                        : 0,
                      {
                        shouldValidate: true,
                        shouldDirty: true,
                      }
                    );
                    setPriceFieldKey((key) => key + 1);
                  }}
                />
              </Grid>
            )}

            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                label={dictionary.forms.proformaInvoices.labels.amount}
                fullWidth
                size='small'
                value={calculatedAmount}
                InputProps={{
                  inputComponent: CommaSeparatedField,
                  readOnly: true,
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: vat_factor ? 10 : 11 }}>
              <TextField
                label={dictionary.forms.proformaInvoices.labels.description}
                fullWidth
                size='small'
                rows={2}
                multiline
                defaultValue={item?.description ?? ''}
                {...register('description')}
              />
            </Grid>

            <Grid size={{ xs: 12, md: vat_factor ? 2 : 1 }} textAlign={'end'}>
              <Button
                variant='contained'
                size='small'
                type='submit'
                onClick={() => {
                  setAddedProduct(null);
                }}
              >
                {item ? (
                  <>
                    <CheckOutlined fontSize='small' /> {dictionary.forms.proformaInvoices.buttons.done}
                  </>
                ) : (
                  <>
                    <AddOutlined fontSize='small' /> {dictionary.forms.proformaInvoices.buttons.add}
                  </>
                )}
              </Button>
              {item && (
                <Tooltip title={dictionary.tooltips.closeEdit}>
                  <IconButton
                    size='small'
                    onClick={() => {
                      setShowForm && setShowForm(false);
                    }}
                  >
                    <DisabledByDefault fontSize='small' color='success' />
                  </IconButton>
                </Tooltip>
              )}
            </Grid>
          </>
        )}

        {openProductQuickAdd && (
          <ProductQuickAdd
            setOpen={setOpenProductQuickAdd}
            setAddedProduct={setAddedProduct}
          />
        )}
      </Grid>
    </form>
  );
};

export default ProformaItemForm;
