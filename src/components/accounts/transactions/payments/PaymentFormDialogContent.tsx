import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import ScheduleModeSection from '@/components/accounts/recurringTransactions/ScheduleModeSection';
import recurringTransactionServices from '@/components/accounts/recurringTransactions/recurringTransactions-services';
import { buildScheduleBody, emptyScheduleForm, isScheduleFormComplete, ScheduleForm } from '@/components/accounts/recurringTransactions/recurring-utils';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import CurrencySelector from '@/components/masters/Currencies/CurrencySelector';
import { useCurrencySelect } from '@/components/masters/Currencies/CurrencySelectProvider';
import { Currency } from '@/components/masters/Currencies/CurrencyType';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { AddOutlined, HighlightOff } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import LedgerSelect from '../../ledgers/forms/LedgerSelect';
import { useLedgerSelect } from '../../ledgers/forms/LedgerSelectProvider';
import QuickAddLedger from '../../ledgers/forms/QuickAddLedger';
import TransactionItemForm from '../TransactionItemForm';
import TransactionItemRow from '../TransactionItemRow';
import ReconciledCostCentersForm from '../ReconciledCostCentersForm';
import paymentServices from './payment-services';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface Ledger {
  id: number;
  name: string;
  code: string | null;
  ledger_group_id: number;
  alias: string | null;
  nature_id?: number;
}

type PaymentItem = {
  debit_ledger_id?: number;
  credit_ledger_id?: number;
  item_form_ledger_currency_id: any;
  amount: number;
  description: string;
  relatable_type?: 'purchase' | 'bill' | null;
  relatable_id?: number | null;
  relatable?: any;
  relatableNo?: string;
};

type PaymentResponse = {
  message?: string;
};

type PaymentFormValues = {
  id?: number;
  credit_ledger_id: number;
  form_ledger_currency_id: number;
  reference?: string;
  narration: string;
  currency_id: number | null;
  exchange_rate: number;
  cost_centers: CostCenter[];
  transactionDate: string;
  items: PaymentItem[];
};

type PaymentData = {
  id?: number;
  voucherNo?: string;
  credit_ledger_id?: number;
  creditLedgerName?: string;
  reference?: string;
  narration?: string;
  currency?: Currency;
  exchange_rate?: number;
  cost_centers?: CostCenter[];
  transactionDate?: string;
  items?: PaymentItem[];
  is_reconciled?: boolean;
};

type PaymentFormDialogContentProps = {
  setOpen: (open: boolean) => void;
  payment?: PaymentData;
  isDuplicate?: boolean;
};

