import React, { useContext, useEffect, useState } from 'react';
import { Autocomplete, Grid, IconButton, LinearProgress, TextField, Tooltip } from '@mui/material';
import { useForm } from 'react-hook-form';
import { AddOutlined, CheckOutlined, DisabledByDefault } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { useLedgerSelect } from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import QuickAddLedger from '@/components/accounts/ledgers/forms/QuickAddLedger';
import LedgerGroupProvider from '@/components/accounts/ledgerGroups/LedgerGroupProvider';
import { Ledger } from '@/components/accounts/ledgers/LedgerType';
import { StationFormContext } from '../../SalesShifts';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface LedgerOption {
  id: number;
  name: string;
}

interface PaymentItem {
  id?: number;
  debit_ledger_id?: number;
  credit_ledger_id?: number;
  amount: number;
  narration: string;
}

interface PaymentsReceivedProps {
  setClearFormKey: (value: React.SetStateAction<number>) => void;
  submitMainForm: () => void;
  submitItemForm: boolean;
  setSubmitItemForm: (value: boolean) => void;
  setIsDirty: (value: boolean) => void;
  index?: number;
  setShowForm?: (value: boolean) => void;
  item?: PaymentItem;
  paymentItems: PaymentItem[];
  setPaymentItems: (items: PaymentItem[] | ((prevItems: PaymentItem[]) => PaymentItem[])) => void;
  showWarning: boolean;
  setShowWarning: (val: boolean) => void;
  clearFormKey: number;
}

interface FormValues {
  id?: number;
  debit_ledger?: LedgerOption | null;
  debit_ledger_id?: number | null;
  credit_ledger?: LedgerOption | null;
  credit_ledger_id?: number | null;
  amount: number;
  narration: string;
}

