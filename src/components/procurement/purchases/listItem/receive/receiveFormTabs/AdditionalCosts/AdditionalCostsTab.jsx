import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import { useLedgerSelect } from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import CurrencySelector from '@/components/masters/Currencies/CurrencySelector';
import { useCurrencySelect } from '@/components/masters/Currencies/CurrencySelectProvider';
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
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

function AdditionalCostsTab({
  index = -1,
  setShowForm = null,
  additionalCost,
  setIsDirty,
  registerSubmit = null,
  additionalCosts = [],
  setAdditionalCosts,
}) {
  const dictionary = useDictionary();
  const { ungroupedLedgerOptions } = useLedgerSelect();
  const [isAdding, setIsAdding] = useState(false);
  const { currencies } = useCurrencySelect();
  const { authOrganization } = useJumboAuth();
  // VAT Exempt only affects the flat VAT a Purchase Bill applies — orgs
  // that don't bill Purchase Orders/GRNs before paying them compute VAT
  // strictly per-item at GRN time instead, never touching additional
  // costs, so the flag would do nothing there.
  const deferGrnBilling = !!authOrganization?.organization?.settings?.defer_grn_billing;

  // Define validation schema
  const validationSchema = yup.object({
    credit_ledger_id: yup
      .number()
      .required(dictionary.forms.purchases.receive.additionalCosts.errors.validation.costName.required)
      .typeError(dictionary.forms.purchases.receive.additionalCosts.errors.validation.costName.required),
    currency_id: yup
      .number()
      .positive(dictionary.forms.purchases.receive.additionalCosts.errors.validation.currency.required)
      .required(dictionary.forms.purchases.receive.additionalCosts.errors.validation.currency.required)
      .typeError(dictionary.forms.purchases.receive.additionalCosts.errors.validation.currency.required),
    exchange_rate: yup
      .number()
      .positive(dictionary.forms.purchases.receive.additionalCosts.errors.validation.exchangeRate.required)
      .required(dictionary.forms.purchases.receive.additionalCosts.errors.validation.exchangeRate.required)
      .typeError(dictionary.forms.purchases.receive.additionalCosts.errors.validation.exchangeRate.required),
    amount: yup
      .number()
      .required(dictionary.forms.purchases.receive.additionalCosts.errors.validation.amount.required)
      .positive(dictionary.forms.purchases.receive.additionalCosts.errors.validation.amount.required)
      .typeError(dictionary.forms.purchases.receive.additionalCosts.errors.validation.amount.required),
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
      credit_ledger_name:
        additionalCost &&
        (additionalCost.credit_ledger_name || additionalCost.name),
      credit_ledger_id: additionalCost && additionalCost.credit_ledger_id,
      currency_id: additionalCost
        ? additionalCost.currency_id || additionalCost.currency.id
        : 1,
      currency_name: additionalCost
        ? additionalCost.currency_name || additionalCost.currency?.name
        : currencies.find((currency) => currency.id === 1)?.name_plural,
      exchange_rate: additionalCost ? additionalCost.exchange_rate : 1,
      reference: additionalCost && additionalCost.reference,
      amount: additionalCost && additionalCost.amount,
      // Whether this cost is owed to the supplier (folded into the GRN's
      // unbilled amount, billable later — e.g. CESS) or already settled/
      // third-party (e.g. a transporter's own invoice). Defaults to true —
      // most additional costs entered here relate to the shipment/supplier.
      owed_to_supplier: additionalCost
        ? additionalCost.owed_to_supplier ?? true
        : true,
      // Only meaningful when owed_to_supplier is true — see
      // PurchaseOrderAdditionalCost::vat_exempted on the backend.
      vat_exempted: additionalCost ? !!additionalCost.vat_exempted : false,
    },
  });

  const owedToSupplier = watch('owed_to_supplier');

  useEffect(() => {
    setIsDirty(Object.keys(dirtyFields).length > 0); // Update dirty state
  }, [dirtyFields, setIsDirty]);

  const updateItems = async (item) => {
    setIsAdding(true);
    if (index > -1) {
      // Replace the existing item with the edited item
      let updatedAdditionalCosts = [...additionalCosts];
      updatedAdditionalCosts[index] = {
        ...item,
      };
      await setAdditionalCosts(updatedAdditionalCosts);
    } else {
      // Add the new item to the additionalCosts array
      await setAdditionalCosts((additionalCosts) => {
        const newAdditionalCosts = { ...item, prepopulated: false };
        return [...additionalCosts, newAdditionalCosts];
      });
    }

    reset();
    setIsAdding(false);
    setShowForm && setShowForm(false);
  };

  // Lets the parent tab-switch guard commit this row's edits (e.g. the
  // "Owed to Supplier" checkbox) instead of only offering to discard them.
  // updateItemsRef always points at the latest updateItems closure, so the
  // registered submitter never runs against a stale additionalCosts/index
  // captured back when the effect first mounted.
  const updateItemsRef = useRef(updateItems);
  updateItemsRef.current = updateItems;

  useEffect(() => {
    if (!registerSubmit) {
      return;
    }
    registerSubmit(
      () =>
        new Promise((resolve, reject) => {
          handleSubmit(
            async (item) => {
              await updateItemsRef.current(item);
              resolve();
            },
            (validationErrors) => reject(validationErrors)
          )();
        })
    );
    return () => registerSubmit(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerSubmit]);

  if (isAdding) {
    return <LinearProgress />;
  }

  return (
    <form autoComplete='off' onSubmit={handleSubmit(updateItems)}>
      <Grid size={12}>
        <Divider />
      </Grid>
      <Grid container columnSpacing={1}>
        <Grid size={{ xs: 12, md: 3, lg: 4 }}>
          <Div sx={{ mt: 1 }}>
            <LedgerSelect
              multiple={false}
              allowedGroups={['Expenses']}
              label={dictionary.forms.purchases.receive.additionalCosts.labels.costName}
              defaultValue={ungroupedLedgerOptions.find(
                (ledger) => ledger.id === additionalCost?.credit_ledger_id
              )}
              frontError={errors?.credit_ledger_id}
              onChange={(newValue) => {
                if (!!newValue) {
                  setValue(`credit_ledger_name`, newValue.name);
                  setValue(`credit_ledger_id`, newValue ? newValue.id : null, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }
              }}
            />
          </Div>
        </Grid>
        <Grid size={{ xs: 12, md: 2, lg: 2 }}>
          <Div sx={{ mt: 1 }}>
            <TextField
              label={dictionary.forms.purchases.receive.additionalCosts.labels.reference}
              fullWidth
              size='small'
              defaultValue={additionalCost && additionalCost.reference}
              onChange={(e) => {
                setValue(`reference`, e.target.value, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
            />
          </Div>
        </Grid>
        <Grid
          size={{
            xs: 12,
            md: watch(`currency_id`) > 1 ? 3.5 : 5,
            lg: watch(`currency_id`) > 1 ? 2 : 4,
          }}
        >
          <Div sx={{ mt: 1 }}>
            <CurrencySelector
              frontError={errors?.currency_id}
              defaultValue={additionalCost && additionalCost.currency_id}
              onChange={(newValue) => {
                setValue(`currency_id`, newValue ? newValue.id : 1, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                setValue(`currency_name`, newValue.name);
                setValue(`exchange_rate`, newValue ? newValue.exchangeRate : 1);
              }}
            />
          </Div>
        </Grid>
        {watch(`currency_id`) > 1 && (
          <Grid size={{ xs: 6, md: 2, lg: 2 }}>
            <Div sx={{ mt: 1 }}>
              <TextField
                label={dictionary.forms.purchases.receive.additionalCosts.labels.exchangeRate}
                fullWidth
                size='small'
                error={errors && !!errors.exchange_rate}
                helperText={errors && errors.exchange_rate?.message}
                InputProps={{
                  inputComponent: CommaSeparatedField,
                }}
                defaultValue={watch(`exchange_rate`)}
                onChange={(e) => {
                  setValue(
                    `exchange_rate`,
                    e.target.value ? sanitizedNumber(e.target.value) : null,
                    {
                      shouldValidate: true,
                      shouldDirty: true,
                    }
                  );
                }}
              />
            </Div>
          </Grid>
        )}
        <Grid
          size={{
            xs: watch(`currency_id`) > 1 ? 6 : 12,
            md: watch(`currency_id`) > 1 ? 1.5 : 2,
            lg: watch(`currency_id`) > 1 ? 2 : 2,
          }}
        >
          <Div sx={{ mt: 1 }}>
            <TextField
              label={dictionary.forms.purchases.receive.additionalCosts.labels.amount}
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
        <Grid size={{ xs: 12, md: 6 }}>
          <Tooltip title={dictionary.tooltips.foldsThisCostIntoTheGrn}>
            <FormControlLabel
              control={
                <Checkbox
                  size='small'
                  checked={!!owedToSupplier}
                  onChange={(e) =>
                    setValue('owed_to_supplier', e.target.checked, {
                      shouldDirty: true,
                    })
                  }
                />
              }
              label={dictionary.forms.purchases.receive.additionalCosts.labels.owedToSupplier}
            />
          </Tooltip>
          {owedToSupplier && deferGrnBilling && (
            <Tooltip title={dictionary.tooltips.excludesThisCostFromVatWhen}>
              <FormControlLabel
                control={
                  <Checkbox
                    size='small'
                    checked={!!watch('vat_exempted')}
                    onChange={(e) =>
                      setValue('vat_exempted', e.target.checked, {
                        shouldDirty: true,
                      })
                    }
                  />
                }
                label={dictionary.forms.purchases.receive.additionalCosts.labels.vatExempt}
              />
            </Tooltip>
          )}
        </Grid>
      </Grid>
      <Grid size={{ xs: 12, md: 12, lg: 12 }} mt={1} textAlign={'end'}>
        <LoadingButton
          loading={false}
          variant='contained'
          size='small'
          type='submit'
          sx={{ marginBottom: 0.5 }}
        >
          {additionalCost ? (
            <>
              <CheckOutlined fontSize='small' /> {dictionary.forms.purchases.receive.additionalCosts.buttons.done}
            </>
          ) : (
            <>
              <AddOutlined fontSize='small' /> {dictionary.forms.purchases.receive.additionalCosts.buttons.add}
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
    </form>
  );
}

export default AdditionalCostsTab;
