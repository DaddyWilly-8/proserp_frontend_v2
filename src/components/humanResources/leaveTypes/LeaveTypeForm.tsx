'use client';

import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { LoadingButton } from '@mui/lab';
import { InfoOutlined } from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import humanResourcesServices from '../humanResourcesServices';
import { LeaveType } from './LeaveTypesType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const FieldLabel = ({ label, hint }: { label: string; hint: string }) => (
  <Stack direction='row' spacing={0.5} alignItems='center' sx={{ mb: 0.5 }}>
    <Typography variant='body2' color='text.secondary'>
      {label}
    </Typography>
    <Tooltip title={hint}>
      <InfoOutlined sx={{ fontSize: 16, color: 'text.disabled' }} />
    </Tooltip>
  </Stack>
);

interface LeaveTypeFormProp {
  setOpenDialog: (open: boolean) => void;
  leaveType?: LeaveType | null;
}

interface FormData extends Omit<LeaveType, 'id'> {
  id?: number;
  apply_to_employees?: 'none' | 'all' | 'active_contracts';
  apply_to_gender?: '' | 'male' | 'female';
  apply_start_date?: string;
  force_update?: boolean;
}

interface ApiResponse {
  message: string;
  validation_errors?: {
    name?: string;
    days_per_year?: number;
  };
  would_update?: number;
  would_create?: number;
  would_skip?: number;
}

