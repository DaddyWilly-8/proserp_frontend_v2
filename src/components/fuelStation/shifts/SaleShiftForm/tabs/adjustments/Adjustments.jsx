import { Grid, IconButton, LinearProgress, TextField, Tooltip} from '@mui/material';
import { useContext, useEffect, useState } from 'react'
import * as yup  from "yup";
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { AddOutlined, CheckOutlined, DisabledByDefault } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';
import StoreSelector from '@/components/procurement/stores/StoreSelector';
import OperationSelector from '@/components/sharedComponents/OperationSelector';
import { Div } from '@jumbo/shared';
import { StationFormContext } from '../../../SalesShifts';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

function Adjustments({cashierPumpProducts, index = -1, setShowForm = null, adjustment, adjustments = [], setAdjustments}) {
  const dictionary = useDictionary();
  const [isAdding, setIsAdding] = useState(false);
  const {activeStation} = useContext(StationFormContext);
  const { tanks } = activeStation;
  const { productOptions } = useProductsSelect();
  const [productTanks, setProductTanks] = useState([])
  const [tanksKey, setTanksKeyKey] = useState(0);
  const [formKey, setFormKey] = useState(0);

  const validationSchema = yup.object({
    product_id: yup.number().required(dictionary.forms.shifts.validation.productRequired).typeError(dictionary.forms.shifts.validation.productRequired),
    tank_id: yup.number().required(dictionary.forms.shifts.validation.tankRequired).typeError(dictionary.forms.shifts.validation.tankRequired),
    operator: yup.string().required(dictionary.forms.shifts.validation.operatorRequired).typeError(dictionary.forms.shifts.validation.operatorRequired),
    description: yup.string().required(dictionary.forms.shifts.validation.descriptionRequired).typeError(dictionary.forms.shifts.validation.descriptionRequired),
    quantity: yup.number().required(dictionary.forms.shifts.validation.quantityRequired).positive(dictionary.forms.shifts.validation.quantityRequired).typeError(dictionary.forms.shifts.validation.quantityRequired),
  });

  const {setValue, handleSubmit, watch, reset, formState: {errors}} = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      product: adjustment && productOptions.find(product => product.id === adjustment.product_id),
      product_id: adjustment && adjustment.product_id, 
      quantity: adjustment && adjustment.quantity, 
      tank_id: adjustment && tanks.find(tank => tank.id === adjustment?.tank_id)?.id,
      description: adjustment && adjustment.description,
      operator: adjustment && adjustment.operator,
      operator_name: adjustment && adjustment.operator_name
    }
  });
  
  const updateItems = async (item) => {
    setIsAdding(true);
      if (index > -1) {
        // Replace the existing item with the edited item
        let updatedAdjustments = [...adjustments];
        updatedAdjustments[index] = item;
        await setAdjustments(updatedAdjustments);
      } else {
        // Add the new item to the Adjustments array
        await setAdjustments((adjustments) => [...adjustments, item]);
      }

      reset();
      setIsAdding(false);
      setShowForm && setShowForm(false);
  };

  useEffect(() => {
    setFormKey(prevKey => prevKey + 1);
    setTanksKeyKey(prevKey => prevKey + 1);
  }, [cashierPumpProducts]);

  if(isAdding){
    return <LinearProgress/>
  }

  return (
    <form key={formKey} autoComplete='off' onSubmit={handleSubmit(updateItems)}>
      <Grid container spacing={1} marginTop={0.5}>
         <Grid size={{xs: 12, md: 6, lg: 2.6}}>
          <Div sx={{ mt: 1}}>
            <ProductSelect
              label={dictionary.forms.shifts.labels.fuel}
              frontError={errors.product_id}
              defaultValue={adjustment && productOptions.find(product => product.id === adjustment.product_id)}
              requiredProducts={cashierPumpProducts}
              onChange={(newValue) => {
                setTanksKeyKey(prevKey => prevKey + 1);
                // Allow all tanks for this product assigned to this cashier
                const productObj = cashierPumpProducts.find(p => p.id === newValue?.id);
                const allowedTankIds = productObj?.tankIds || [];
                const tanksHavingProduct = tanks.filter(tank => allowedTankIds.includes(tank.id));
                setProductTanks(tanksHavingProduct);
                setValue(`product_id`, newValue ? newValue.id : '', {
                  shouldValidate: true, 
                  shouldDirty: true,
                });
              }}
            />
          </Div>
        </Grid>
       <Grid size={{xs: 12, md: 6, lg: 2.4}}>
          <Div sx={{ mt: 1 }}>
              <StoreSelector
                  key={tanksKey}
                  allowSubStores={true}
                  label={dictionary.forms.shifts.labels.tank}
                  defaultValue={adjustment && tanks.find(tank => tank.id === adjustment?.tank_id)}
                  proposedOptions={productTanks}
                  frontError={errors?.tank_id}
                  onChange={(newValue) => {
                      setValue(`tank_id`, newValue ? newValue.id : '', {
                          shouldValidate: true,
                          shouldDirty: true,
                      });
                  }}
              />
          </Div>
        </Grid>
        <Grid size={{xs: 12, md: 3, lg: 1.5}}>
          <Div sx={{ mt: 1 }}>
            <OperationSelector
              label={dictionary.forms.shifts.labels.operator}
              frontError={errors?.operator}
              defaultValue={adjustment && adjustment.operator}
              onChange={(newValue) => {
                setValue(`operator_name`, newValue.label);
                setValue(`operator`, newValue ? newValue.value : '', {
                    shouldValidate: true,
                    shouldDirty: true,
                });
              }}
            />
          </Div>
        </Grid>
        <Grid size={{xs: 12, md: 3, lg: 2}}>
          <Div sx={{ mt: 1}}>
            <TextField
              size="small"
              fullWidth
              defaultValue={adjustment && adjustment.quantity}
              error={errors && !!errors?.quantity}
              helperText={errors && errors.quantity?.message}
              label={dictionary.forms.shifts.labels.quantity}
              InputProps={{
                inputComponent: CommaSeparatedField
              }}
              onChange={(e) => {
                setValue(`quantity`,e.target.value ? sanitizedNumber(e.target.value) : 0,{
                  shouldValidate: true,
                  shouldDirty: true
                });
              }}
            />
          </Div>
        </Grid>
        <Grid size={{xs: 12, md: 6, lg: 3.5}}>
          <Div sx={{ mt: 1}}>
            <TextField
              size="small"
              fullWidth
              multiline={true}
              rows={2}
              defaultValue={watch(`description`)}
              error={errors && !!errors?.description}
              helperText={errors && errors.description?.message}
              label={dictionary.forms.shifts.labels.description}
              onChange={(e) => {
                setValue(`description`, e.target.value,{
                  shouldValidate: true,
                  shouldDirty: true
                });
              }}
            />
          </Div>
        </Grid>
        <Grid size={12} textAlign={'end'}>
          <LoadingButton
            loading={false}
            variant='contained'
            type='submit'
            size='small'
            sx={{marginBottom: 0.5}}
          >
            {
              adjustment ? (
                <><CheckOutlined fontSize='small' /> {dictionary.forms.shifts.buttons.done}</>
              ) : (
                <><AddOutlined fontSize='small' /> {dictionary.forms.shifts.buttons.add}</>
              )
            }
          </LoadingButton>
          {
            adjustment && 
            <Tooltip title={dictionary.tooltips.closeEdit}>
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

export default Adjustments