import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { LoadingButton } from '@mui/lab';
import { Button, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import RecurringScheduleFields from './RecurringScheduleFields';
import recurringTransactionServices from './recurringTransactions-services';
import {
  defaultStartDate,
  emptyScheduleForm,
  isScheduleFormComplete,
  ScheduleForm,
  ScheduleTransactionType,
  toSchedulePayload,
} from './recurring-utils';

interface RepeatTransactionDialogContentProps {
  type: ScheduleTransactionType;
  transaction: any;
  onClose: () => void;
}

// Sets up a schedule from a transaction that already exists: the server
// copies its lines, ledgers, currency and cost centers as they are now, so
// the user only chooses when and how often.
const RepeatTransactionDialogContent: React.FC<RepeatTransactionDialogContentProps> = ({ type, transaction, onClose }) => {
  const dictionary = useDictionary();
  const t = dictionary.recurringTransactions.form;
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<ScheduleForm>(() =>
    emptyScheduleForm(
      [transaction.voucherNo, transaction.narration].filter(Boolean).join(' - '),
      defaultStartDate(transaction.transaction_date)
    )
  );

  const create = useMutation({
    mutationFn: () =>
      recurringTransactionServices.createFromTransaction({
        type,
        id: transaction.id,
        schedule: toSchedulePayload(form),
      }),
    onSuccess: (data: any) => {
      enqueueSnackbar(data.message ?? t.messages.created, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['recurringTransactions'] });
      onClose();
    },
    onError: (error: any) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  return (
    <>
      <DialogTitle>{t.repeatTitle}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          {t.repeatIntro.replace('{voucherNo}', transaction.voucherNo)}
        </Typography>
        <RecurringScheduleFields form={form} setForm={setForm} />
      </DialogContent>
      <DialogActions>
        <Button size="small" onClick={onClose}>
          {t.buttons.cancel}
        </Button>
        <LoadingButton
          size="small"
          variant="contained"
          loading={create.isPending}
          disabled={!isScheduleFormComplete(form)}
          onClick={() => create.mutate()}
        >
          {t.buttons.create}
        </LoadingButton>
      </DialogActions>
    </>
  );
};

export default RepeatTransactionDialogContent;
