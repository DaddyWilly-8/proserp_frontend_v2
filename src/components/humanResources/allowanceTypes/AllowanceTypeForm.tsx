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
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
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
import { AllowanceType } from './AllowanceType';

interface AllowanceTypeFormProps {
  setOpenDialog: (open: boolean) => void;
  allowanceType?: AllowanceType | null;
}

interface FormData extends Omit<AllowanceType, 'id' | 'created_by'> {
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

const AllowanceTypeForm = ({
  setOpenDialog,
  allowanceType = null,
}: AllowanceTypeFormProps) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const dictionary = useDictionary();
  const { ungroupedLedgerOptions } = useLedgerSelect();
  const { organizationHasSubscribed, checkOrganizationPermission } =
    useJumboAuth();

  const [recentlyAddedExpenseLedger, setRecentlyAddedExpenseLedger] =
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
      (ledger) => ledger.id === allowanceType?.expense_ledger_id
    );
  }, [allowanceType, ungroupedLedgerOptions]);

  useEffect(() => {
    if (defaultValue) setRecentlyAddedExpenseLedger(defaultValue);
  }, [defaultValue]);

  const {
    mutate: addAllowanceType,
    isPending,
    error,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.addAllowanceType,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar(dictionary.humanResources.allowanceTypes.form.messages.addSuccess, {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['allowanceTypes'] });
    },
    onError: (mutationError) => {
      handleErrorResponse(mutationError);
    },
  });

  const {
    mutate: updateAllowanceType,
    isPending: updateIsPending,
    error: updateError,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.updateAllowanceType,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar(dictionary.humanResources.allowanceTypes.form.messages.updateSuccess, {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['allowanceTypes'] });
    },
    onError: (mutationError) => {
      handleErrorResponse(mutationError);
    },
  });

  const handleErrorResponse = (mutationError: any) => {
    const responseData = mutationError?.response?.data;

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
      .required(dictionary.humanResources.allowanceTypes.form.validation.nameRequired)
      .max(255, dictionary.humanResources.allowanceTypes.form.validation.nameMax),
    code: yup.string().max(50, dictionary.humanResources.allowanceTypes.form.validation.codeMax),
    is_taxable: yup.boolean().required(),
    default_value: yup
      .number()
      .typeError(dictionary.humanResources.allowanceTypes.form.validation.defaultValueNumber)
      .required(dictionary.humanResources.allowanceTypes.form.validation.defaultValueRequired)
      .min(0, dictionary.humanResources.allowanceTypes.form.validation.defaultValueMin),
    // Optional — an unmapped allowance falls back to the employee's department
    // (or the run's fallback) salary expense account when posting, same as
    // basic salary itself; see PayrollPostingService::post().
    expense_ledger_id: yup.number().nullable(),
    description: yup
      .string()
      .max(500, dictionary.humanResources.allowanceTypes.form.validation.descriptionMax),
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
      id: allowanceType?.id,
      name: allowanceType?.name || '',
      code: allowanceType?.code || '',
      is_taxable: allowanceType?.is_taxable || false,
      default_value: allowanceType?.default_value ?? 0,
      expense_ledger_id: allowanceType?.expense_ledger_id ?? undefined,
      description: allowanceType?.description || '',
      apply_to_employees: 'none',
    },
  });

  const applyScope = watch('apply_to_employees');

  useEffect(() => {
    reset({
      id: allowanceType?.id,
      name: allowanceType?.name || '',
      code: allowanceType?.code || '',
      is_taxable: allowanceType?.is_taxable || false,
      default_value: allowanceType?.default_value ?? 0,
      expense_ledger_id: allowanceType?.expense_ledger_id ?? undefined,
      description: allowanceType?.description || '',
      apply_to_employees: 'none',
    });
  }, [allowanceType, reset]);

  const saveMutation = useMemo(() => {
    return allowanceType?.id ? updateAllowanceType : addAllowanceType;
  }, [allowanceType?.id, updateAllowanceType, addAllowanceType]);

  // These codes are how PayrollService/LeaveEncashmentService recognize a
  // type — editing name/code/is_taxable would silently change payroll
  // behavior (or break the match entirely). Only the ledger and description
  // stay editable; the backend enforces the same restriction regardless of
  // what the form submits.
  const isReservedType =
    !!allowanceType?.id &&
    ['OVERTIME_PAY', 'HOLIDAY_PREMIUM', 'LEAVE_ENCASHMENT'].includes(
      allowanceType?.code || ''
    );

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
          {!allowanceType?.id
            ? dictionary.humanResources.allowanceTypes.form.titles.add
            : dictionary.humanResources.allowanceTypes.form.titles.edit}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          {isReservedType && (
            <Alert severity='info' sx={{ mb: 2 }}>
              {dictionary.humanResources.allowanceTypes.form.helpers.reservedAlert}
            </Alert>
          )}
          <Grid container rowSpacing={{ xs: 1, md: 2 }} spacing={2}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label={dictionary.humanResources.allowanceTypes.form.labels.name}
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
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label={dictionary.humanResources.allowanceTypes.form.labels.code}
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

            {organizationHasSubscribed(MODULES.ACCOUNTS_AND_FINANCE) && (
              <Grid size={{ xs: 12 }}>
                <Div sx={{ my: 1 }}>
                  <LedgerSelect
                    label={
                      dictionary.productCategories.form.labels.expenseLedger
                    }
                    allowedGroups={['Expenses']}
                    frontError={errors.expense_ledger_id}
                    key={'expense-ledger'}
                    value={recentlyAddedExpenseLedger || undefined}
                    defaultValue={allowanceType?.expense_ledger || undefined}
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
            )}

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='default_value'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      label={dictionary.humanResources.allowanceTypes.form.labels.defaultValue}
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

            {/* Apply To Employees Dropdown — doesn't apply to reserved types:
                their amounts are computed per period (overtime, holiday
                premiums, leave encashment), not a flat default_value assigned
                to employees. */}
            {!isReservedType && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <Controller
                    name='apply_to_employees'
                    control={control}
                    render={({ field }) => (
                      <TextField
                        select
                        label={dictionary.humanResources.allowanceTypes.form.labels.applyToEmployees}
                        size='small'
                        fullWidth
                        value={field.value || 'none'}
                        onChange={field.onChange}
                        helperText={
                          applyScope !== 'none'
                            ? dictionary.humanResources.allowanceTypes.form.helpers.applyAll
                            : dictionary.humanResources.allowanceTypes.form.helpers.applyNone
                        }
                      >
                        <MenuItem value='none'>{dictionary.humanResources.allowanceTypes.form.options.none}</MenuItem>
                        <MenuItem value='all'>
                          {dictionary.humanResources.allowanceTypes.form.options.allEmployees}
                        </MenuItem>
                        <MenuItem value='active_contracts'>
                          {dictionary.humanResources.allowanceTypes.form.options.activeContracts}
                        </MenuItem>
                      </TextField>
                    )}
                  />
                </Div>
              </Grid>
            )}

            <Grid size={{ xs: 12 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label={dictionary.humanResources.allowanceTypes.form.labels.description}
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

            <Grid size={{ xs: 12 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='is_taxable'
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={Boolean(field.value)}
                          disabled={isReservedType}
                          onChange={(event) =>
                            field.onChange(event.target.checked)
                          }
                        />
                      }
                      label={dictionary.humanResources.allowanceTypes.form.labels.isTaxable}
                    />
                  )}
                />
              </Div>
            </Grid>
          </Grid>

          <DialogActions>
            <Button size='small' onClick={() => setOpenDialog(false)}>
              {dictionary.humanResources.allowanceTypes.form.buttons.cancel}
            </Button>
            <LoadingButton
              type='submit'
              variant='contained'
              size='small'
              sx={{ display: 'flex' }}
              loading={isPending || updateIsPending}
            >
              {dictionary.humanResources.allowanceTypes.form.buttons.submit}
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
            {dictionary.humanResources.allowanceTypes.form.titles.confirmBulk}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            {dictionary.humanResources.allowanceTypes.form.bulk.intro}
          </Typography>
          <Grid container spacing={1}>
            <Grid size={12}>
              <Typography variant='body2'>
                <strong>{dictionary.humanResources.allowanceTypes.form.bulk.willUpdate}</strong>{' '}
                {dictionary.humanResources.allowanceTypes.form.bulk.employeesCount.replace(
                  '{count}',
                  String(confirmDialog.wouldUpdate)
                )}
                {confirmDialog.wouldUpdate > 0 && (
                  <Typography
                    variant='caption'
                    display='block'
                    color='text.secondary'
                  >
                    {dictionary.humanResources.allowanceTypes.form.bulk.updateNote}
                  </Typography>
                )}
              </Typography>
            </Grid>
            <Grid size={12}>
              <Typography variant='body2'>
                <strong>{dictionary.humanResources.allowanceTypes.form.bulk.willCreate}</strong>{' '}
                {dictionary.humanResources.allowanceTypes.form.bulk.newEmployeesCount.replace(
                  '{count}',
                  String(confirmDialog.wouldCreate)
                )}
                {confirmDialog.wouldCreate > 0 && (
                  <Typography
                    variant='caption'
                    display='block'
                    color='text.secondary'
                  >
                    {dictionary.humanResources.allowanceTypes.form.bulk.createNote}
                  </Typography>
                )}
              </Typography>
            </Grid>
          </Grid>
          <Typography variant='body2' color='warning.main' sx={{ mt: 2 }}>
            {dictionary.humanResources.allowanceTypes.form.bulk.warning}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelBulkUpdate} variant='outlined'>
            {dictionary.humanResources.allowanceTypes.form.buttons.cancel}
          </Button>
          <Button
            onClick={handleConfirmBulkUpdate}
            variant='contained'
            color='warning'
          >
            {dictionary.humanResources.allowanceTypes.form.buttons.continue}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ledger quick add dialog */}
      <Dialog open={openQuickAddLedger} maxWidth={'md'}>
        <LedgerGroupProvider>
          <QuickAddLedger
            ledgerType={ledgertType}
            toggleOpen={setOpenQuickAddLedger}
            heading={dictionary.humanResources.allowanceTypes.form.titles.quickAddLedger}
            setAddedLedger={(v) => {
              setRecentlyAddedExpenseLedger(v);
              setValue('expense_ledger_id', v.id, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
          />
        </LedgerGroupProvider>
      </Dialog>
    </>
  );
};

export default AllowanceTypeForm;
