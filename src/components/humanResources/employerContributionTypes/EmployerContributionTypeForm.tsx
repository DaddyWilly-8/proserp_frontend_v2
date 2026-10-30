'use client';

import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
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
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
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
import { EmployerContributionType } from './EmployerContributionType';

interface EmployerContributionTypeFormProps {
  setOpenDialog: (open: boolean) => void;
  contributionType?: EmployerContributionType | null;
}

interface FormData extends Omit<EmployerContributionType, 'id' | 'created_by'> {
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

const EmployerContributionTypeForm = ({
  setOpenDialog,
  contributionType = null,
}: EmployerContributionTypeFormProps) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const dictionary = useDictionary();
  const { ungroupedLedgerOptions } = useLedgerSelect();
  const { organizationHasSubscribed, checkOrganizationPermission } =
    useJumboAuth();
  const orgHasSubscribedAccountsAndFinance = organizationHasSubscribed(
    MODULES.ACCOUNTS_AND_FINANCE
  );

  const [recentlyAddedPayableLedger, setRecentlyAddedPayableLedger] =
    useState<Ledger | null>(null);

  const [recentlyAddedExpenseLedger, setRecentlyAddedExpenseLedger] =
    useState<Ledger | null>(null);

  const [openQuickAddLedger, setOpenQuickAddLedger] = useState(false);
  const [ledgertType, setLedgertType] = useState<'credit' | 'debit'>('credit');

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

  const defaultExpenseValue = useMemo(() => {
    return ungroupedLedgerOptions.find(
      (ledger) => ledger.id === contributionType?.expense_ledger_id
    );
  }, [contributionType, ungroupedLedgerOptions]);

  const defaultPayableValue = useMemo(() => {
    return ungroupedLedgerOptions.find(
      (ledger) => ledger.id === contributionType?.payable_ledger_id
    );
  }, [contributionType, ungroupedLedgerOptions]);

  useEffect(() => {
    if (defaultPayableValue) setRecentlyAddedPayableLedger(defaultPayableValue);
    if (defaultExpenseValue) setRecentlyAddedExpenseLedger(defaultExpenseValue);
  }, [defaultPayableValue, defaultExpenseValue]);

