import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import BillPicker, { BillOption } from '@/components/shared/pickers/BillPicker';
import InvoicePicker, {
  InvoiceOption,
} from '@/components/shared/pickers/InvoicePicker';
import PurchaseOrderPicker, {
  PurchaseOrderOption,
} from '@/components/shared/pickers/PurchaseOrderPicker';
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
  Autocomplete,
  Grid,
  IconButton,
  LinearProgress,
  TextField,
  Tooltip,
} from '@mui/material';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import LedgerSelect from '../ledgers/forms/LedgerSelect';
import { useLedgerSelect } from '../ledgers/forms/LedgerSelectProvider';
import QuickAddLedger from '../ledgers/forms/QuickAddLedger';
import { Ledger } from '../ledgers/LedgerType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

// Traceability-only link from a payment item to a Bill or Purchase Order it
// settles/relates to (isPayment), or from a receipt item to a Customer
// Invoice it settles/relates to (isReceipt).
type ItemRelatableType = 'purchase' | 'bill' | 'invoice';

type TransactionItem = {
  debit_ledger_id?: number;
  item_form_ledger_currency_id?: number;
  credit_ledger_id?: number;
  amount: number;
  description: string;
  relatable_type?: ItemRelatableType | null;
  relatable_id?: number | null;
  // 'fuel_voucher_invoice' when the linked "invoice" is a Fuel Voucher invoice
  relatable_kind?: string | null;
  relatable?: PurchaseOrderOption | BillOption | InvoiceOption | null;
  relatableNo?: string;
};

const paymentRelatableTypeOptions: { value: ItemRelatableType; label: string }[] = [
  { value: 'purchase', label: 'Purchase Order' },
  { value: 'bill', label: 'Bill' },
];

const receiptRelatableTypeOptions: { value: ItemRelatableType; label: string }[] = [
  { value: 'invoice', label: 'Invoice' },
];

const relatableLabelKeys: Record<ItemRelatableType, string> = {
  purchase: 'purchaseOrder',
  bill: 'bill',
  invoice: 'invoice',
};

type TransactionItemFormProps = {
  setClearFormKey: React.Dispatch<React.SetStateAction<number>>;
  submitMainForm: () => void;
  submitItemForm: boolean;
  setSubmitItemForm: React.Dispatch<React.SetStateAction<boolean>>;
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
  isReceipt?: boolean;
  isPayment?: boolean;
  selectedCurrencyId: number;
  onLedgerCurrencyDetected?: (currencyId?: number) => void;
  isTransfer?: boolean;
  index?: number;
  setShowForm?: React.Dispatch<React.SetStateAction<boolean>>;
  item?: TransactionItem;
  items?: TransactionItem[];
  setItems: React.Dispatch<React.SetStateAction<TransactionItem[]>>;
  defaultAmount?: number;
};

type FormValues = {
  debit_ledger?: Ledger;
  debit_ledger_id?: number;
  item_form_ledger_currency_id?: number;
  selectedCurrencyId?: number;
  credit_ledger?: Ledger;
  credit_ledger_id?: number;
  amount: number;
  description: string;
  relatable_type?: ItemRelatableType | null;
  relatable_id?: number | null;
  relatable?: PurchaseOrderOption | BillOption | InvoiceOption | null;
};

