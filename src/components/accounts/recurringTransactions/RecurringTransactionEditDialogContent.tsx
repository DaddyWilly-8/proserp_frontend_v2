import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { LoadingButton } from '@mui/lab';
import { Alert, Button, DialogActions, DialogContent, DialogTitle, Skeleton } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import RecurringScheduleFields from './RecurringScheduleFields';
import recurringTransactionServices from './recurringTransactions-services';
import { isScheduleFormComplete, ScheduleForm, scheduleFormFromSchedule, toSchedulePayload } from './recurring-utils';

interface RecurringTransactionEditDialogContentProps {
  scheduleId: number;
  onClose: () => void;
}

// Edits when and how often. The lines stay as they were copied; to change
// them, create a new schedule from a corrected transaction.
const RecurringTransactionEditDialogContent: React.FC<RecurringTransactionEditDialogContentProps> = ({ scheduleId, onClose }) => {
  const dictionary = useDictionary();
  const t = dictionary.recurringTransactions.form;
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ScheduleForm | null>(null);

  const { data: schedule } = useQuery({
    queryKey: ['recurringTransaction', scheduleId],
    queryFn: () => recurringTransactionServices.show(scheduleId),
  });

  useEffect(() => {
    if (schedule) setForm(scheduleFormFromSchedule(schedule));
  }, [schedule]);

  const save = useMutation({
    mutationFn: () => {
      const payload = schedule.payload;

      // The update endpoint takes the same shape as creation, so the stored
      // lines are sent back unchanged along with the edited schedule.
      return recurringTransactionServices.update({
        id: scheduleId,
        body: {
          ...toSchedulePayload(form as ScheduleForm),
          narration: payload.narration,
          currency_id: payload.currency_id,
          exchange_rate: payload.exchange_rate,
          header_ledger_id: payload.header_ledger_id,
          cost_centers: payload.cost_center_ids.map((id: number) => ({ id })),
          items: payload.items,
        },
      });
    },
    onSuccess: (data: any) => {
      enqueueSnackbar(data.message ?? t.messages.updated, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['recurringTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['recurringTransaction', scheduleId] });
      onClose();
    },
    onError: (error: any) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const structureLocked = (schedule?.occurrences_count ?? 0) > 0;

  return (
    <>
      <DialogTitle>{t.editTitle}</DialogTitle>
      <DialogContent>
        {!form ? (
          <Skeleton variant="rectangular" height={240} />
        ) : (
          <>
            {structureLocked && <Alert severity="info" sx={{ mb: 1 }}>{t.helper.locked}</Alert>}
            <RecurringScheduleFields form={form} setForm={setForm as React.Dispatch<React.SetStateAction<ScheduleForm>>} structureLocked={structureLocked} />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button size="small" onClick={onClose}>
          {t.buttons.cancel}
        </Button>
        <LoadingButton
          size="small"
          variant="contained"
          loading={save.isPending}
          disabled={!form || !isScheduleFormComplete(form)}
          onClick={() => save.mutate()}
        >
          {t.buttons.save}
        </LoadingButton>
      </DialogActions>
    </>
  );
};

export default RecurringTransactionEditDialogContent;
