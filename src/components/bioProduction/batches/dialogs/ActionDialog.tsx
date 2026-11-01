'use client'

import React from 'react';
import { LoadingButton } from '@mui/lab';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, useMediaQuery } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';


/**
 * The platform's date and time picker (MUI X DateTimePicker, 24-hour locale set in the app providers), bound to a
 * react-hook-form field as a 'YYYY-MM-DD HH:mm:ss' string. It cannot be set later than now.
 */
export function FormDate<T extends FieldValues>({ control, name, label, minDate }: { control: Control<T>; name: Path<T>; label: string; minDate?: string | null }) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <DateTimePicker
          label={label}
          value={field.value ? dayjs(field.value) : null}
          minDateTime={minDate ? dayjs(minDate) : undefined}
          maxDateTime={dayjs()}
          ampm={false}
          onChange={(value) => field.onChange(value?.isValid() ? value.format('YYYY-MM-DD HH:mm:ss') : '')}
          slotProps={{ textField: { size: 'small', fullWidth: true, error: !!fieldState.error, helperText: fieldState.error?.message } }}
        />
      )}
    />
  );
}

/** Runs a batch action, then refreshes everything the batch page shows. */
export function useBatchAction<TVars>(batchId: number, mutationFn: (vars: TVars) => Promise<{ message: string }>, onDone: () => void) {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      onDone();
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['bioBatch', batchId] });
      queryClient.invalidateQueries({ queryKey: ['bioBatchInputs', batchId] });
      queryClient.invalidateQueries({ queryKey: ['bioBatchExpenses', batchId] });
      queryClient.invalidateQueries({ queryKey: ['bioBatchMortalities', batchId] });
      queryClient.invalidateQueries({ queryKey: ['bioBatchProduce', batchId] });
      queryClient.invalidateQueries({ queryKey: ['bioBatchSummary', batchId] });
      queryClient.invalidateQueries({ queryKey: ['bioWriteOffPreview', batchId] });
      queryClient.invalidateQueries({ queryKey: ['bioBatches'] });
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });
}

interface ActionDialogProps {
  open: boolean;
  title: string;
  help?: string;
  submitLabel?: string;
  loading?: boolean;
  disableSubmit?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md';
  onClose: () => void;
  onSubmit: () => void;
  children: React.ReactNode;
}

const ActionDialog = ({ open, title, help, submitLabel, loading, disableSubmit, maxWidth = 'sm', onClose, onSubmit, children }: ActionDialogProps) => {
  const common = useDictionary().bioProduction.common;
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  return (
    <Dialog open={open} fullWidth maxWidth={maxWidth} fullScreen={belowLargeScreen} onClose={onClose}>
      <DialogTitle textAlign='center'>{title}</DialogTitle>
      <DialogContent sx={{ pt: '10px !important' }}>
        <form
          autoComplete='off'
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          {help && <Alert severity='info' sx={{ mb: 2 }}>{help}</Alert>}
          {children}
          <DialogActions sx={{ mt: 1 }}>
            <Button size='small' onClick={onClose}>{common.cancel}</Button>
            <LoadingButton type='submit' variant='contained' size='small' loading={loading} disabled={disableSubmit}>
              {submitLabel ?? common.submit}
            </LoadingButton>
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ActionDialog;
