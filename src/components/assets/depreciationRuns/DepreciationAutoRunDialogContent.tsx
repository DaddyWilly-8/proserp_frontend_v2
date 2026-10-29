import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import UsersSelector from '@/components/sharedComponents/UsersSelector';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  MenuItem,
  Skeleton,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import depreciationRunsServices from './depreciationRuns-services';

interface DepreciationAutoRunDialogContentProps {
  onClose: () => void;
}

type PickedUser = { id: number; name: string };

type Form = {
  enabled: boolean;
  timing: 'month_end' | 'day';
  run_day: number | '';
  start_month: string;
  narration: string;
  posting_user: PickedUser | null;
  notify_users: PickedUser[];
  notify_on_posted: boolean;
  notify_on_skipped: boolean;
};

const monthLabel = (month?: string | null) => (month ? dayjs(`${month}-01`).format('MMMM YYYY') : '-');

// The organization's auto-run template: nothing is posted automatically until
// it is switched on here, and everything about how it runs is set here too.
const DepreciationAutoRunDialogContent: React.FC<DepreciationAutoRunDialogContentProps> = ({ onClose }) => {
  const dictionary = useDictionary();
  const t = dictionary.depreciationRuns.autoRun;
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Form | null>(null);

  const { data: template } = useQuery({
    queryKey: ['depreciationTemplate'],
    queryFn: () => depreciationRunsServices.getTemplate(),
  });

  useEffect(() => {
    if (!template) return;

    setForm({
      enabled: template.enabled,
      timing: template.run_day ? 'day' : 'month_end',
      run_day: template.run_day ?? 5,
      start_month: template.start_month ?? '',
      narration: template.narration,
      posting_user: template.posting_user,
      notify_users: template.notify_users,
      notify_on_posted: template.notify_on_posted,
      notify_on_skipped: template.notify_on_skipped,
    });
  }, [template]);

  const save = useMutation({
    mutationFn: () => {
      const f = form as Form;

      return depreciationRunsServices.saveTemplate({
        enabled: f.enabled,
        run_day: f.timing === 'day' ? Number(f.run_day) : null,
        start_month: f.start_month || null,
        narration: f.narration.trim(),
        posting_user_id: f.posting_user?.id,
        notify_user_ids: f.notify_users.map((user) => user.id),
        notify_on_posted: f.notify_on_posted,
        notify_on_skipped: f.notify_on_skipped,
      });
    },
    onSuccess: (data: any) => {
      enqueueSnackbar(data.message ?? t.messages.saved, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['depreciationTemplate'] });
      onClose();
    },
    onError: (error: any) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const update = (changes: Partial<Form>) => setForm((current) => (current ? { ...current, ...changes } : current));

  const needsStartMonth = !!form?.enabled && !template?.latest_posted_period;
  const dayInvalid = form?.timing === 'day' && !(Number(form.run_day) >= 1 && Number(form.run_day) <= 28);
  const incomplete =
    !form ||
    !form.narration.trim() ||
    !form.posting_user ||
    dayInvalid ||
    (needsStartMonth && !form.start_month);

  return (
    <>
      <DialogTitle>{t.title}</DialogTitle>
      <DialogContent>
        {!form ? (
          <Skeleton variant="rectangular" height={260} />
        ) : (
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">{t.intro}</Typography>

            {!template.exists && <Alert severity="info">{t.notSetUp}</Alert>}
            {template.last_error && (
              <Alert severity="error">
                {t.labels.lastProblem} ({monthLabel(template.last_error_period)}): {template.last_error}
              </Alert>
            )}

            <FormControlLabel
              control={<Switch checked={form.enabled} onChange={(e) => update({ enabled: e.target.checked })} />}
              label={t.labels.enabled}
            />

            <Grid container columnSpacing={2} rowSpacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label={t.labels.timing}
                  value={form.timing}
                  helperText={form.timing === 'day' ? t.helper.dayOfNextMonth : t.helper.monthEnd}
                  onChange={(e) => update({ timing: e.target.value as Form['timing'] })}
                >
                  <MenuItem value="month_end">{t.labels.monthEnd}</MenuItem>
                  <MenuItem value="day">{t.labels.dayOfNextMonth}</MenuItem>
                </TextField>
              </Grid>
              {form.timing === 'day' && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label={t.labels.runDay}
                    value={form.run_day}
                    error={dayInvalid}
                    slotProps={{ htmlInput: { min: 1, max: 28 } }}
                    onChange={(e) => update({ run_day: e.target.value === '' ? '' : Number(e.target.value) })}
                  />
                </Grid>
              )}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="month"
                  label={t.labels.startMonth}
                  value={form.start_month}
                  error={needsStartMonth && !form.start_month}
                  helperText={needsStartMonth ? t.helper.startMonthRequired : t.helper.startMonth}
                  onChange={(e) => update({ start_month: e.target.value })}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  size="small"
                  label={t.labels.narration}
                  value={form.narration}
                  helperText={t.helper.narration}
                  onChange={(e) => update({ narration: e.target.value })}
                />
              </Grid>
              <Grid size={12}>
                <UsersSelector
                  label={t.labels.postedAs}
                  value={form.posting_user}
                  onChange={(value) => update({ posting_user: (value as PickedUser) ?? null })}
                />
              </Grid>
            </Grid>

            <Stack>
              <FormControlLabel
                control={<Switch checked={form.notify_on_posted} onChange={(e) => update({ notify_on_posted: e.target.checked })} />}
                label={t.labels.notifyPosted}
              />
              <FormControlLabel
                control={<Switch checked={form.notify_on_skipped} onChange={(e) => update({ notify_on_skipped: e.target.checked })} />}
                label={t.labels.notifySkipped}
              />
            </Stack>
            <UsersSelector
              multiple
              label={t.labels.notifyUsers}
              value={form.notify_users}
              onChange={(value) => update({ notify_users: (value as PickedUser[]) ?? [] })}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: '-8px !important' }}>
              {t.helper.notifyUsers}
            </Typography>

            <Stack spacing={0.5}>
              <Typography variant="body2">{t.labels.latestPosted}: {monthLabel(template.latest_posted_period)}</Typography>
              {form.enabled && <Typography variant="body2">{t.labels.nextMonth}: {monthLabel(template.next_period)}</Typography>}
              <Typography variant="body2">
                {t.labels.lastRun}: {template.last_run_at ? dayjs(template.last_run_at).format('DD MMM YYYY HH:mm') : '-'}
              </Typography>
            </Stack>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button size="small" onClick={onClose}>{t.buttons.cancel}</Button>
        <LoadingButton size="small" variant="contained" loading={save.isPending} disabled={incomplete} onClick={() => save.mutate()}>
          {t.buttons.save}
        </LoadingButton>
      </DialogActions>
    </>
  );
};

export default DepreciationAutoRunDialogContent;
