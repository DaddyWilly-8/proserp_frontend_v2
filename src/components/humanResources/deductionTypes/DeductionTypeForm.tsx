'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import LedgerGroupProvider from '@/components/accounts/ledgerGroups/LedgerGroupProvider';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import { useLedgerSelect } from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import QuickAddLedger from '@/components/accounts/ledgers/forms/QuickAddLedger';
import { MODULES } from '@/utilities/constants/modules';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { AddOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  MenuItem,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import humanResourcesServices from '../humanResourcesServices';
import { DeductionType } from './DeductionType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface DeductionTypeFormProps {
  setOpenDialog: (open: boolean) => void;
  deductionType?: DeductionType | null;
}

interface FormData extends Omit<DeductionType, 'id' | 'created_by'> {
  id?: number;
  apply_to_employees?: 'none' | 'all' | 'active_contracts';
  force_update?: boolean;
}

interface ApiResponse {
  message: string;
  validation_errors?: Record<string, string[] | string>;
  would_update?: number;
  would_create?: number;
}

interface Ledger {
  id: number;
  name: string;
  code: string | null;
  ledger_group_id: number;
  alias: string | null;
  nature_id?: number;
}

const getValidationMessage = (
  validationErrors: Record<string, string[] | string> | undefined,
  field: string
) => {
  const message = validationErrors?.[field];
  if (!message) return undefined;
  return Array.isArray(message) ? message[0] : message;
};

const formatCommaSeparatedValue = (
  value: string | number | null | undefined
) => {
  if (value === null || value === undefined || value === '') return '';
  const raw = String(value).replace(/,/g, '');
  if (!/^\d*\.?\d*$/.test(raw)) return '';

  const hasDecimal = raw.includes('.');
  const [intPart, decimalPart = ''] = raw.split('.');

  const formattedInt = intPart ? Number(intPart).toLocaleString('en-US') : '0';

  if (!hasDecimal) return formattedInt;
  return `${formattedInt}.${decimalPart}`;
};

