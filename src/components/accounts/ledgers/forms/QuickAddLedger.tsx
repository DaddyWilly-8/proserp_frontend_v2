import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useLedgerGroup } from '@/components/accounts/ledgerGroups/LedgerGroupProvider';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { AddOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Autocomplete,
  Button,
  DialogActions,
  DialogContent,
  Divider,
  Grid,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import ledgerServices from '../ledger-services';
import AddQuickLedgerGroup from './AddQuickLedgerGroup';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface Ledger {
  id?: number;
  name: string;
  alias?: string;
  code?: string;
  description?: string;
  ledger_group?: {
    id: number;
    nature_id: number;
    name: string;
  };
  ledger_group_id?: number;
}

interface MiniLedger {
  id: number;
  name: string;
  code: string | null;
  ledger_group_id: number;
  alias: string | null;
  nature_id?: number;
}

interface LedgerGroupOption {
  id: number;
  name: string;
  nature_id: number;
  value?: number;
}

interface QuickAddLedgerType {
  ledgerType: string;
  ledger?: Ledger;
  heading?: string;
  toggleOpen: (open: boolean) => void;
  setAddedLedger?: (value: MiniLedger) => void;
}

interface FormValues {
  id?: number;
  name: string;
  alias?: string;
  code?: string;
  description?: string;
  ledger_group_id: number | null;
  opening_balance?: number;
  opening_balance_side?: 'credit' | 'debit';
  as_at?: string | null;
  cost_center_id?: number | null;
}

const QuickAddLedger = ({
  ledgerType,
  ledger,
  heading,
  toggleOpen,
  setAddedLedger,
}: QuickAddLedgerType) => {
  const dictionary = useDictionary();
  const { authOrganization } = useJumboAuth();
  const [openQuickAddLedgerGroup, setOpenQuickAddLedgerGroup] = useState(false);
  const { ledgerGroupOptions } = useLedgerGroup();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [openingBalanceCostCenter, setOpeningBalanceCostCenter] =
    useState<any>(null);
  const [serverError, setServerError] = useState<Record<
    string,
    string[]
  > | null>(null);

  const validationSchema = yup.object({
    name: yup.string().required(dictionary.forms.ledgers.form.errors.validation.nameRequired),
    ledger_group_id: yup.mixed().required(dictionary.forms.ledgers.form.errors.validation.groupRequired),
    opening_balance: yup.number().min(0),
    opening_balance_side: yup
      .string()
      .when('opening_balance', (opening_balance, schema) => {
        if (typeof opening_balance === 'number' && opening_balance > 0) {
          return schema.required(dictionary.forms.ledgers.form.errors.validation.balanceSideRequired);
        }
        return schema;
      }),
    as_at: yup
      .string()
      .nullable()
      .when('opening_balance', (opening_balance, schema) => {
        if (typeof opening_balance === 'number' && opening_balance > 0) {
          return schema.required(dictionary.forms.ledgers.form.errors.validation.balanceDateRequired);
        }
        return schema;
      }),
  });

  const {
    register,
    setValue,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      name: '',
      alias: '',
      code: '',
      description: '',
      ledger_group_id: null,
      as_at: authOrganization?.organization?.recording_start_date,
    },
    resolver: yupResolver(validationSchema) as any,
  });

  const addLedgerMutation = useMutation({
    mutationFn: (data: FormValues) => {
      const dataToSend = {
        ...data,
        opening_balance_side: ledgerType === 'credit' ? 'credit' : 'debit',
        as_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      };
      return ledgerServices.add(dataToSend);
    },
    onSuccess: (data) => {
      setAddedLedger && setAddedLedger(data.ledger);
      queryClient.invalidateQueries({ queryKey: ['ledgers-list'] });
      queryClient.invalidateQueries({ queryKey: ['ledgerOptions'] });
      enqueueSnackbar(dictionary.forms.ledgers.form.messages.createSuccess, {
        variant: 'success',
        autoHideDuration: 2000,
      });
      toggleOpen(false);
    },
    onError: (err: any) => {
      if (err.response?.status === 400) {
        setServerError(err.response?.data?.validation_errors);
      } else {
        enqueueSnackbar(err.response?.data?.message || dictionary.forms.ledgers.form.messages.somethingWentWrong, {
          variant: 'error',
        });
      }
    },
  });

  const saveMutation = React.useMemo(() => {
    return addLedgerMutation;
  }, [ledger, addLedgerMutation]);

  return (
    <>
      <Divider />
      <Typography textAlign={'center'} variant='h4' marginTop={2}>
        {!heading
          ? ledgerType === 'credit'
            ? dictionary.forms.ledgers.form.title.quickAddCredit
            : dictionary.forms.ledgers.form.title.quickAddDebit
          : heading}
      </Typography>
      <DialogContent>
        <form autoComplete='off'>
          <Grid container spacing={1}>
            {!openQuickAddLedgerGroup && (
              <>
                <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                  <Div sx={{ mb: 1 }}>
                    <TextField
                      fullWidth
                      label={dictionary.forms.ledgers.form.labels.ledgerName}
                      size='small'
                      error={!!errors.name || !!serverError?.name}
                      helperText={
                        errors.name?.message || serverError?.name?.[0]
                      }
                      {...register('name')}
                    />
                  </Div>
                </Grid>
                <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                  <Div sx={{ mb: 1 }}>
                    <Controller
                      control={control}
                      name='ledger_group_id'
                      render={({ field: { onChange, value } }) => (
                        <Autocomplete
                          options={
                            ledger?.ledger_group
                              ? ledgerGroupOptions.filter(
                                  (ledger_group) =>
                                    ledger_group.nature_id ===
                                    ledger.ledger_group?.nature_id
                                )
                              : ledgerGroupOptions.filter(
                                  (ledger_group) =>
                                    ledger_group.id !==
                                      ledger_group.nature_id ||
                                    [3, 4].indexOf(ledger_group.nature_id) !==
                                      -1
                                )
                          }
                          size='small'
                          getOptionLabel={(option: LedgerGroupOption) =>
                            option.name
                          }
                          isOptionEqualToValue={(
                            option: LedgerGroupOption,
                            value: LedgerGroupOption
                          ) => option.id === value.id}
                          defaultValue={ledger?.ledger_group}
                          disabled={!!ledger?.ledger_group_id}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label={dictionary.forms.ledgers.form.labels.ledgerGroup}
                              InputProps={{
                                ...params.InputProps,
                                startAdornment:
                                  ledger?.ledger_group_id ? null : (
                                    <Tooltip title={dictionary.tooltips.quickAddGroup}>
                                      <AddOutlined
                                        onClick={() =>
                                          setOpenQuickAddLedgerGroup(true)
                                        }
                                        sx={{ cursor: 'pointer' }}
                                      />
                                    </Tooltip>
                                  ),
                              }}
                              error={!!errors.ledger_group_id}
                              helperText={errors.ledger_group_id?.message}
                            />
                          )}
                          value={
                            ledgerGroupOptions.find(
                              (option: LedgerGroupOption) => option.id === value
                            ) || null
                          }
                          onChange={(
                            event,
                            newValue: LedgerGroupOption | null
                          ) => {
                            onChange(newValue ? newValue.id : null);
                            setValue(
                              'ledger_group_id',
                              newValue ? newValue.id : null,
                              {
                                shouldValidate: true,
                                shouldDirty: true,
                              }
                            );
                          }}
                        />
                      )}
                    />
                  </Div>
                </Grid>
                <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                  <Div sx={{ mb: 1 }}>
                    <TextField
                      fullWidth
                      label={dictionary.forms.ledgers.form.labels.alias}
                      size='small'
                      {...register('alias')}
                    />
                    {serverError?.alias && (
                      <Typography variant='body2' color='error'>
                        {serverError.alias[0]}
                      </Typography>
                    )}
                  </Div>
                </Grid>
                <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                  <Div sx={{ mb: 1 }}>
                    <TextField
                      fullWidth
                      label={dictionary.forms.ledgers.form.labels.code}
                      size='small'
                      {...register('code')}
                    />
                    {serverError?.code && (
                      <Typography variant='body2' color='error'>
                        {serverError.code[0]}
                      </Typography>
                    )}
                  </Div>
                </Grid>
                <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                  <Div sx={{ mb: 1 }}>
                    <CostCenterSelector
                      label={dictionary.forms.ledgers.form.labels.costCenters}
                      multiple={false}
                      defaultValue={openingBalanceCostCenter}
                      onChange={(newValue: any) => {
                        setValue(
                          'cost_center_id',
                          newValue ? newValue.id : null
                        );
                      }}
                    />
                  </Div>
                </Grid>
                <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                  <Div sx={{ mb: 1 }}>
                    <Controller
                      name='opening_balance'
                      control={control}
                      render={({ field: { onChange, value } }) => (
                        <TextField
                          label={dictionary.forms.ledgers.form.labels.openingBalance}
                          fullWidth
                          size='small'
                          value={value}
                          InputProps={{
                            inputComponent: CommaSeparatedField,
                          }}
                          onChange={(
                            e: React.ChangeEvent<HTMLInputElement>
                          ) => {
                            const sanitized = sanitizedNumber(e.target.value);
                            onChange(sanitized);
                            setValue('opening_balance', sanitized, {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                          }}
                        />
                      )}
                    />
                  </Div>
                </Grid>
              </>
            )}
            {openQuickAddLedgerGroup && (
              <Grid size={12}>
                <AddQuickLedgerGroup
                  setOpenQuickAddLedgerGroup={setOpenQuickAddLedgerGroup}
                />
              </Grid>
            )}
            <Grid size={{ xs: 12, md: 12, lg: 12 }}>
              <Div sx={{ mb: 1 }}>
                <TextField
                  fullWidth
                  label={dictionary.forms.ledgers.form.labels.description}
                  size='small'
                  multiline
                  rows={2}
                  {...register('description')}
                />
              </Div>
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      <DialogActions>
        <Button
          size='small'
          variant='outlined'
          onClick={() => toggleOpen(false)}
        >
          {dictionary.forms.ledgers.form.buttons.cancel}
        </Button>
        <LoadingButton
          type='submit'
          variant='contained'
          size='small'
          onClick={handleSubmit((data) => saveMutation.mutate(data))}
          sx={{ display: 'flex' }}
          loading={isSubmitting || saveMutation.isPending}
        >
          {dictionary.forms.ledgers.form.buttons.add}
        </LoadingButton>
      </DialogActions>
    </>
  );
};

export default QuickAddLedger;
