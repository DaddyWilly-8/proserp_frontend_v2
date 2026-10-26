import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import { useLedgerSelect } from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import {
  AddOutlined,
  CheckOutlined,
  DisabledByDefault,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Checkbox,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  LinearProgress,
  TextField,
  Tooltip,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

function PurchaseOrderAdditionalCostsTab({
  index = -1,
  setShowForm = null,
  additionalCost,
  setIsDirty,
  additionalCosts = [],
  setAdditionalCosts,
}) {
  const dictionary = useDictionary();
  const { ungroupedLedgerOptions } = useLedgerSelect();
  const [isAdding, setIsAdding] = useState(false);

  const validationSchema = yup.object({
    ledger_name: yup.string(),
    ledger_id: yup
      .number()
      .required(dictionary.forms.purchases.orderForm.errors.validation.costName.required)
      .typeError(dictionary.forms.purchases.orderForm.errors.validation.costName.required),
    amount: yup
      .number()
      .required(dictionary.forms.purchases.orderForm.errors.validation.amount.required)
      .positive(dictionary.forms.purchases.orderForm.errors.validation.amount.required)
      .typeError(dictionary.forms.purchases.orderForm.errors.validation.amount.required),
    vat_exempted: yup.boolean(),
  });

  const {
    setValue,
    handleSubmit,
    watch,
    reset,
    formState: { errors, dirtyFields },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      ledger_name:
        additionalCost &&
        (additionalCost.ledger?.name || additionalCost.ledger_name),
      ledger_id: additionalCost && additionalCost.ledger_id,
      amount: additionalCost && additionalCost.amount,
      vat_exempted: additionalCost ? !!additionalCost.vat_exempted : false,
    },
  });

  useEffect(() => {
    setIsDirty(Object.keys(dirtyFields).length > 0);
  }, [dirtyFields, setIsDirty]);

  const updateItems = async (item) => {
    setIsAdding(true);
    if (index > -1) {
      let updatedAdditionalCosts = [...additionalCosts];
      updatedAdditionalCosts[index] = item;
      await setAdditionalCosts(updatedAdditionalCosts);
    } else {
      await setAdditionalCosts((additionalCosts) => [
        ...additionalCosts,
        item,
      ]);
    }

    reset();
    setIsAdding(false);
    setIsDirty(false);
    setShowForm && setShowForm(false);
  };

  if (isAdding) {
    return <LinearProgress />;
  }

  return (
    <form autoComplete='off' onSubmit={handleSubmit(updateItems)}>
      <Grid size={12}>
        <Divider />
      </Grid>
      <Grid container columnSpacing={1}>
        <Grid size={{ xs: 12, md: 4, lg: 4 }}>
          <Div sx={{ mt: 1 }}>
            <LedgerSelect
              multiple={false}
              allowedGroups={['Expenses']}
              label={dictionary.forms.purchases.orderForm.labels.costName}
              defaultValue={ungroupedLedgerOptions.find(
                (ledger) => ledger.id === additionalCost?.ledger_id
              )}
              frontError={errors?.ledger_id}
              onChange={(newValue) => {
                if (!!newValue) {
                  setValue(`ledger_name`, newValue.name);
                  setValue(`ledger_id`, newValue ? newValue.id : null, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }
              }}
            />
          </Div>
        </Grid>
        <Grid size={{ xs: 12, md: 3, lg: 3 }}>
          <Div sx={{ mt: 1 }}>
            <TextField
              label={dictionary.forms.purchases.orderForm.labels.amount}
              fullWidth
              size='small'
              InputProps={{
                inputComponent: CommaSeparatedField,
              }}
              defaultValue={additionalCost && additionalCost.amount}
              error={errors && !!errors?.amount}
              helperText={errors && errors?.amount?.message}
              onChange={(e) => {
                setValue(
                  `amount`,
                  e.target.value ? sanitizedNumber(e.target.value) : 0,
                  {
                    shouldValidate: true,
                    shouldDirty: true,
                  }
                );
              }}
            />
          </Div>
        </Grid>
        <Grid size={{ xs: 12, md: 3, lg: 3 }} mt={1}>
          <Tooltip title={dictionary.tooltips.thisCostWillNotAttractVat}>
            <FormControlLabel
              control={
                <Checkbox
                  size='small'
                  defaultChecked={!!additionalCost?.vat_exempted}
                  onChange={(e) => {
                    setValue(`vat_exempted`, e.target.checked, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
              }
              label={dictionary.forms.purchases.orderForm.labels.vatExempted}
            />
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 12, md: 2 }} mt={1} textAlign={'end'}>
          <LoadingButton
            loading={false}
            variant='contained'
            size='small'
            type='submit'
            sx={{ marginBottom: 0.5 }}
          >
            {additionalCost ? (
              <>
                <CheckOutlined fontSize='small' /> {dictionary.forms.purchases.orderForm.buttons.done}
              </>
            ) : (
              <>
                <AddOutlined fontSize='small' /> {dictionary.forms.purchases.orderForm.buttons.add}
              </>
            )}
          </LoadingButton>
          {additionalCost && (
            <Tooltip title={dictionary.tooltips.closeEdit}>
              <IconButton
                size='small'
                onClick={() => {
                  setShowForm(false);
                }}
              >
                <DisabledByDefault fontSize='small' color='success' />
              </IconButton>
            </Tooltip>
          )}
        </Grid>
      </Grid>
    </form>
  );
}

export default PurchaseOrderAdditionalCostsTab;