const LeaveTypeForm = ({ setOpenDialog, leaveType }: LeaveTypeFormProp) => {
  const dictionary = useDictionary();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    data: FormData | null;
    wouldUpdate: number;
    wouldCreate: number;
    wouldSkip: number;
  }>({
    open: false,
    data: null,
    wouldUpdate: 0,
    wouldCreate: 0,
    wouldSkip: 0,
  });

  const {
    mutate: addLeaveType,
    isPending,
    error,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.addLeaveType,
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar(dictionary.humanResources.leaveTypes.form.messages.addSuccess, {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['leaveTypes'] });
    },
    onError: (mutationError) => {
      handleErrorResponse(mutationError);
    },
  });

  const {
    mutate: updateLeaveType,
    isPending: updateIsLoading,
    error: updateError,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.updateLeaveType,
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar(dictionary.humanResources.leaveTypes.form.messages.updateSuccess, {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['leaveTypes'] });
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
        wouldSkip: responseData.would_skip || 0,
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
      wouldSkip: 0,
    });
  };

  const handleCancelBulkUpdate = () => {
    setConfirmDialog({
      open: false,
      data: null,
      wouldUpdate: 0,
      wouldCreate: 0,
      wouldSkip: 0,
    });
  };

  const validationSchema = yup.object({
    id: yup.number().optional(),
    name: yup
      .string()
      .required(dictionary.humanResources.leaveTypes.form.validation.nameRequired)
      .max(255, dictionary.humanResources.leaveTypes.form.validation.nameMax),
    days_per_year: yup
      .number()
      .required(dictionary.humanResources.leaveTypes.form.validation.daysRequired)
      .min(1, dictionary.humanResources.leaveTypes.form.validation.daysMin),
    cycle_months: yup
      .number()
      .transform((value, originalValue) => (originalValue === '' ? undefined : value))
      .min(1, dictionary.humanResources.leaveTypes.form.validation.cycleMin)
      .max(240, dictionary.humanResources.leaveTypes.form.validation.cycleMax)
      .optional(),
    carry_forward_months: yup
      .number()
      .transform((value, originalValue) => (originalValue === '' ? undefined : value))
      .min(0, dictionary.humanResources.leaveTypes.form.validation.carryMin)
      .max(60, dictionary.humanResources.leaveTypes.form.validation.carryMax)
      .nullable()
      .optional(),
    excludes_saturday: yup.boolean().optional(),
    excludes_sunday: yup.boolean().optional(),
    apply_to_employees: yup
      .string()
      .oneOf(['none', 'all', 'active_contracts'])
      .optional(),
    apply_to_gender: yup
      .string()
      .oneOf(['', 'male', 'female'])
      .optional(),
    apply_start_date: yup.string().optional(),
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: leaveType?.id,
      name: leaveType?.name || '',
      days_per_year: leaveType?.days_per_year || 1,
      cycle_months: leaveType?.cycle_months || 12,
      carry_forward_months: leaveType?.carry_forward_months ?? undefined,
      excludes_saturday: leaveType?.excludes_saturday ?? false,
      excludes_sunday: leaveType?.excludes_sunday ?? false,
      apply_to_employees: 'none',
      apply_to_gender: '',
      apply_start_date: '',
    },
  });

  const applyScope = watch('apply_to_employees');

  useEffect(() => {
    reset({
      id: leaveType?.id,
      name: leaveType?.name || '',
      days_per_year: leaveType?.days_per_year || 1,
      cycle_months: leaveType?.cycle_months || 12,
      carry_forward_months: leaveType?.carry_forward_months ?? undefined,
      excludes_saturday: leaveType?.excludes_saturday ?? false,
      excludes_sunday: leaveType?.excludes_sunday ?? false,
      apply_to_employees: 'none',
      apply_to_gender: '',
      apply_start_date: '',
    });
  }, [leaveType, reset]);

  const saveMutation = useMemo(() => {
    return leaveType?.id ? updateLeaveType : addLeaveType;
  }, [leaveType, updateLeaveType, addLeaveType]);

  const onSubmit = (data: FormData) => {
    saveMutation({
      ...data,
      apply_to_gender: data.apply_to_gender || undefined,
      apply_start_date: data.apply_start_date || undefined,
    });
  };

  return (
    <>
      <DialogTitle>
        <Grid size={12} textAlign={'center'}>
          {!leaveType?.id
            ? dictionary.humanResources.leaveTypes.form.titles.add
            : dictionary.humanResources.leaveTypes.form.titles.edit.replace('{name}', leaveType.name)}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <Grid container rowSpacing={{ xs: 1, md: 2 }} spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1 }}>
                <TextField
                  label={dictionary.humanResources.leaveTypes.form.labels.name}
                  placeholder={dictionary.humanResources.leaveTypes.form.placeholders.name}
                  size='small'
                  fullWidth
                  error={
                    !!errors?.name ||
                    !!error?.response?.data?.validation_errors?.name ||
                    !!updateError?.response?.data?.validation_errors?.name
                  }
                  helperText={
                    errors.name?.message ||
                    error?.response?.data?.validation_errors?.name ||
                    updateError?.response?.data?.validation_errors?.name
                  }
                  {...register('name')}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1 }}>
                <TextField
                  label={dictionary.humanResources.leaveTypes.form.labels.daysPerYear}
                  placeholder={dictionary.humanResources.leaveTypes.form.placeholders.daysPerYear}
                  size='small'
                  fullWidth
                  error={
                    !!errors?.days_per_year ||
                    !!error?.response?.data?.validation_errors?.days_per_year ||
                    !!updateError?.response?.data?.validation_errors
                      ?.days_per_year
                  }
                  helperText={
                    errors.days_per_year?.message ||
                    error?.response?.data?.validation_errors?.days_per_year ||
                    updateError?.response?.data?.validation_errors
                      ?.days_per_year
                  }
                  {...register('days_per_year')}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1 }}>
                <FieldLabel
                  label={dictionary.humanResources.leaveTypes.form.labels.cycleMonths}
                  hint={dictionary.humanResources.leaveTypes.form.hints.cycleMonths}
                />
                <TextField
                  placeholder={dictionary.humanResources.leaveTypes.form.placeholders.cycleMonths}
                  size='small'
                  fullWidth
                  error={!!errors?.cycle_months}
                  helperText={errors.cycle_months?.message}
                  {...register('cycle_months')}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1 }}>
                <FieldLabel
                  label={dictionary.humanResources.leaveTypes.form.labels.carryForwardMonths}
                  hint={dictionary.humanResources.leaveTypes.form.hints.carryForwardMonths}
                />
                <TextField
                  placeholder={dictionary.humanResources.leaveTypes.form.placeholders.carryForwardMonths}
                  size='small'
                  fullWidth
                  error={!!errors?.carry_forward_months}
                  helperText={errors.carry_forward_months?.message}
                  {...register('carry_forward_months')}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1 }}>
                <FieldLabel
                  label={dictionary.humanResources.leaveTypes.form.labels.excludesSaturday}
                  hint={dictionary.humanResources.leaveTypes.form.hints.excludesSaturday}
                />
                <Controller
                  name='excludes_saturday'
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={!!field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      }
                      label={
                        field.value
                          ? dictionary.humanResources.leaveTypes.form.options.excluded
                          : dictionary.humanResources.leaveTypes.form.options.counted
                      }
                    />
                  )}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1 }}>
                <FieldLabel
                  label={dictionary.humanResources.leaveTypes.form.labels.excludesSunday}
                  hint={dictionary.humanResources.leaveTypes.form.hints.excludesSunday}
                />
                <Controller
                  name='excludes_sunday'
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={!!field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      }
                      label={
                        field.value
                          ? dictionary.humanResources.leaveTypes.form.options.excluded
                          : dictionary.humanResources.leaveTypes.form.options.counted
                      }
                    />
                  )}
                />
              </Div>
            </Grid>

            {/* Apply To Employees Dropdown */}
            <Grid size={{ xs: 12 }}>
              <Div sx={{ mt: 1 }}>
                <FieldLabel
                  label={dictionary.humanResources.leaveTypes.form.labels.applyToEmployees}
                  hint={
                    applyScope !== 'none'
                      ? dictionary.humanResources.leaveTypes.form.hints.applyAll
                      : leaveType?.id
                        ? dictionary.humanResources.leaveTypes.form.hints.applyEditNone
                        : dictionary.humanResources.leaveTypes.form.hints.applyNewNone
                  }
                />
                <Controller
                  name='apply_to_employees'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      select
                      size='small'
                      fullWidth
                      value={field.value || 'none'}
                      onChange={field.onChange}
                    >
                      <MenuItem value='none'>{dictionary.humanResources.leaveTypes.form.options.none}</MenuItem>
                      <MenuItem value='all'>{dictionary.humanResources.leaveTypes.form.options.allEmployees}</MenuItem>
                      <MenuItem value='active_contracts'>
                        {dictionary.humanResources.leaveTypes.form.options.activeContracts}
                      </MenuItem>
                    </TextField>
                  )}
                />
              </Div>
            </Grid>

            {applyScope !== 'none' && (
              <Grid size={{ xs: 12 }}>
                <Div sx={{ mt: 1 }}>
                  <FieldLabel
                    label={dictionary.humanResources.leaveTypes.form.labels.gender}
                    hint={dictionary.humanResources.leaveTypes.form.hints.gender}
                  />
                  <Controller
                    name='apply_to_gender'
                    control={control}
                    render={({ field }) => (
                      <TextField
                        select
                        size='small'
                        fullWidth
                        value={field.value || ''}
                        onChange={field.onChange}
                      >
                        <MenuItem value=''>{dictionary.humanResources.leaveTypes.form.options.any}</MenuItem>
                        <MenuItem value='female'>{dictionary.humanResources.leaveTypes.form.options.female}</MenuItem>
                        <MenuItem value='male'>{dictionary.humanResources.leaveTypes.form.options.male}</MenuItem>
                      </TextField>
                    )}
                  />
                </Div>
              </Grid>
            )}

            {applyScope !== 'none' && (
              <Grid size={{ xs: 12 }}>
                <Div sx={{ mt: 1 }}>
                  <FieldLabel
                    label={dictionary.humanResources.leaveTypes.form.labels.startDate}
                    hint={dictionary.humanResources.leaveTypes.form.hints.startDate}
                  />
                  <Controller
                    name='apply_start_date'
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        value={field.value ? dayjs(field.value) : null}
                        onChange={(val) =>
                          field.onChange(val ? val.format('YYYY-MM-DD') : '')
                        }
                        slotProps={{
                          textField: { size: 'small', fullWidth: true },
                          field: { clearable: true },
                        }}
                      />
                    )}
                  />
                </Div>
              </Grid>
            )}
          </Grid>
          <DialogActions>
            <Button size='small' onClick={() => setOpenDialog(false)}>
              {dictionary.humanResources.leaveTypes.form.buttons.cancel}
            </Button>
            <LoadingButton
              type='submit'
              variant='contained'
              size='small'
              sx={{ display: 'flex' }}
              loading={isPending || updateIsLoading}
            >
              {dictionary.humanResources.leaveTypes.form.buttons.submit}
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
            {dictionary.humanResources.leaveTypes.form.titles.confirmBulk}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            {dictionary.humanResources.leaveTypes.form.bulk.intro.replace(
              '{days}',
              String(confirmDialog.data?.days_per_year || 0)
            )}
          </Typography>
          <Grid container spacing={1}>
            <Grid size={12}>
              <Typography variant='body2'>
                <strong>{dictionary.humanResources.leaveTypes.form.bulk.willUpdate}</strong>{' '}
                {dictionary.humanResources.leaveTypes.form.bulk.employeesCount.replace(
                  '{count}',
                  String(confirmDialog.wouldUpdate)
                )}
                {confirmDialog.wouldUpdate > 0 && (
                  <Typography
                    variant='caption'
                    display='block'
                    color='text.secondary'
                  >
                    {dictionary.humanResources.leaveTypes.form.bulk.updateNote}
                  </Typography>
                )}
              </Typography>
            </Grid>
            <Grid size={12}>
              <Typography variant='body2'>
                <strong>{dictionary.humanResources.leaveTypes.form.bulk.willCreate}</strong>{' '}
                {dictionary.humanResources.leaveTypes.form.bulk.newEmployeesCount.replace(
                  '{count}',
                  String(confirmDialog.wouldCreate)
                )}
                {confirmDialog.wouldCreate > 0 && (
                  <Typography
                    variant='caption'
                    display='block'
                    color='text.secondary'
                  >
                    {dictionary.humanResources.leaveTypes.form.bulk.createNote}
                  </Typography>
                )}
              </Typography>
            </Grid>
            {confirmDialog.wouldSkip > 0 && (
              <Grid size={12}>
                <Typography variant='body2'>
                  <strong>{dictionary.humanResources.leaveTypes.form.bulk.willSkip}</strong>{' '}
                  {dictionary.humanResources.leaveTypes.form.bulk.employeesCount.replace(
                    '{count}',
                    String(confirmDialog.wouldSkip)
                  )}
                  <Typography
                    variant='caption'
                    display='block'
                    color='text.secondary'
                  >
                    {dictionary.humanResources.leaveTypes.form.bulk.skipNote}
                  </Typography>
                </Typography>
              </Grid>
            )}
          </Grid>
          <Typography variant='body2' color='warning.main' sx={{ mt: 2 }}>
            {dictionary.humanResources.leaveTypes.form.bulk.warning}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelBulkUpdate} variant='outlined'>
            {dictionary.humanResources.leaveTypes.form.buttons.cancel}
          </Button>
          <Button
            onClick={handleConfirmBulkUpdate}
            variant='contained'
            color='warning'
          >
            {dictionary.humanResources.leaveTypes.form.buttons.continue}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LeaveTypeForm;
