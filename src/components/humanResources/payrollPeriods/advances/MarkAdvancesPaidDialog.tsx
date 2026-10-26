'use client';

import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import humanResourcesServices from '../../humanResourcesServices';

/**
 * The no-Accounts-org path — records that a period's advances were paid by
 * hand (cash, mobile money, a transfer made outside the system), with no
 * Payment/Journal. Mirrors LoanMarkDisbursedForm.tsx.
 */
const MarkAdvancesPaidDialog = ({
  open,
  onClose,
  payrollPeriodId,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  payrollPeriodId: number;
  onSuccess?: () => void;
}) => {
  const dictionary = useDictionary();
  const t = dictionary.humanResources.payrollPeriods;
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const [reference, setReference] = useState('');
  const [date, setDate] = useState(dayjs().toISOString());

  useEffect(() => {
    if (!open) return;
    setReference('');
    setDate(dayjs().toISOString());
  }, [open]);

  const { mutate: markPaid, isPending } = useMutation({
    mutationFn: () =>
      humanResourcesServices.markAdvancesPaid({
        id: payrollPeriodId,
        reference: reference || undefined,
        date: date || undefined,
      }),
    onSuccess: (response: any) => {
      enqueueSnackbar(response?.message || t.advances.markPaid.marked, {
        variant: 'success',
      });
      queryClient.invalidateQueries({
        queryKey: ['periodAdvances', String(payrollPeriodId)],
      });
      onSuccess?.();
      onClose();
    },
    onError: (error: any) =>
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth='xs'
      fullScreen={belowLargeScreen}
      scroll={belowLargeScreen ? 'body' : 'paper'}
    >
      <DialogTitle>{t.advances.markPaid.title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant='body2' color='text.secondary'>
            {t.advances.markPaid.intro}
          </Typography>

          <TextField
            label={t.advances.markPaid.reference}
            placeholder={t.advances.markPaid.referencePlaceholder}
            size='small'
            fullWidth
            multiline
            minRows={2}
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
          <DateTimePicker
            label={t.advances.paymentDateTime}
            value={date ? dayjs(date) : null}
            onChange={(val) => setDate(val?.toISOString() || '')}
            slotProps={{
              textField: { size: 'small', fullWidth: true },
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isPending}>
          {t.common.cancel}
        </Button>
        <LoadingButton
          loading={isPending}
          variant='contained'
          color='success'
          size='small'
          onClick={() => markPaid()}
        >
          {t.advances.markPaid.button}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default MarkAdvancesPaidDialog;
