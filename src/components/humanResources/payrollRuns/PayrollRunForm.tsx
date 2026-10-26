// payrollRuns/PayrollRunForm.tsx
'use client';

import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import humanResourcesServices from '../humanResourcesServices';
import { PayrollPeriodType } from '../payrollPeriods/PayrollPeriodType';
import { PayrollRunType } from './PayrollRunType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface PayrollRunFormProps {
  setOpenDialog: (open: boolean) => void;
  payrollPeriod: PayrollPeriodType | null;
  payrollRun?: PayrollRunType | null;
  onSuccess?: () => void;
  runs?: PayrollRunType[];
}

interface FormData {
  payroll_period_id: number;
  cost_center_id: number | null;
}

const PayrollRunForm = ({
  setOpenDialog,
  payrollPeriod,
  payrollRun = null,
  onSuccess,
  runs = [],
}: PayrollRunFormProps) => {
  const dictionary = useDictionary();
  const t = dictionary.humanResources.payrollRuns.form;
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [costCenter, setCostCenter] = useState<CostCenter | null>(null);

  // Check if there's any existing run with a cost center (branch run)
  const hasBranchRun = runs.some((run) => run.cost_center_id !== null);

  // Check if there's any existing company-wide run
  const hasCompanyWideRun = runs.some((run) => run.cost_center_id === null);

  // Determine if cost center is required
  const isCostCenterRequired =
    hasBranchRun || (!hasCompanyWideRun && runs.length > 0);

  // Validation schema - conditionally require cost_center_id
  const validationSchema = yup.object({
    payroll_period_id: yup.number().required(t.errors.periodRequired),
    cost_center_id: yup
      .number()
      .nullable()
      .when([], {
        is: () => isCostCenterRequired,
        then: (schema) =>
          schema.required(t.errors.costCenterRequired),
        otherwise: (schema) => schema.optional(),
      }),
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      payroll_period_id: payrollPeriod?.id || 0,
      cost_center_id: null,
    },
  });

  useEffect(() => {
    if (payrollRun) {
      reset({
        payroll_period_id:
          payrollRun.payroll_period_id || payrollPeriod?.id || 0,
        cost_center_id: payrollRun.cost_center_id || null,
      });
      if (payrollRun.cost_center) {
        setCostCenter(payrollRun.cost_center as CostCenter);
      }
    }
  }, [payrollRun, payrollPeriod, reset]);

  const { mutate: addPayrollRun, isPending: isAdding } = useMutation({
    mutationFn: humanResourcesServices.addPayrollRun,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar(t.messages.created, {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
      queryClient.invalidateQueries({
        queryKey: ['payrollRunsForPeriod', String(payrollPeriod?.id)],
      });
      queryClient.invalidateQueries({ queryKey: ['payrollPeriods'] });
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  const onSubmit = (data: FormData) => {
    addPayrollRun(data);
  };

  // Format period label for display
  const monthName = payrollPeriod
    ? new Date(payrollPeriod.year, payrollPeriod.month - 1).toLocaleString(
        'default',
        { month: 'long' }
      )
    : '';

  // Get info message based on existing runs
  const getInfoMessage = () => {
    if (payrollRun?.id) {
      return t.info.edit;
    }

    if (hasBranchRun) {
      return t.info.hasBranchRun;
    }

    if (hasCompanyWideRun) {
      return t.info.hasCompanyWideRun;
    }

    return t.info.createNew.replace(
      '{period}',
      `${monthName} ${payrollPeriod?.year || ''}`
    );
  };

  const isEditMode = !!payrollRun?.id;

  return (
    <>
      <DialogTitle>
        <Grid size={12} textAlign='center'>
          {isEditMode ? t.title.edit : t.title.create}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            <Grid size={12}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Alert
                  severity={isCostCenterRequired ? 'warning' : 'info'}
                  sx={{ mb: 2 }}
                >
                  {getInfoMessage()}
                </Alert>
              </Div>
            </Grid>

            {/* Hidden field for payroll_period_id */}
            <input
              type='hidden'
              {...control.register('payroll_period_id')}
              value={payrollPeriod?.id || 0}
            />

            <Grid size={{ xs: 12, md: 12 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='cost_center_id'
                  control={control}
                  render={({ field }) => (
                    <CostCenterSelector
                      multiple={false}
                      withNotSpecified={false}
                      label={
                        isCostCenterRequired
                          ? t.labels.costCenterRequired
                          : t.labels.costCenterOptional
                      }
                      defaultValue={costCenter}
                      onChange={(value) => {
                        const selected = Array.isArray(value)
                          ? value[0]
                          : value;
                        setCostCenter(selected || null);
                        field.onChange(selected?.id || null);
                      }}
                    />
                  )}
                />
                {errors.cost_center_id && (
                  <Typography variant='caption' color='error'>
                    {errors.cost_center_id.message}
                  </Typography>
                )}
                {!isCostCenterRequired && !isEditMode && (
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    sx={{ display: 'block', mt: 0.5 }}
                  >
                    {t.labels.leaveEmpty}
                  </Typography>
                )}
              </Div>
            </Grid>

            {isEditMode && (
              <Grid size={12}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <Alert severity='info'>
                    {t.labels.currentStatus}{' '}
                    <strong>{payrollRun.status || t.labels.draft}</strong>
                  </Alert>
                </Div>
              </Grid>
            )}
          </Grid>

          <DialogActions>
            <Button size='small' onClick={() => setOpenDialog(false)}>
              {t.buttons.cancel}
            </Button>
            <LoadingButton
              type='submit'
              variant='contained'
              size='small'
              sx={{ display: 'flex' }}
              loading={isAdding}
            >
              {isEditMode ? t.buttons.update : t.buttons.create}
            </LoadingButton>
          </DialogActions>
        </form>
      </DialogContent>
    </>
  );
};

export default PayrollRunForm;