const TransactionItemForm: React.FC<TransactionItemFormProps> = ({
  setClearFormKey,
  submitMainForm,
  submitItemForm,
  setSubmitItemForm,
  setIsDirty,
  isReceipt = false,
  isPayment = false,
  isTransfer = false,
  selectedCurrencyId,
  onLedgerCurrencyDetected,
  index = -1,
  setShowForm = null,
  item,
  items = [],
  setItems,
  defaultAmount,
}) => {
  const dictionary = useDictionary();
  const [isAdding, setIsAdding] = useState(false);
  const { ungroupedLedgerOptions } = useLedgerSelect();
  const { authOrganization } = useJumboAuth();
  const deferGrnBilling = !!authOrganization?.organization?.settings?.defer_grn_billing;
  // "Bill" only exists as a concept for orgs that bill their Purchase
  // Orders/GRNs before paying them — where it applies, it's the
  // authoritative "amount owed" record, so linking a payment straight to
  // the order instead would bypass its own paid/unpaid tracking; where it
  // doesn't apply, "Bill" isn't a real option at all. Receipts have no such
  // duality — "Invoice" is the only relatable concept on that side.
  const relatableTypeOptions = useMemo(() => {
    const baseOptions = isReceipt
      ? receiptRelatableTypeOptions
      : paymentRelatableTypeOptions.filter((opt) =>
          deferGrnBilling ? opt.value !== 'purchase' : opt.value !== 'bill'
        );
    return baseOptions.map((opt) => ({
      ...opt,
      label: (dictionary.forms.transactions.itemForm.labels as Record<string, string>)[relatableLabelKeys[opt.value]],
    }));
  }, [deferGrnBilling, isReceipt, dictionary]);
  const [openLedgerQuickAdd, setOpenLedgerQuickAdd] = useState(false);
  const [ledgerType, setLedgerType] = useState<'debit' | 'credit'>('credit');
  const [addedLedger, setAddedLedger] = useState<Ledger | null>(null);
  const [selectedLedgerCurrencyId, setSelectedLedgerCurrencyId] = useState<
    number | undefined
  >(item?.item_form_ledger_currency_id);

  const validationSchema = yup.object().shape({
    debit_ledger_id: yup.number().when('$isPaymentOrTransfer', {
      is: (isPaymentOrTransfer: boolean) => isPaymentOrTransfer,
      then: (schema) =>
        schema
          .required(dictionary.forms.transactions.itemForm.errors.validation.debitRequired)
          .positive(dictionary.forms.transactions.itemForm.errors.validation.debitRequired)
          .test(
            'unique-ledgers',
            dictionary.forms.transactions.itemForm.errors.validation.sameAccounts,
            function (value) {
              return value !== this.parent.credit_ledger_id;
            }
          )
          .typeError(dictionary.forms.transactions.itemForm.errors.validation.debitRequired),
      otherwise: (schema) => schema.nullable(),
    }),
    credit_ledger_id: yup.number().when('$isReceipt', {
      is: (isReceipt: boolean) => isReceipt,
      then: (schema) =>
        schema
          .required(dictionary.forms.transactions.itemForm.errors.validation.creditRequired)
          .positive(dictionary.forms.transactions.itemForm.errors.validation.creditRequired)
          .test(
            'unique-ledgers',
            dictionary.forms.transactions.itemForm.errors.validation.sameAccounts,
            function (value) {
              return value !== this.parent.debit_ledger_id;
            }
          )
          .typeError(dictionary.forms.transactions.itemForm.errors.validation.creditRequired),
      otherwise: (schema) => schema.nullable(),
    }),
    description: yup
      .string()
      .required(dictionary.forms.transactions.itemForm.errors.validation.descriptionRequired)
      .typeError(dictionary.forms.transactions.itemForm.errors.validation.descriptionRequired),
    amount: yup
      .number()
      .required(dictionary.forms.transactions.itemForm.errors.validation.amountRequired)
      .positive(dictionary.forms.transactions.itemForm.errors.validation.amountPositive)
      .test(
        'max-amount',
        dictionary.forms.transactions.itemForm.errors.validation.amountExceedsRelatable,
        function (value) {
          const relatable = this.parent?.relatable as
            PurchaseOrderOption | BillOption | InvoiceOption | null | undefined;

          if (!relatable?.id || value == null) {
            return true;
          }

          // Invoices (Receipts) have no "approved" concept — cap against
          // what's still unpaid instead.
          const maxAmount = Number(
            (relatable as BillOption | PurchaseOrderOption).unapproved_amount ??
              (relatable as InvoiceOption).unpaid_amount ??
              0
          );

          if (Number(value) <= maxAmount) {
            return true;
          }

          const cappedByPurchaseOrder = (relatable as BillOption)
            ?.capped_by_purchase_order;

          return this.createError({
            message: cappedByPurchaseOrder
              ? dictionary.forms.transactions.itemForm.errors.validation.amountExceedsCapped
                  .replace('{max}', maxAmount.toLocaleString())
                  .replace('{purchaseOrderNo}', String((relatable as BillOption)?.purchase_order_no))
              : dictionary.forms.transactions.itemForm.errors.validation.amountExceedsMax.replace(
                  '{max}',
                  maxAmount.toLocaleString()
                ),
          });
        }
      )
      .typeError(dictionary.forms.transactions.itemForm.errors.validation.amountRequired),
  });

  const {
    setValue,
    handleSubmit,
    watch,
    reset,
    clearErrors,
    setError,
    formState: { errors, dirtyFields },
  } = useForm<FormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      credit_ledger:
        item &&
        ungroupedLedgerOptions.find(
          (ledger) => ledger.id === item.credit_ledger_id
        ),
      credit_ledger_id: item?.credit_ledger_id,
      debit_ledger:
        item &&
        ungroupedLedgerOptions.find(
          (ledger) => ledger.id === item.debit_ledger_id
        ),
      debit_ledger_id: item?.debit_ledger_id,
      item_form_ledger_currency_id: item?.item_form_ledger_currency_id,
      amount: item?.amount || (items.length === 0 ? defaultAmount : 0) || 0,
      description: item?.description || '',
      relatable_type: item?.relatable_type ?? null,
      relatable_id: item?.relatable_id ?? null,
      relatable:
        item?.relatable ??
        (item?.relatable_id && item?.relatableNo
          ? ({
              id: item.relatable_id,
              orderNo: item.relatableNo,
              invoiceNo: item.relatableNo,
              kind: item.relatable_kind ?? undefined,
            } as any)
          : null),
    },
  });

  // Watch the currency ID from the ledger selection
  const watchedCurrencyId = watch('item_form_ledger_currency_id');

  // Update local state when watched currency changes
  useEffect(() => {
    if (watchedCurrencyId !== undefined) {
      setSelectedLedgerCurrencyId(watchedCurrencyId);
    }
  }, [watchedCurrencyId]);

  // A Purchase Order/Bill picked in the "Link To" fields is scoped to (and
  // its unapproved balance validated in) whatever currency was selected at
  // pick time. If the payment's currency changes while this not-yet-added
  // item still holds such a link, it's stale — clear the link so the user
  // re-picks it under the new currency. Already-added items aren't affected:
  // the currency locks once an item exists.
  const previousCurrencyIdRef = useRef(selectedCurrencyId);
  useEffect(() => {
    if (
      previousCurrencyIdRef.current !== undefined &&
      selectedCurrencyId !== undefined &&
      previousCurrencyIdRef.current !== selectedCurrencyId
    ) {
      setValue('relatable_type', null);
      setValue('relatable_id', null);
      setValue('relatable', null);
    }
    previousCurrencyIdRef.current = selectedCurrencyId;
  }, [selectedCurrencyId]);

  // Determine which field to show the currency error on
  const getFieldForCurrencyError = () => {
    if (isPayment || isTransfer) {
      return 'debit_ledger_id';
    } else if (isReceipt) {
      return 'credit_ledger_id';
    }
    return null;
  };

  const currencyErrorField = getFieldForCurrencyError();

  // Validate ledger currency matches selected currency
  useEffect(() => {
    // Only validate if we have a selected currency and a ledger currency
    if (
      currencyErrorField &&
      selectedCurrencyId &&
      selectedLedgerCurrencyId !== undefined
    ) {
      if (selectedCurrencyId !== selectedLedgerCurrencyId) {
        setError(currencyErrorField, {
          type: 'manual',
          message: dictionary.forms.transactions.itemForm.errors.validation.currencyMismatch,
        });
      } else {
        clearErrors(currencyErrorField);
      }
    }
  }, [
    selectedCurrencyId,
    selectedLedgerCurrencyId,
    currencyErrorField,
    setError,
    clearErrors,
  ]);

  useEffect(() => {
    setIsDirty(Object.keys(dirtyFields).length > 0);
  }, [dirtyFields, setIsDirty, watch]);

  useEffect(() => {
    if (addedLedger?.id) {
      // ledgerType-aware: this component shows either a Debit field
      // (isPayment/isTransfer) or a Credit field (isReceipt), never both, and
      // ledgerType already tracks which one the quick-add was opened from.
      // Writing to the wrong field was a pre-existing bug (e.g. quick-adding
      // a Credit ledger on a Receipt also silently set debit_ledger_id).
      if (ledgerType === 'debit') {
        setValue('debit_ledger', addedLedger);
        setValue('debit_ledger_id', addedLedger.id);
      } else if (ledgerType === 'credit') {
        setValue('credit_ledger', addedLedger);
        setValue('credit_ledger_id', addedLedger.id);
      }
      // Consume the quick-added ledger once it's been applied. Without this,
      // addedLedger stays truthy forever, and LedgerSelect's own effect
      // (keyed on the inline onChange prop, which gets a new reference on
      // every re-render) keeps re-firing onChange indefinitely -> infinite
      // render loop -> page freeze. Resetting to null here breaks the cycle.
      setAddedLedger(null);
    }
  }, [addedLedger, ledgerType, setValue]);

  const updateItems = async (formData: FormValues) => {
    // Check currency validation before submitting
    if (
      currencyErrorField &&
      selectedCurrencyId &&
      selectedLedgerCurrencyId !== undefined &&
      selectedCurrencyId !== selectedLedgerCurrencyId
    ) {
      setError(currencyErrorField, {
        type: 'manual',
        message: dictionary.forms.transactions.itemForm.errors.validation.currencyMustMatch,
      });
      return;
    }

    setIsAdding(true);
    const relatable = formData.relatable_type ? formData.relatable : null;
    const newItem: TransactionItem = {
      debit_ledger_id: formData.debit_ledger_id,
      item_form_ledger_currency_id: formData.item_form_ledger_currency_id,
      credit_ledger_id: formData.credit_ledger_id,
      amount: formData.amount,
      description: formData.description,
      relatable_type: formData.relatable_type || null,
      relatable_id: relatable?.id ?? null,
      relatable_kind: (relatable as InvoiceOption | null)?.kind === 'fuel_voucher_invoice' ? 'fuel_voucher_invoice' : null,
      relatable: relatable ?? null,
      relatableNo:
        (relatable as any)?.orderNo ||
        (relatable as any)?.invoiceNo ||
        undefined,
    };

    if (index > -1) {
      // Update existing item
      const updatedItems = [...items];
      updatedItems[index] = newItem;
      await setItems(updatedItems);
      setClearFormKey((prevKey) => prevKey + 1);
    } else {
      // Add new item
      await setItems((prevItems) => [...prevItems, newItem]);
      if (submitItemForm) {
        submitMainForm();
      }
      setSubmitItemForm(false);
      setClearFormKey((prevKey) => prevKey + 1);
    }

    reset();
    setIsAdding(false);
    setShowForm?.(false);
  };

  useEffect(() => {
    if (submitItemForm) {
      handleSubmit(updateItems, () => {
        setSubmitItemForm(false);
      })();
    }
  }, [submitItemForm, handleSubmit, updateItems, setSubmitItemForm]);

  if (isAdding) {
    return <LinearProgress />;
  }

  if (openLedgerQuickAdd && ledgerType === 'debit') {
    return (
      <QuickAddLedger
        toggleOpen={setOpenLedgerQuickAdd}
        ledgerType='debit'
        setAddedLedger={setAddedLedger}
      />
    );
  } else if (openLedgerQuickAdd && ledgerType === 'credit') {
    return (
      <QuickAddLedger
        toggleOpen={setOpenLedgerQuickAdd}
        ledgerType='credit'
        setAddedLedger={setAddedLedger}
      />
    );
  } else {
    return (
      <Grid container spacing={1} marginTop={0.5}>
        {/* Debit Ledger Field */}
        {(isPayment || isTransfer) && (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <Div sx={{ mt: 1 }}>
              <LedgerSelect
                label={
                  isPayment
                    ? dictionary.forms.transactions.itemForm.labels.payDebit
                    : isTransfer
                      ? dictionary.forms.transactions.itemForm.labels.toDebit
                      : dictionary.forms.transactions.itemForm.labels.debit
                }
                frontError={errors.debit_ledger_id}
                addedLedger={addedLedger}
                defaultValue={ungroupedLedgerOptions.find(
                  (ledger) => ledger.id === watch('debit_ledger_id')
                )}
                allowedGroups={
                  isPayment
                    ? [
                        'Assets',
                        'Expenses',
                        'Liabilities',
                        'Capital',
                      ]
                    : isTransfer
                      ? ['Cash and cash equivalents', 'Current Assets']
                      : []
                }
                onChange={(newValue: any) => {
                  const selected = Array.isArray(newValue)
                    ? newValue[0]
                    : newValue;
                  const currencyId = selected?.currency?.id;
                  setValue('item_form_ledger_currency_id', currencyId);
                  setSelectedLedgerCurrencyId(currencyId);
                  onLedgerCurrencyDetected?.(currencyId);
                  setValue('debit_ledger', selected || undefined);
                  setValue('debit_ledger_id', selected?.id, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
                startAdornment={
                  <Tooltip title={dictionary.tooltips.addNewDebit}>
                    <AddOutlined
                      onClick={() => {
                        setOpenLedgerQuickAdd(true);
                        setLedgerType('debit');
                      }}
                      sx={{ cursor: 'pointer' }}
                    />
                  </Tooltip>
                }
              />
            </Div>
          </Grid>
        )}

        {/* Credit Ledger Field */}
        {isReceipt && (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <Div sx={{ mt: 1 }}>
              <LedgerSelect
                label={isReceipt ? dictionary.forms.transactions.itemForm.labels.fromCredit : dictionary.forms.transactions.itemForm.labels.credit}
                addedLedger={addedLedger}
                frontError={errors.credit_ledger_id}
                allowedGroups={
                  isReceipt
                    ? ['Accounts Receivable', 'Accounts Payable', 'Capital', 'Current Assets', 'Current Liabilities']
                    : []
                }
                defaultValue={ungroupedLedgerOptions.find(
                  (ledger) => ledger.id === watch('credit_ledger_id')
                )}
                onChange={(newValue: any) => {
                  const selected = Array.isArray(newValue)
                    ? newValue[0]
                    : newValue;
                  const currencyId = selected?.currency?.id;
                  setValue('item_form_ledger_currency_id', currencyId);
                  setSelectedLedgerCurrencyId(currencyId);
                  onLedgerCurrencyDetected?.(currencyId);
                  setValue('credit_ledger', selected || undefined);
                  setValue('credit_ledger_id', selected?.id, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
                startAdornment={
                  <Tooltip title={dictionary.tooltips.addNewCredit}>
                    <AddOutlined
                      onClick={() => {
                        setOpenLedgerQuickAdd(true);
                        setLedgerType('credit');
                      }}
                      sx={{ cursor: 'pointer' }}
                    />
                  </Tooltip>
                }
              />
            </Div>
          </Grid>
        )}

        {/* Traceability-only link to a Bill/Purchase Order (Payments) or
            Customer Invoice (Receipts) this item relates to */}
        {(isPayment || isReceipt) && (
          <>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <Div sx={{ mt: 1 }}>
                <Autocomplete
                  options={relatableTypeOptions}
                  isOptionEqualToValue={(option, value) =>
                    option.value === value.value
                  }
                  getOptionLabel={(option) => option.label}
                  value={
                    relatableTypeOptions.find(
                      (opt) => opt.value === watch('relatable_type')
                    ) || null
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={dictionary.forms.transactions.itemForm.labels.linkTo}
                      size='small'
                      fullWidth
                    />
                  )}
                  onChange={(e, newValue) => {
                    setValue('relatable_type', newValue?.value ?? null);
                    setValue('relatable_id', null);
                    setValue('relatable', null);
                  }}
                />
              </Div>
            </Grid>
            {watch('relatable_type') === 'purchase' && (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                <Div sx={{ mt: 1 }}>
                  <PurchaseOrderPicker
                    value={watch('relatable') as PurchaseOrderOption | null}
                    ledgerId={watch('debit_ledger_id') ?? null}
                    currencyId={selectedCurrencyId ?? null}
                    onChange={(newValue) => {
                      setValue('relatable', newValue);
                      setValue('relatable_id', newValue?.id ?? null);
                    }}
                  />
                </Div>
              </Grid>
            )}
            {watch('relatable_type') === 'bill' && (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                <Div sx={{ mt: 1 }}>
                  <BillPicker
                    value={watch('relatable') as BillOption | null}
                    stakeholder={
                      (watch('debit_ledger') as Ledger | undefined)
                        ?.stakeholders?.[0] ?? null
                    }
                    currencyId={selectedCurrencyId ?? null}
                    onChange={(newValue) => {
                      setValue('relatable', newValue);
                      setValue('relatable_id', newValue?.id ?? null);
                    }}
                  />
                </Div>
              </Grid>
            )}
            {watch('relatable_type') === 'invoice' && (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                <Div sx={{ mt: 1 }}>
                  <InvoicePicker
                    value={watch('relatable') as InvoiceOption | null}
                    stakeholder={
                      (watch('credit_ledger') as Ledger | undefined)
                        ?.stakeholders?.[0] ?? null
                    }
                    currencyId={selectedCurrencyId ?? null}
                    onChange={(newValue) => {
                      setValue('relatable', newValue);
                      setValue('relatable_id', newValue?.id ?? null);
                    }}
                  />
                </Div>
              </Grid>
            )}
          </>
        )}

        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Div sx={{ mt: 1 }}>
            <TextField
              size='small'
              fullWidth
              defaultValue={watch('description')}
              label={dictionary.forms.transactions.itemForm.labels.description}
              error={!!errors.description}
              helperText={errors.description?.message}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setValue('description', e.target.value, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
            />
          </Div>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <Div sx={{ mt: 1 }}>
            <TextField
              label={dictionary.forms.transactions.itemForm.labels.amount}
              fullWidth
              size='small'
              value={watch('amount') || ''}
              error={!!errors.amount}
              helperText={errors.amount?.message}
              InputProps={{
                inputComponent: CommaSeparatedField,
              }}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const value = sanitizedNumber(e.target.value);
                setValue('amount', value, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
            />
          </Div>
        </Grid>

        {/* Action Buttons */}
        <Grid size={12} textAlign={'end'}>
          <LoadingButton
            loading={false}
            variant='contained'
            type='submit'
            size='small'
            onClick={handleSubmit(updateItems)}
            sx={{ marginBottom: 0.5 }}
          >
            {item ? (
              <>
                <CheckOutlined fontSize='small' /> {dictionary.forms.transactions.itemForm.buttons.done}
              </>
            ) : (
              <>
                <AddOutlined fontSize='small' /> {dictionary.forms.transactions.itemForm.buttons.add}
              </>
            )}
          </LoadingButton>
          {item && setShowForm && (
            <Tooltip title={dictionary.tooltips.closeEdit}>
              <IconButton size='small' onClick={() => setShowForm(false)}>
                <DisabledByDefault fontSize='small' color='success' />
              </IconButton>
            </Tooltip>
          )}
        </Grid>
      </Grid>
    );
  }
};

export default TransactionItemForm;