function PaymentsReceived({ 
  setClearFormKey, 
  submitMainForm, 
  submitItemForm, 
  setSubmitItemForm, 
  setIsDirty, 
  index = -1, 
  setShowForm, 
  item, 
  paymentItems = [], 
  setPaymentItems 
}: PaymentsReceivedProps) {
  const dictionary = useDictionary();
  const [isAdding, setIsAdding] = useState(false);
  const [openLedgerQuickAdd, setOpenLedgerQuickAdd] = useState(false);
  const [addedLedger, setAddedLedger] = useState<Ledger | null>(null);
  const { ungroupedLedgerOptions } = useLedgerSelect();
  const contextValue = useContext(StationFormContext) as { activeStation?: { collection_ledgers?: LedgerOption[] } };
  const collection_ledgers: LedgerOption[] = contextValue?.activeStation?.collection_ledgers || [];

  // Define validation schema
  const validationSchema = yup.object().shape({
    debit_ledger_id: yup
      .number()
      .required(dictionary.forms.shifts.validation.debitAccountRequired)
      .positive(dictionary.forms.shifts.validation.debitAccountPositive)
      .typeError(dictionary.forms.shifts.validation.debitAccountRequired)
      .test('unique-ledgers', dictionary.forms.shifts.validation.accountsSame, function (value) {
          return value !== this.parent.credit_ledger_id;
      }),
    credit_ledger_id: yup
      .number()
      .required(dictionary.forms.shifts.validation.creditAccountRequired)
      .positive(dictionary.forms.shifts.validation.creditAccountPositive)
      .typeError(dictionary.forms.shifts.validation.creditAccountRequired)
      .test('unique-ledgers', dictionary.forms.shifts.validation.accountsSame, function (value) {
        return value !== this.parent.debit_ledger_id;
      }),
    narration: yup.string().required(dictionary.forms.shifts.validation.narrationRequired).typeError(dictionary.forms.shifts.validation.narrationRequired),
    amount: yup.number().required(dictionary.forms.shifts.validation.amountRequired).positive(dictionary.forms.shifts.validation.amountGreaterThanZero).typeError(dictionary.forms.shifts.validation.amountNumber),
  });

  const { 
    setValue, 
    handleSubmit, 
    watch, 
    reset, 
    formState: { errors, dirtyFields } 
  } = useForm<FormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: item ? item.id : undefined,
      credit_ledger: item ? ungroupedLedgerOptions.find(option => option.id === item.credit_ledger_id) : null,
      credit_ledger_id: item?.credit_ledger_id,
      debit_ledger: item ? ungroupedLedgerOptions.find(option => option.id === item.debit_ledger_id) : null,
      debit_ledger_id: item?.debit_ledger_id,
      amount: item?.amount || 0,
      narration: item?.narration || '',
    }
  });

  useEffect(() => {
    setIsDirty(Object.keys(dirtyFields).length > 0);
  }, [dirtyFields, setIsDirty, watch]);

  const updateItems = async (formData: FormValues) => {
    setIsAdding(true);
    const newItem: PaymentItem = {
      id: formData.id,
      debit_ledger_id: formData.debit_ledger_id || undefined,
      credit_ledger_id: formData.credit_ledger_id || undefined,
      amount: formData.amount,
      narration: formData.narration
    };

    if (index > -1) {
      // Replace the existing item with the edited item
      const updatedItems = [...paymentItems];
      updatedItems[index] = newItem;
      await setPaymentItems(updatedItems);
      setClearFormKey(prevKey => prevKey + 1);
    } else {
      // Add the new item to the paymentItems array
      await setPaymentItems((prevItems: PaymentItem[]) => [...prevItems, newItem]);
      if (submitItemForm) {
        submitMainForm();
      }
      setSubmitItemForm(false);
      setClearFormKey(prevKey => prevKey + 1);
    }

    reset();
    setAddedLedger(null);
    setIsAdding(false);
    setShowForm && setShowForm(false);
  };

  useEffect(() => {
    if (submitItemForm) {
      handleSubmit(updateItems, () => {
        setSubmitItemForm(false);
      })();
    }
  }, [submitItemForm]);

  useEffect(() => {
    if (addedLedger?.id) {
      setValue('credit_ledger', addedLedger as unknown as LedgerOption);
      setValue('credit_ledger_id', addedLedger.id, {
        shouldValidate: true,
        shouldDirty: true
      });
    }
  }, [addedLedger, setValue]);

  if (isAdding) {
    return <LinearProgress />;
  }

  if (openLedgerQuickAdd) {
    return (
      <LedgerGroupProvider>
        <QuickAddLedger
          toggleOpen={setOpenLedgerQuickAdd}
          ledgerType='credit'
          setAddedLedger={setAddedLedger}
        />
      </LedgerGroupProvider>
    );
  }

  return (
    <Grid container spacing={1} marginTop={0.5}>
      <Grid size={{xs: 12, md: 3}}>
        <Div sx={{ mt: 1 }}>
          <LedgerSelect
            label={dictionary.forms.shifts.labels.paidBy}
            allowedGroups={['Accounts Receivable', 'Accounts Payable']}
            addedLedger={addedLedger}
            value={ungroupedLedgerOptions.find(option => option.id === watch('credit_ledger_id')) || null}
            onChange={(newValue: Ledger | null | Ledger[]) => {
              setValue('credit_ledger', newValue as LedgerOption | null);
              setValue('credit_ledger_id', Array.isArray(newValue) ? newValue[0]?.id : newValue?.id || null, {
                shouldValidate: true,
                shouldDirty: true
              });
            }}
            frontError={errors.credit_ledger_id}
            multiple={false}
            // startAdornment={
            //   <Tooltip title={'Add New Credit'}>
            //     <AddOutlined
            //       onClick={() => setOpenLedgerQuickAdd(true)}
            //       sx={{ cursor: 'pointer' }}
            //     />
            //   </Tooltip>
            // }
          />
        </Div>
      </Grid>
      <Grid size={{xs: 12, md: 3}}>
        <Div sx={{ mt: 1 }}>
          <Autocomplete
            size="small"
            fullWidth
            options={collection_ledgers}
            getOptionLabel={(option) => option.name}
            value={collection_ledgers.find(option => option.id === watch('debit_ledger_id')) || null}
            onChange={(_, newValue) => {
              setValue('debit_ledger', newValue as LedgerOption | null);
              setValue('debit_ledger_id', newValue ? newValue.id : null, {
                shouldValidate: true,
                shouldDirty: true
              });
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={dictionary.forms.shifts.labels.paidTo}
                error={!!errors.debit_ledger_id}
                helperText={errors.debit_ledger_id?.message}
              />
            )}
            isOptionEqualToValue={(option, value) => option.id === value.id}
          />
        </Div>
      </Grid>

      <Grid size={{xs: 12, md: 3}}>
        <Div sx={{ mt: 1 }}>
          <TextField
            size="small"
            fullWidth
            defaultValue={watch('narration')}
            label={dictionary.forms.shifts.labels.narration}
            error={!!errors.narration}
            helperText={errors.narration?.message}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setValue('narration', e.target.value || '', {
                shouldValidate: true,
                shouldDirty: true
              });
            }}
          />
        </Div>
      </Grid>

      <Grid size={{xs: 12, md: 3}}>
        <Div sx={{ mt: 1 }}>
          <TextField
            label={dictionary.forms.shifts.labels.amount}
            fullWidth
            size='small'
            value={watch('amount')}
            error={!!errors.amount}
            helperText={errors.amount?.message}
            InputProps={{
              inputComponent: CommaSeparatedField,
            }}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const value = sanitizedNumber(e.target.value);
              setValue('amount', value, { shouldValidate: true, shouldDirty: true });
            }}
          />
        </Div>
      </Grid>

      <Grid size={12} textAlign={'end'}>
        <LoadingButton
          loading={false}
          variant='contained'
          size='small'
          onClick={handleSubmit(updateItems)}
          sx={{ marginBottom: 0.5 }}
        >
          {item ? (
            <><CheckOutlined fontSize='small' /> {dictionary.forms.shifts.buttons.done}</>
          ) : (
            <><AddOutlined fontSize='small' /> {dictionary.forms.shifts.buttons.add}</>
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

export default PaymentsReceived;