const DeductionTypeForm = ({
  setOpenDialog,
  deductionType = null,
}: DeductionTypeFormProps) => {
  const dictionary = useDictionary();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { ungroupedLedgerOptions } = useLedgerSelect();
  const { organizationHasSubscribed, checkOrganizationPermission } =
    useJumboAuth();
  const orgHasSubscribedAccountsAndFinance = organizationHasSubscribed(
    MODULES.ACCOUNTS_AND_FINANCE
  );
  const [recentlyAddedPayableLedger, setRecentlyAddedPayableLedger] =
    useState<Ledger | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    data: FormData | null;
    wouldUpdate: number;
    wouldCreate: number;
  }>({
    open: false,
    data: null,
    wouldUpdate: 0,
    wouldCreate: 0,
  });

  const [openQuickAddLedger, setOpenQuickAddLedger] = useState(false);
  const [ledgertType, setLedgertType] = useState<'credit' | 'debit'>('credit');

  const defaultValue = useMemo(() => {
    return ungroupedLedgerOptions.find(
      (ledger) => ledger.id === deductionType?.payable_ledger_id
    );
  }, [deductionType, ungroupedLedgerOptions]);

  useEffect(() => {
    if (defaultValue) setRecentlyAddedPayableLedger(defaultValue);
  }, [defaultValue]);

  const {
    mutate: addDeductionType,
    isPending,
    error,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.addDeductionType,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar(dictionary.humanResources.deductionTypes.form.messages.addSuccess, {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['deductionTypes'] });
    },
    onError: (mutationError) => {
      handleErrorResponse(mutationError);
    },
  });

  const {
    mutate: updateDeductionType,
    isPending: updateIsPending,
    error: updateError,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.updateDeductionType,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar(dictionary.humanResources.deductionTypes.form.messages.updateSuccess, {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['deductionTypes'] });
    },
    onError: (mutationError) => {
      handleErrorResponse(mutationError);
    },
  });

  const handleErrorResponse = (mutationError: any) => {
    const responseData = mutationError?.response?.data;

    // Check if this is a bulk update confirmation error
    if (
      responseData?.would_update !== undefined ||
      responseData?.would_create !== undefined
    ) {
      setConfirmDialog({
        open: true,
        data: mutationError?.config?.data
          ? JSON.parse(mutationError.config.data)
          : null,
        wouldUpdate: responseData.would_update || 0,
        wouldCreate: responseData.would_create || 0,
      });
      return;
    }

    // let message = 'Something went wrong';
    // if (
    //   typeof mutationError === 'object' &&
    //   mutationError !== null &&
    //   'response' in mutationError &&
    //   typeof (mutationError as any).response?.data?.message === 'string'
    // ) {
    //   message = (mutationError as any).response.data.message;
    // } else if (mutationError instanceof Error) {
    //   message = mutationError.message;
    // }
    enqueueSnackbar(getErrorMessage(mutationError), { variant: 'error' });
  };

  const handleConfirmBulkUpdate = () => {
    if (confirmDialog.data) {
      const dataWithForce = {
        ...confirmDialog.data,
        force_update: true,
      };
      saveMutation(dataWithForce);
    }
    setConfirmDialog({
      open: false,
      data: null,
      wouldUpdate: 0,
      wouldCreate: 0,
    });
  };

  const handleCancelBulkUpdate = () => {
    setConfirmDialog({
      open: false,
      data: null,
      wouldUpdate: 0,
      wouldCreate: 0,
    });
  };

  const validationSchema = yup.object({
    id: yup.number().optional(),
    name: yup
      .string()
      .required(dictionary.humanResources.deductionTypes.form.validation.nameRequired)
      .max(255, dictionary.humanResources.deductionTypes.form.validation.nameMax),
    code: yup.string().max(50, dictionary.humanResources.deductionTypes.form.validation.codeMax),
    category: yup
      .string()
      .oneOf(['statutory', 'voluntary'])
      .required(dictionary.humanResources.deductionTypes.form.validation.categoryRequired),
    computation_method: yup
      .string()
      .oneOf(['fixed', 'percentage_of_basic', 'percentage_of_gross'])
      .required(dictionary.humanResources.deductionTypes.form.validation.methodRequired),
    default_value: yup
      .number()
      .typeError(dictionary.humanResources.deductionTypes.form.validation.defaultValueNumber)
      .required(dictionary.humanResources.deductionTypes.form.validation.defaultValueRequired)
      .min(0, dictionary.humanResources.deductionTypes.form.validation.defaultValueMin),
    // ABSENT_DEDUCTION always has somewhere to post even unmapped — an
    // unmapped ledger falls back to the department/fallback Salary Expense
    // account at posting time (see PayrollPostingService::post()) — so it's
    // the one type this is never required for.
    payable_ledger_id:
      orgHasSubscribedAccountsAndFinance &&
      deductionType?.code !== 'ABSENT_DEDUCTION'
        ? yup
            .number()
            .required(dictionary.humanResources.deductionTypes.form.validation.fieldRequired)
            .positive(dictionary.humanResources.deductionTypes.form.validation.fieldRequired)
        : yup.number().nullable(),
    is_pre_tax: yup.boolean().required(),
    description: yup
      .string()
      .max(500, dictionary.humanResources.deductionTypes.form.validation.descriptionMax),
    apply_to_employees: yup
      .string()
      .oneOf(['none', 'all', 'active_contracts'])
      .optional(),
  });

  const {
    register,
    setValue,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: deductionType?.id,
      name: deductionType?.name || '',
      code: deductionType?.code || '',
      category: deductionType?.category || 'statutory',
      computation_method: deductionType?.computation_method || 'fixed',
      default_value: deductionType?.default_value ?? 0,
      payable_ledger_id: deductionType?.payable_ledger_id ?? undefined,
      is_pre_tax: deductionType?.is_pre_tax || false,
      description: deductionType?.description || '',
      apply_to_employees: 'none',
    },
  });

  const applyScope = watch('apply_to_employees');
  // Two codes don't fit the default "this ledger is a payable" assumption,
  // so each needs its own label and allowed ledger group, or it's impossible
  // to map correctly:
  // - "Staff Loan Repayment" (STAFF_LOAN): the ledger is a receivable (money
  //   owed TO the company by employees), not a payable.
  // - "Absence Deduction" (ABSENT_DEDUCTION): nothing is owed to anyone at
  //   all — the deducted amount was simply never earned, so the ledger here
  //   is the Salary Expense account it gets credited back into (shrinking
  //   the expense), not a payable.
  const watchedCode = watch('code');
  const isStaffLoanRepayment = watchedCode === 'STAFF_LOAN';
  const isAbsenceDeduction = watchedCode === 'ABSENT_DEDUCTION';
  // These codes are how PayrollService/PayrollPostingService/LoanService
  // recognize a type — editing its name/code/category/computation
  // method/default value/pre-tax flag would silently change payroll
  // behavior (or break the match entirely). Only reachable when editing an
  // existing one of these; the backend enforces the same restriction
  // regardless of what the form submits. Only the ledger and description
  // stay editable — see the "Apply To Employees" section too, which is
  // hidden below since these types aren't standing per-employee deductions.
  const isReservedType =
    !!deductionType?.id &&
    ['STAFF_LOAN', 'ABSENT_DEDUCTION', 'SALARY_ADVANCE'].includes(
      watchedCode || ''
    );

  useEffect(() => {
    reset({
      id: deductionType?.id,
      name: deductionType?.name || '',
      code: deductionType?.code || '',
      category: deductionType?.category || 'statutory',
      computation_method: deductionType?.computation_method || 'fixed',
      default_value: deductionType?.default_value ?? 0,
      payable_ledger_id: deductionType?.payable_ledger_id ?? 0,
      is_pre_tax: deductionType?.is_pre_tax || false,
      description: deductionType?.description || '',
      apply_to_employees: 'none',
    });
  }, [deductionType, reset]);

  const saveMutation = useMemo(() => {
    return deductionType?.id ? updateDeductionType : addDeductionType;
  }, [deductionType?.id, updateDeductionType, addDeductionType]);

  const validationErrors =
    error?.response?.data?.validation_errors ||
    updateError?.response?.data?.validation_errors;

  const onSubmit = (data: FormData) => {
    saveMutation(data);
  };

  return (
    <>
      <DialogTitle>
        <Grid size={12} textAlign={'center'}>
          {!deductionType?.id
            ? dictionary.humanResources.deductionTypes.form.titles.add
            : dictionary.humanResources.deductionTypes.form.titles.edit}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          {isReservedType && (
            <Alert severity='info' sx={{ mb: 2 }}>
              {dictionary.humanResources.deductionTypes.form.helpers.reservedAlert}
            </Alert>
          )}
          <Grid container rowSpacing={{ xs: 1, md: 2 }} spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1 }}>
                <TextField
                  label={dictionary.humanResources.deductionTypes.form.labels.name}
                  size='small'
                  fullWidth
                  disabled={isReservedType}
                  error={
                    !!errors?.name ||
                    !!getValidationMessage(validationErrors, 'name')
                  }
                  helperText={
                    errors.name?.message ||
                    getValidationMessage(validationErrors, 'name')
                  }
                  {...register('name')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1 }}>
                <TextField
                  label={dictionary.humanResources.deductionTypes.form.labels.code}
                  size='small'
                  fullWidth
                  disabled={isReservedType}
                  error={
                    !!errors?.code ||
                    !!getValidationMessage(validationErrors, 'code')
                  }
                  helperText={
                    errors.code?.message ||
                    getValidationMessage(validationErrors, 'code')
                  }
                  {...register('code')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1 }}>
                <Controller
                  name='category'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      select
                      label={dictionary.humanResources.deductionTypes.form.labels.category}
                      size='small'
                      fullWidth
                      disabled={isReservedType}
                      value={field.value}
                      onChange={field.onChange}
                      error={
                        !!errors?.category ||
                        !!getValidationMessage(validationErrors, 'category')
                      }
                      helperText={
                        errors.category?.message ||
                        getValidationMessage(validationErrors, 'category')
                      }
                    >
                      <MenuItem value='statutory'>
                        {dictionary.humanResources.deductionTypes.form.options.statutory}
                      </MenuItem>
                      <MenuItem value='voluntary'>
                        {dictionary.humanResources.deductionTypes.form.options.voluntary}
                      </MenuItem>
                    </TextField>
                  )}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1 }}>
                <Controller
                  name='computation_method'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      select
                      label={dictionary.humanResources.deductionTypes.form.labels.computationMethod}
                      size='small'
                      fullWidth
                      disabled={isReservedType}
                      value={field.value}
                      onChange={field.onChange}
                      error={
                        !!errors?.computation_method ||
                        !!getValidationMessage(
                          validationErrors,
                          'computation_method'
                        )
                      }
                      helperText={
                        errors.computation_method?.message ||
                        getValidationMessage(
                          validationErrors,
                          'computation_method'
                        )
                      }
                    >
                      <MenuItem value='fixed'>{dictionary.humanResources.deductionTypes.form.options.fixed}</MenuItem>
                      <MenuItem value='percentage_of_basic'>
                        {dictionary.humanResources.deductionTypes.form.options.percentageOfBasic}
                      </MenuItem>
                      <MenuItem value='percentage_of_gross'>
                        {dictionary.humanResources.deductionTypes.form.options.percentageOfGross}
                      </MenuItem>
                    </TextField>
                  )}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1 }}>
                <Controller
                  name='default_value'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      label={dictionary.humanResources.deductionTypes.form.labels.defaultValue}
                      size='small'
                      fullWidth
                      disabled={isReservedType}
                      value={formatCommaSeparatedValue(field.value)}
                      onChange={(event) => {
                        const raw = event.target.value.replace(/,/g, '');
                        if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
                          field.onChange(raw);
                        }
                      }}
                      // inputProps={{
                      //   inputMode: 'decimal',
                      //   pattern: '^\\d*\\.?\\d*$',
                      // }}
                      error={
                        !!errors?.default_value ||
                        !!getValidationMessage(
                          validationErrors,
                          'default_value'
                        )
                      }
                      helperText={
                        errors.default_value?.message ||
                        getValidationMessage(validationErrors, 'default_value')
                      }
                    />
                  )}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1 }}>
                <Controller
                  name='is_pre_tax'
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(field.value)}
                          disabled={isReservedType}
                          onChange={(event) =>
                            field.onChange(event.target.checked)
                          }
                        />
                      }
                      label={dictionary.humanResources.deductionTypes.form.labels.isPreTax}
                    />
                  )}
                />
              </Div>
            </Grid>

            {orgHasSubscribedAccountsAndFinance && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Div sx={{ my: 1 }}>
                  <LedgerSelect
                    label={
                      isStaffLoanRepayment
                        ? dictionary.humanResources.deductionTypes.form.labels.receivableLedger
                        : isAbsenceDeduction
                          ? dictionary.humanResources.deductionTypes.form.labels.expenseLedger
                          : dictionary.humanResources.deductionTypes.form.labels.payableLedger
                    }
                    allowedGroups={
                      isStaffLoanRepayment
                        ? ['Current Assets']
                        : isAbsenceDeduction
                          ? ['Liabilities']
                          // Plain "Payable Ledger" — most deductions post to a
                          // liability (money owed to a third party), but some
                          // organizations route a deduction straight to an
                          // asset ledger instead (e.g. a clearing/suspense
                          // account), so both groups are offered here.
                          // "Liabilities" (not just Current Liabilities) so
                          // every descendant is selectable — Long Term
                          // Liabilities, Loans, etc. — same scope as the
                          // backend's payable-ledger resolution.
                          : ['Liabilities', 'Current Assets']
                    }
                    frontError={errors.payable_ledger_id}
                    key={
                      isStaffLoanRepayment
                        ? 'account-receivable-ledger'
                        : isAbsenceDeduction
                          ? 'expense-ledger'
                          : 'account-payable-ledger'
                    }
                    value={recentlyAddedPayableLedger || undefined}
                    defaultValue={
                      deductionType?.payable_ledger || defaultValue || undefined
                    }
                    onChange={(newValue) => {
                      if (newValue && !Array.isArray(newValue)) {
                        setRecentlyAddedPayableLedger(newValue);
                        setValue('payable_ledger_id', newValue.id, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      } else {
                        setRecentlyAddedPayableLedger(null);
                        setValue('payable_ledger_id', undefined, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }
                    }}
                    startAdornment={
                      checkOrganizationPermission(
                        PERMISSIONS.ACCOUNTS_MASTERS_CREATE
                      ) && (
                        <Tooltip
                          title={dictionary.tooltips.quickAddLedger}
                          onClick={() => {
                            setLedgertType('credit');
                            setOpenQuickAddLedger(true);
                          }}
                        >
                          <AddOutlined sx={{ cursor: 'pointer' }} />
                        </Tooltip>
                      )
                    }
                  />
                  {isStaffLoanRepayment && (
                    <Typography
                      variant='caption'
                      color='text.secondary'
                      sx={{ display: 'block', mt: 0.5 }}
                    >
                      {dictionary.humanResources.deductionTypes.form.helpers.staffLoan}
                    </Typography>
                  )}
                  {isAbsenceDeduction && (
                    <Typography
                      variant='caption'
                      color='text.secondary'
                      sx={{ display: 'block', mt: 0.5 }}
                    >
                      {dictionary.humanResources.deductionTypes.form.helpers.absence}
                    </Typography>
                  )}
                </Div>
              </Grid>
            )}

            {/* Apply To Employees Dropdown — doesn't apply to reserved types:
                their amounts are computed per period (loan installments,
                absence hours, advance recovery), not a flat default_value
                assigned to employees. */}
            {!isReservedType && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Div sx={{ mt: 1 }}>
                  <Controller
                    name='apply_to_employees'
                    control={control}
                    render={({ field }) => (
                      <TextField
                        select
                        label={dictionary.humanResources.deductionTypes.form.labels.applyToEmployees}
                        size='small'
                        fullWidth
                        value={field.value || 'none'}
                        onChange={field.onChange}
                        helperText={
                          applyScope !== 'none'
                            ? dictionary.humanResources.deductionTypes.form.helpers.applyAll
                            : dictionary.humanResources.deductionTypes.form.helpers.applyNone
                        }
                      >
                        <MenuItem value='none'>{dictionary.humanResources.deductionTypes.form.options.none}</MenuItem>
                        <MenuItem value='all'>
                          {dictionary.humanResources.deductionTypes.form.options.allEmployees}
                        </MenuItem>
                        <MenuItem value='active_contracts'>
                          {dictionary.humanResources.deductionTypes.form.options.activeContracts}
                        </MenuItem>
                      </TextField>
                    )}
                  />
                </Div>
              </Grid>
            )}

            <Grid size={{ xs: 12 }}>
              <Div sx={{ mt: 1 }}>
                <TextField
                  label={dictionary.humanResources.deductionTypes.form.labels.description}
                  size='small'
                  fullWidth
                  multiline
                  minRows={2}
                  error={
                    !!errors?.description ||
                    !!getValidationMessage(validationErrors, 'description')
                  }
                  helperText={
                    errors.description?.message ||
                    getValidationMessage(validationErrors, 'description')
                  }
                  {...register('description')}
                />
              </Div>
            </Grid>
          </Grid>

          <DialogActions>
            <Button size='small' onClick={() => setOpenDialog(false)}>
              {dictionary.humanResources.deductionTypes.form.buttons.cancel}
            </Button>
            <LoadingButton
              type='submit'
              variant='contained'
              size='small'
              sx={{ display: 'flex' }}
              loading={isPending || updateIsPending}
            >
              {dictionary.humanResources.deductionTypes.form.buttons.submit}
            </LoadingButton>
          </DialogActions>
        </form>
      </DialogContent>

      {/* Confirmation Dialog for Bulk Update */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCancelBulkUpdate}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>
          <Typography variant='h6' fontWeight={600}>
            {dictionary.humanResources.deductionTypes.form.titles.confirmBulk}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            {dictionary.humanResources.deductionTypes.form.bulk.intro}
          </Typography>
          <Grid container spacing={1}>
            <Grid size={12}>
              <Typography variant='body2'>
                <strong>{dictionary.humanResources.deductionTypes.form.bulk.willUpdate}</strong>{' '}
                {dictionary.humanResources.deductionTypes.form.bulk.employeesCount.replace(
                  '{count}',
                  String(confirmDialog.wouldUpdate)
                )}
                {confirmDialog.wouldUpdate > 0 && (
                  <Typography
                    variant='caption'
                    display='block'
                    color='text.secondary'
                  >
                    {dictionary.humanResources.deductionTypes.form.bulk.updateNote}
                  </Typography>
                )}
              </Typography>
            </Grid>
            <Grid size={12}>
              <Typography variant='body2'>
                <strong>{dictionary.humanResources.deductionTypes.form.bulk.willCreate}</strong>{' '}
                {dictionary.humanResources.deductionTypes.form.bulk.newEmployeesCount.replace(
                  '{count}',
                  String(confirmDialog.wouldCreate)
                )}
                {confirmDialog.wouldCreate > 0 && (
                  <Typography
                    variant='caption'
                    display='block'
                    color='text.secondary'
                  >
                    {dictionary.humanResources.deductionTypes.form.bulk.createNote}
                  </Typography>
                )}
              </Typography>
            </Grid>
          </Grid>
          <Typography variant='body2' color='warning.main' sx={{ mt: 2 }}>
            {dictionary.humanResources.deductionTypes.form.bulk.warning}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelBulkUpdate} variant='outlined'>
            {dictionary.humanResources.deductionTypes.form.buttons.cancel}
          </Button>
          <Button
            onClick={handleConfirmBulkUpdate}
            variant='contained'
            color='warning'
          >
            {dictionary.humanResources.deductionTypes.form.buttons.continue}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ledger quick add dialog */}
      <Dialog open={openQuickAddLedger} maxWidth={'md'}>
        <LedgerGroupProvider>
          <QuickAddLedger
            ledgerType={ledgertType}
            toggleOpen={setOpenQuickAddLedger}
            heading={dictionary.humanResources.deductionTypes.form.titles.quickAddLedger}
            setAddedLedger={(v) => {
              if (ledgertType === 'credit') {
                setRecentlyAddedPayableLedger(v);
                setValue('payable_ledger_id', v.id, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }
            }}
          />
        </LedgerGroupProvider>
      </Dialog>
    </>
  );
};

export default DeductionTypeForm;