  const {
    mutate: addEmployerContributionType,
    isPending,
    error,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.addEmployerContributionType,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar(dictionary.humanResources.employerContributionTypes.form.messages.addSuccess, {
        variant: 'success',
      });
      queryClient.invalidateQueries({
        queryKey: ['employerContributionTypes'],
      });
    },
    onError: (mutationError) => {
      handleErrorResponse(mutationError);
    },
  });

  const {
    mutate: updateEmployerContributionType,
    isPending: updateIsPending,
    error: updateError,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.updateEmployerContributionType,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar(dictionary.humanResources.employerContributionTypes.form.messages.updateSuccess, {
        variant: 'success',
      });
      queryClient.invalidateQueries({
        queryKey: ['employerContributionTypes'],
      });
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

    let message = getErrorMessage(mutationError);
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
    enqueueSnackbar(message, { variant: 'error' });
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
      .required(dictionary.humanResources.employerContributionTypes.form.validation.nameRequired)
      .max(255, dictionary.humanResources.employerContributionTypes.form.validation.nameMax),
    code: yup.string().max(50, dictionary.humanResources.employerContributionTypes.form.validation.codeMax),
    category: yup
      .string()
      .oneOf(['statutory', 'voluntary'])
      .required(dictionary.humanResources.employerContributionTypes.form.validation.categoryRequired),
    computation_method: yup
      .string()
      .oneOf(['fixed', 'percentage_of_basic', 'percentage_of_gross'])
      .required(dictionary.humanResources.employerContributionTypes.form.validation.methodRequired),
    payable_ledger_id: orgHasSubscribedAccountsAndFinance
      ? yup
          .number()
          .required(dictionary.humanResources.employerContributionTypes.form.validation.fieldRequired)
          .positive(dictionary.humanResources.employerContributionTypes.form.validation.fieldRequired)
      : yup.number().nullable(),
    expense_ledger_id: orgHasSubscribedAccountsAndFinance
      ? yup
          .number()
          .required(dictionary.humanResources.employerContributionTypes.form.validation.fieldRequired)
          .positive(dictionary.humanResources.employerContributionTypes.form.validation.fieldRequired)
      : yup.number().nullable(),
    description: yup
      .string()
      .max(500, dictionary.humanResources.employerContributionTypes.form.validation.descriptionMax),
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
      id: contributionType?.id,
      name: contributionType?.name || '',
      code: contributionType?.code || '',
      category: contributionType?.category || 'statutory',
      computation_method: contributionType?.computation_method || 'fixed',
      default_value: contributionType?.default_value ?? 0,
      payable_ledger_id: contributionType?.payable_ledger_id ?? undefined,
      expense_ledger_id: contributionType?.expense_ledger_id ?? undefined,
      description: contributionType?.description || '',
      apply_to_employees: 'none',
    },
  });

  const applyScope = watch('apply_to_employees');

  useEffect(() => {
    reset({
      id: contributionType?.id,
      name: contributionType?.name || '',
      code: contributionType?.code || '',
      category: contributionType?.category || 'statutory',
      computation_method: contributionType?.computation_method || 'fixed',
      default_value: contributionType?.default_value ?? 0,
      expense_ledger_id: contributionType?.expense_ledger_id ?? undefined,
      payable_ledger_id: contributionType?.payable_ledger_id ?? undefined,
      description: contributionType?.description || '',
      apply_to_employees: 'none',
    });
  }, [contributionType, reset]);

  const saveMutation = useMemo(() => {
    return contributionType?.id
      ? updateEmployerContributionType
      : addEmployerContributionType;
  }, [
    contributionType?.id,
    updateEmployerContributionType,
    addEmployerContributionType,
  ]);

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
          {!contributionType?.id
            ? dictionary.humanResources.employerContributionTypes.form.titles.add
            : dictionary.humanResources.employerContributionTypes.form.titles.edit}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <Grid container rowSpacing={{ xs: 1, md: 2 }} spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label={dictionary.humanResources.employerContributionTypes.form.labels.name}
                  size='small'
                  fullWidth
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
            <Grid size={{ xs: 12, md: 3 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label={dictionary.humanResources.employerContributionTypes.form.labels.code}
                  size='small'
                  fullWidth
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

            <Grid size={{ xs: 12, md: 3 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='category'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      select
                      label={dictionary.humanResources.employerContributionTypes.form.labels.category}
                      size='small'
                      fullWidth
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
                        {dictionary.humanResources.employerContributionTypes.form.options.statutory}
                      </MenuItem>
                      <MenuItem value='voluntary'>
                        {dictionary.humanResources.employerContributionTypes.form.options.voluntary}
                      </MenuItem>
                    </TextField>
                  )}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='computation_method'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      select
                      label={dictionary.humanResources.employerContributionTypes.form.labels.computationMethod}
                      size='small'
                      fullWidth
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
                      <MenuItem value='fixed'>{dictionary.humanResources.employerContributionTypes.form.options.fixed}</MenuItem>
                      <MenuItem value='percentage_of_basic'>
                        {dictionary.humanResources.employerContributionTypes.form.options.percentageOfBasic}
                      </MenuItem>
                      <MenuItem value='percentage_of_gross'>
                        {dictionary.humanResources.employerContributionTypes.form.options.percentageOfGross}
                      </MenuItem>
                    </TextField>
                  )}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='default_value'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      label={dictionary.humanResources.employerContributionTypes.form.labels.defaultValue}
                      size='small'
                      fullWidth
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

            {orgHasSubscribedAccountsAndFinance && (
              <>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Div sx={{ my: 1 }}>
                    <LedgerSelect
                      label={
                        dictionary.productCategories.form.labels.expenseLedger
                      }
                      allowedGroups={['Expenses']}
                      frontError={errors.expense_ledger_id}
                      key={'expense-ledger'}
                      value={recentlyAddedExpenseLedger || undefined}
                      defaultValue={
                        contributionType?.expense_ledger ||
                        defaultExpenseValue ||
                        undefined
                      }
                      onChange={(newValue) => {
                        if (newValue && !Array.isArray(newValue)) {
                          setRecentlyAddedExpenseLedger(newValue);
                          setValue('expense_ledger_id', newValue.id, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                        } else {
                          setRecentlyAddedExpenseLedger(null);
                          setValue('expense_ledger_id', undefined, {
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
                              setLedgertType('debit');
                              setOpenQuickAddLedger(true);
                            }}
                          >
                            <AddOutlined sx={{ cursor: 'pointer' }} />
                          </Tooltip>
                        )
                      }
                    />
                  </Div>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Div sx={{ my: 1 }}>
                    <LedgerSelect
                      label={dictionary.humanResources.employerContributionTypes.form.labels.payableLedger}
                      allowedGroups={['Liabilities']}
                      frontError={errors.payable_ledger_id}
                      key={'account-payable-ledger'}
                      value={recentlyAddedPayableLedger || undefined}
                      defaultValue={
                        contributionType?.payable_ledger ||
                        defaultPayableValue ||
                        undefined
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
                  </Div>
                </Grid>
              </>
            )}
            {/* Apply To Employees Dropdown */}
            <Grid size={{ xs: 12, md: 12 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='apply_to_employees'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      select
                      label={dictionary.humanResources.employerContributionTypes.form.labels.applyToEmployees}
                      size='small'
                      fullWidth
                      value={field.value || 'none'}
                      onChange={field.onChange}
                      helperText={
                        applyScope !== 'none'
                          ? dictionary.humanResources.employerContributionTypes.form.helpers.applyAll
                          : dictionary.humanResources.employerContributionTypes.form.helpers.applyNone
                      }
                    >
                      <MenuItem value='none'>{dictionary.humanResources.employerContributionTypes.form.options.none}</MenuItem>
                      <MenuItem value='all'>
                        {dictionary.humanResources.employerContributionTypes.form.options.allEmployees}
                      </MenuItem>
                      <MenuItem value='active_contracts'>
                        {dictionary.humanResources.employerContributionTypes.form.options.activeContracts}
                      </MenuItem>
                    </TextField>
                  )}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label={dictionary.humanResources.employerContributionTypes.form.labels.description}
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
              {dictionary.humanResources.employerContributionTypes.form.buttons.cancel}
            </Button>
            <LoadingButton
              type='submit'
              variant='contained'
              size='small'
              sx={{ display: 'flex' }}
              loading={isPending || updateIsPending}
            >
              {dictionary.humanResources.employerContributionTypes.form.buttons.submit}
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
            {dictionary.humanResources.employerContributionTypes.form.titles.confirmBulk}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            {dictionary.humanResources.employerContributionTypes.form.bulk.intro}
          </Typography>
          <Grid container spacing={1}>
            <Grid size={12}>
              <Typography variant='body2'>
                <strong>{dictionary.humanResources.employerContributionTypes.form.bulk.willUpdate}</strong>{' '}
                {dictionary.humanResources.employerContributionTypes.form.bulk.employeesCount.replace(
                  '{count}',
                  String(confirmDialog.wouldUpdate)
                )}
                {confirmDialog.wouldUpdate > 0 && (
                  <Typography
                    variant='caption'
                    display='block'
                    color='text.secondary'
                  >
                    {dictionary.humanResources.employerContributionTypes.form.bulk.updateNote}
                  </Typography>
                )}
              </Typography>
            </Grid>
            <Grid size={12}>
              <Typography variant='body2'>
                <strong>{dictionary.humanResources.employerContributionTypes.form.bulk.willCreate}</strong>{' '}
                {dictionary.humanResources.employerContributionTypes.form.bulk.newEmployeesCount.replace(
                  '{count}',
                  String(confirmDialog.wouldCreate)
                )}
                {confirmDialog.wouldCreate > 0 && (
                  <Typography
                    variant='caption'
                    display='block'
                    color='text.secondary'
                  >
                    {dictionary.humanResources.employerContributionTypes.form.bulk.createNote}
                  </Typography>
                )}
              </Typography>
            </Grid>
          </Grid>
          <Typography variant='body2' color='warning.main' sx={{ mt: 2 }}>
            {dictionary.humanResources.employerContributionTypes.form.bulk.warning}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelBulkUpdate} variant='outlined'>
            {dictionary.humanResources.employerContributionTypes.form.buttons.cancel}
          </Button>
          <Button
            onClick={handleConfirmBulkUpdate}
            variant='contained'
            color='warning'
          >
            {dictionary.humanResources.employerContributionTypes.form.buttons.continue}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ledger quick add dialog */}
      <Dialog open={openQuickAddLedger} maxWidth={'md'}>
        <LedgerGroupProvider>
          <QuickAddLedger
            ledgerType={ledgertType}
            toggleOpen={setOpenQuickAddLedger}
            heading={dictionary.humanResources.employerContributionTypes.form.titles.quickAddLedger}
            setAddedLedger={(v) => {
              if (ledgertType === 'credit') {
                setRecentlyAddedPayableLedger(v);
                setValue('payable_ledger_id', v.id, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              } else {
                setRecentlyAddedExpenseLedger(v);
                setValue('expense_ledger_id', v.id, {
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

export default EmployerContributionTypeForm;