const PaymentFormDialogContent: React.FC<PaymentFormDialogContentProps> = ({
  setOpen,
  payment,
  isDuplicate = false,
}) => {
  const dictionary = useDictionary();
  const { authOrganization, checkOrganizationPermission } = useJumboAuth();
  const costCenters = authOrganization?.costCenters;
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<Record<string, string> | null>(
    null
  );
  const { enqueueSnackbar } = useSnackbar();
  const { ungroupedLedgerOptions } = useLedgerSelect();
  const [openLedgerQuickAdd, setOpenLedgerQuickAdd] = useState(false);
  const [ledgerType, setLedgerType] = useState('credit');
  const [showWarning, setShowWarning] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [clearFormKey, setClearFormKey] = useState(0);
  const [prevKey, setPrevKey] = useState(0);
  const [submitItemForm, setSubmitItemForm] = useState(false);
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduleForm, setScheduleForm] = useState<ScheduleForm>(() => emptyScheduleForm(''));
  const [addedLedger, setAddedLedger] = useState<Ledger | null>(null);
  const { currencies = [] } = useCurrencySelect();

  const getExchangeRateByCurrencyId = (currencyId?: number) => {
    if (!currencyId) return 1;
    const foundCurrency = currencies.find(
      (currency) => currency.id === currencyId
    );
    return foundCurrency?.exchangeRate || 1;
  };

  const applyCurrencyLock = (currencyId?: number) => {
    if (!currencyId) {
      setValue('form_ledger_currency_id', undefined as any, {
        shouldValidate: true,
      });
      return;
    }

    setValue('form_ledger_currency_id', currencyId, {
      shouldValidate: true,
      shouldDirty: true,
    });

    // Once an item has been added, the payment currency is locked — a
    // ledger pick (top-level "Pay From", or a new item's payee ledger) that
    // resolves to a different currency must not silently change it
    // underneath already-added items and their relatable links. Leaving
    // currency_id unchanged surfaces the mismatch via TransactionItemForm's
    // own ledger-vs-payment-currency check instead.
    if (
      items.length > 0 &&
      Number(currencyId) !== Number(watch('currency_id'))
    ) {
      return;
    }

    setValue('currency_id', currencyId, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue('exchange_rate', getExchangeRateByCurrencyId(currencyId), {
      shouldValidate: true,
      shouldDirty: true,
    });
    setPrevKey((prev) => prev + 1);
  };

  const findLedgerCurrencyId = (ledgerId?: number): number | undefined => {
    if (!ledgerId) return undefined;
    const ledger = ungroupedLedgerOptions.find((l) => l.id === ledgerId);
    return ledger?.currency?.id;
  };

  // Initialize items with currency IDs from ledger options
  const getInitialItems = (): PaymentItem[] => {
    if (!payment?.items) return [];
    return payment.items.map((item: PaymentItem) => ({
      ...item,
      item_form_ledger_currency_id:
        item.item_form_ledger_currency_id ||
        findLedgerCurrencyId(item.debit_ledger_id) ||
        findLedgerCurrencyId(item.credit_ledger_id),
    }));
  };

  const [items, setItems] = useState<PaymentItem[]>(getInitialItems());

  // Once an item has been added, its amount/ledger/relatable link were all
  // validated against the current payment currency — lock currency changes
  // to avoid silently invalidating that data underneath already-added items.
  const hasItems = items.length > 0;

  const haveAllCostCenters = checkOrganizationPermission(
    PERMISSIONS.COST_CENTERS_ALL
  );

  const addPayment = useMutation<PaymentResponse, Error, PaymentData>({
    // In schedule mode the same form saves a schedule instead of posting now.
    mutationFn: (values: any) =>
      scheduleMode
        ? recurringTransactionServices.create(buildScheduleBody('payment', values, scheduleForm))
        : paymentServices.add(values),
    onSuccess: (data) => {
      data?.message && enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setOpen(false);
    },
    onError: (error: any) => {
      if (error?.response?.status === 400) {
        setServerError(error.response?.data?.validation_errors);
      }
      enqueueSnackbar(getErrorMessage(error), {
        variant: 'error',
      });
    },
  });

  const updatePayment = useMutation<PaymentResponse, Error, PaymentData>({
    mutationFn: paymentServices.update,
    onSuccess: (data) => {
      data?.message && enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setOpen(false);
    },
    onError: (error: any) => {
      if (error?.response?.status === 400) {
        setServerError(error.response?.data?.validation_errors);
      }
      enqueueSnackbar(getErrorMessage(error), {
        variant: 'error',
      });
    },
  });

  const validationSchema = yup.object({
    narration: yup
      .string()
      .required(dictionary.forms.payments.form.errors.validation.narrationRequired)
      .typeError(dictionary.forms.payments.form.errors.validation.narrationRequired),
    credit_ledger_id: yup
      .number()
      .required(dictionary.forms.payments.form.errors.validation.creditLedgerRequired)
      .positive(dictionary.forms.payments.form.errors.validation.creditLedgerRequired)
      .typeError(dictionary.forms.payments.form.errors.validation.creditLedgerRequired),
    currency_id: yup
      .number()
      .positive(dictionary.forms.payments.form.errors.validation.currencyRequired)
      .required(dictionary.forms.payments.form.errors.validation.currencyRequired)
      .typeError(dictionary.forms.payments.form.errors.validation.currencyRequired),
    exchange_rate: yup
      .number()
      .positive(dictionary.forms.payments.form.errors.validation.exchangeRateRequired)
      .required(dictionary.forms.payments.form.errors.validation.exchangeRateRequired)
      .typeError(dictionary.forms.payments.form.errors.validation.exchangeRateRequired),
    transactionDate: yup.mixed().required(dictionary.forms.payments.form.errors.validation.paymentDateRequired),
    items: yup
      .array()
      .min(1, dictionary.forms.payments.form.errors.validation.itemsRequired)
      .required(dictionary.forms.payments.form.errors.validation.itemsRequired),
    cost_centers: yup
      .array()
      .test(
        'cost-center-required',
        dictionary.forms.payments.form.errors.validation.costCenterRequired,
        (value) => haveAllCostCenters || (value && value.length > 0)
      ),
  });

  const {
    handleSubmit,
    setError,
    setValue,
    register,
    clearErrors,
    formState: { errors },
    watch,
  } = useForm<PaymentFormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      credit_ledger_id: payment?.credit_ledger_id,
      reference: payment?.reference,
      narration: payment?.narration,
      currency_id: payment?.currency?.id || 1,
      exchange_rate: payment?.exchange_rate || 1,
      cost_centers:
        payment?.cost_centers || (costCenters?.length === 1 ? costCenters : []),
      transactionDate:
        payment && !isDuplicate
          ? payment?.transactionDate
          : dayjs().toISOString(),
      items: payment?.items || items,
      id: payment && !isDuplicate ? payment?.id : undefined,
    },
  });

  useEffect(() => {
    setValue('items', items);
  }, [items, setValue]);

  useEffect(() => {
    if (addedLedger?.id) {
      setValue('credit_ledger_id', addedLedger.id);
      // Consume the quick-added ledger once it's been applied. Without this,
      // addedLedger stays truthy forever, and LedgerSelect's own effect
      // (keyed on the inline onChange prop, which gets a new reference on
      // every re-render) keeps re-firing onChange indefinitely -> infinite
      // render loop -> page freeze. Resetting to null here breaks the cycle.
      setAddedLedger(null);
    }
  }, [addedLedger, setValue]);

  const totalAmount = items.reduce(
    (totalAmount, item) => totalAmount + item.amount,
    0
  );

  const savePayment = React.useMemo(() => {
    return payment && !isDuplicate ? updatePayment : addPayment;
  }, [payment, isDuplicate, updatePayment, addPayment]);

  const onSubmit = (data: PaymentFormValues) => {
    if (items.length === 0) {
      clearErrors('items');
      setError('items', {
        type: 'manual',
        message: dictionary.forms.payments.form.errors.validation.itemsRequired,
      });
      return;
    }
    if (isDirty) {
      setShowWarning(true);
    } else {
      handleSubmit((data) => handleSubmitForm(data))();
    }
  };

  const handleConfirmSubmitWithoutAdd = async (data: PaymentFormValues) => {
    handleSubmit((data) => handleSubmitForm(data))();
    setIsDirty(false);
    setShowWarning(false);
    setClearFormKey((prev) => prev + 1);
  };

  const handleSubmitForm = async (data: PaymentFormValues) => {
    const updatedData = {
      ...data,
      items: items.map((item) => ({
        debit_ledger_id: item.debit_ledger_id,
        item_form_ledger_currency_id: item.item_form_ledger_currency_id,
        amount: item.amount,
        description: item.description,
        relatable_type: item.relatable_type || undefined,
        relatable_id: item.relatable_id || undefined,
      })),
    };
    await savePayment.mutate(updatedData);
  };

  if (payment?.is_reconciled && !isDuplicate) {
    return (
      <ReconciledCostCentersForm
        voucherNo={payment.voucherNo}
        transactionDate={payment.transactionDate}
        narration={payment.narration}
        currentCostCenters={payment.cost_centers || []}
        setOpen={setOpen}
        updateCostCenters={(costCenters) => paymentServices.updateCostCenters(payment, costCenters)}
      />
    );
  }

  return (
    <>
      <DialogTitle textAlign={'center'}>
        {isDuplicate
          ? dictionary.forms.payments.form.title.duplicate.replace('{voucherNo}', payment?.voucherNo ?? '')
          : payment
            ? dictionary.forms.payments.form.title.edit.replace('{voucherNo}', payment.voucherNo ?? '')
            : dictionary.forms.payments.form.title.new}
      </DialogTitle>
      <DialogContent>
        {/* <form autoComplete='false' onSubmit={handleSubmit(onSubmit)}> */}
        <Grid container columnSpacing={1} marginBottom={2}>
          {!openLedgerQuickAdd && (
            <>
              <Grid size={{ xs: 12, md: 4 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <DateTimePicker
                    label={dictionary.forms.payments.form.labels.paymentDate}
                disabled={scheduleMode}
                    minDate={
                      checkOrganizationPermission([
                        PERMISSIONS.ACCOUNTS_TRANSACTIONS_BACKDATE,
                        PERMISSIONS.PAYMENTS_BACKDATE,
                      ])
                        ? dayjs(
                            authOrganization?.organization.recording_start_date
                          )
                        : dayjs().startOf('day')
                    }
                    maxDate={
                      checkOrganizationPermission([
                        PERMISSIONS.ACCOUNTS_TRANSACTIONS_POSTDATE,
                        PERMISSIONS.PAYMENTS_POSTDATE,
                      ])
                        ? dayjs().add(10, 'year').endOf('year')
                        : dayjs().endOf('day')
                    }
                    defaultValue={
                      payment && !isDuplicate
                        ? dayjs(payment.transactionDate)
                        : dayjs()
                    }
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                        InputProps: { readOnly: true },
                        error: !!errors?.transactionDate,
                        helperText: errors?.transactionDate?.message,
                      },
                    }}
                    onChange={(newValue: Dayjs | null) => {
                      setValue(
                        'transactionDate',
                        newValue ? newValue.toISOString() : '',
                        {
                          shouldValidate: true,
                          shouldDirty: true,
                        }
                      );
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <LedgerSelect
                    frontError={errors.credit_ledger_id}
                    addedLedger={addedLedger}
                    defaultValue={
                      ungroupedLedgerOptions.find(
                        (ledger) => ledger.id === payment?.credit_ledger_id
                      ) || null
                    }
                    allowedGroups={[
                      'Current Assets',
                      'Current Liabilities',
                      'Cash and Cash Equivalents',
                      'Banks',
                      'Accounts Payable',
                      'Accounts Receivable',
                    ]}
                    onChange={(newValue: any) => {
                      if (Array.isArray(newValue)) return;
                      applyCurrencyLock(newValue?.currency?.id);
                      setValue('credit_ledger_id', newValue ? newValue.id : 0, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                    label={dictionary.forms.payments.form.labels.payFromCredit}
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
              <Grid size={{ xs: 12, md: 4 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <TextField
                    size='small'
                    label={dictionary.forms.payments.form.labels.reference}
                    fullWidth
                    defaultValue={payment && payment.reference}
                    {...register('reference')}
                    onChange={(e) => {
                      setServerError(null);
                    }}
                  />
                  <span style={{ color: 'red' }}>{serverError?.reference}</span>
                </Div>
              </Grid>
            </>
          )}

          {openLedgerQuickAdd && ledgerType === 'credit' && (
            <Grid size={12}>
              <QuickAddLedger
                toggleOpen={setOpenLedgerQuickAdd}
                ledgerType='credit'
                setAddedLedger={setAddedLedger}
              />
            </Grid>
          )}

          <Grid size={{ xs: 12, md: 4 }} key={prevKey}>
            <Div sx={{ mt: 1, mb: 1 }}>
              <Tooltip
                title={
                  hasItems
                    ? dictionary.forms.payments.form.tooltips.currencyLocked
                    : ''
                }
              >
                <span>
                  <CurrencySelector
                    frontError={
                      errors?.currency_id?.message
                        ? { message: errors.currency_id.message }
                        : null
                    }
                    disabled={!!watch(`form_ledger_currency_id`) || hasItems}
                    defaultValue={watch(`currency_id`) as any}
                    onChange={(newValue) => {
                      setValue('currency_id', newValue ? newValue.id : null, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });

                      clearErrors('exchange_rate');

                      setValue(
                        'exchange_rate',
                        newValue?.exchangeRate ? newValue.exchangeRate : 1
                      );
                    }}
                  />
                </span>
              </Tooltip>
            </Div>
          </Grid>
          {Number(watch('currency_id')) > 1 && (
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label={dictionary.forms.payments.form.labels.exchangeRate}
                  fullWidth
                  size='small'
                  error={!!errors?.exchange_rate}
                  helperText={errors?.exchange_rate?.message}
                  InputProps={{
                    inputComponent: CommaSeparatedField,
                    disabled: !!watch(`form_ledger_currency_id`),
                  }}
                  value={watch('exchange_rate')}
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
          <Grid size={{ xs: 12, md: watch('currency_id') !== 1 ? 4 : 8 }}>
            <Div sx={{ mt: 1, mb: 1 }}>
              <CostCenterSelector
                label={dictionary.forms.payments.form.labels.costCenters}
                frontError={errors.cost_centers}
                defaultValue={watch('cost_centers') || []}
                onChange={(newValue) => {
                  const valueArray = Array.isArray(newValue)
                    ? newValue
                    : newValue
                      ? [newValue]
                      : [];

                  setValue('cost_centers', valueArray, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
              />
            </Div>
          </Grid>
        </Grid>

        <TransactionItemForm
          setClearFormKey={setClearFormKey}
          submitMainForm={handleSubmit((data) => savePayment.mutate(data))}
          submitItemForm={submitItemForm}
          setSubmitItemForm={setSubmitItemForm}
          key={clearFormKey}
          setIsDirty={setIsDirty}
          items={items}
          setItems={setItems as any}
          isPayment={true}
          selectedCurrencyId={watch('currency_id') as any}
          onLedgerCurrencyDetected={(currencyId) =>
            applyCurrencyLock(currencyId)
          }
        />

        {errors?.items?.message && items.length < 1 && (
          <Alert severity='error'>{errors.items.message}</Alert>
        )}

        {items.map((item, index) => (
          <TransactionItemRow
            setClearFormKey={setClearFormKey}
            submitMainForm={handleSubmit((data) => savePayment.mutate(data))}
            submitItemForm={submitItemForm}
            setSubmitItemForm={setSubmitItemForm}
            selectedCurrencyId={watch(`form_ledger_currency_id`)}
            setIsDirty={setIsDirty}
            key={index}
            index={index}
            item={item as any}
            items={items as any}
            setItems={setItems as any}
            isPayment={true}
          />
        ))}

        <Divider />
        <Grid container columnSpacing={1}>
          <Grid
            size={11}
            sx={{
              display: 'flex',
              direction: 'row',
              justifyContent: 'flex-end',
            }}
          >
            <Typography variant={'h5'}>
              {totalAmount?.toLocaleString()}
            </Typography>
          </Grid>
          <Grid size={12}>
            <Div sx={{ mt: 1, mb: 1 }}>
              <TextField
                label={dictionary.forms.payments.form.labels.narration}
                multiline={true}
                rows={2}
                fullWidth
                error={!!errors?.narration}
                helperText={errors?.narration?.message}
                size='small'
                {...register('narration')}
              />
            </Div>
          </Grid>
        </Grid>
        {/* </form> */}

        <ScheduleModeSection
          hidden={!!(payment && !isDuplicate)}
          enabled={scheduleMode}
          onEnabledChange={setScheduleMode}
          form={scheduleForm}
          setForm={setScheduleForm}
          narration={watch('narration')}
        />

        <Dialog open={showWarning} onClose={() => setShowWarning(false)}>
          <DialogTitle>
            <Grid container alignItems='center' justifyContent='space-between'>
              <Grid size={11}>{dictionary.forms.payments.form.dialogs.unsavedChanges.title}</Grid>
              <Grid size={1} textAlign='right'>
                <Tooltip title={dictionary.tooltips.close}>
                  <IconButton
                    size='small'
                    onClick={() => setShowWarning(false)}
                  >
                    <HighlightOff color='primary' />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
          </DialogTitle>
          <DialogContent>{dictionary.forms.payments.form.dialogs.unsavedChanges.message}</DialogContent>
          <DialogActions>
            <Button
              size='small'
              onClick={() => {
                setSubmitItemForm(true);
                setShowWarning(false);
              }}
            >
              {dictionary.forms.payments.form.dialogs.unsavedChanges.addAndSubmit}
            </Button>
            <Button
              size='small'
              onClick={() => handleConfirmSubmitWithoutAdd(watch())}
              color='secondary'
            >
              {dictionary.forms.payments.form.dialogs.unsavedChanges.submitWithoutAdd}
            </Button>
          </DialogActions>
        </Dialog>
      </DialogContent>
      <DialogActions>
        <Button size='small' onClick={() => setOpen(false)}>
          {dictionary.forms.payments.form.buttons.cancel}
        </Button>
        <LoadingButton
          type='submit'
          loading={addPayment.isPending || updatePayment.isPending}
          disabled={scheduleMode && !isScheduleFormComplete(scheduleForm)}
          size='small'
          variant='contained'
          onClick={handleSubmit(onSubmit)}
        >
          {scheduleMode ? dictionary.forms.payments.form.buttons.createSchedule : dictionary.forms.payments.form.buttons.submit}
        </LoadingButton>
      </DialogActions>
    </>
  );
};

export default PaymentFormDialogContent;
