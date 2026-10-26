import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import {
  Alert,
  FormControlLabel,
  Grid,
  MenuItem,
  Radio,
  RadioGroup,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import React from 'react';
import { ScheduleForm, WEEKDAY_ORDER } from './recurring-utils';

interface RecurringScheduleFieldsProps {
  form: ScheduleForm;
  setForm: React.Dispatch<React.SetStateAction<ScheduleForm>>;
  // Once a schedule has posted, its shape is history: only the name and the
  // end can move (and in total mode, not even the end).
  structureLocked?: boolean;
}

const RecurringScheduleFields: React.FC<RecurringScheduleFieldsProps> = ({ form, setForm, structureLocked = false }) => {
  const dictionary = useDictionary();
  const t = dictionary.recurringTransactions.form;
  const isTotal = form.amount_mode === 'total';
  const endMode = isTotal ? 'count' : form.end_mode;
  const endLocked = structureLocked && isTotal;

  const update = (changes: Partial<ScheduleForm>) => setForm((current) => ({ ...current, ...changes }));

  return (
    <Grid container columnSpacing={2} rowSpacing={2} sx={{ mt: 0.5 }}>
      <Grid size={12}>
        <TextField
          fullWidth
          size="small"
          label={t.labels.name}
          value={form.name}
          onChange={(e) => update({ name: e.target.value })}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          select
          fullWidth
          size="small"
          label={t.labels.amountMode}
          value={form.amount_mode}
          disabled={structureLocked}
          onChange={(e) => update({ amount_mode: e.target.value as ScheduleForm['amount_mode'] })}
        >
          <MenuItem value="fixed">{t.labels.fixed}</MenuItem>
          <MenuItem value="total">{t.labels.total}</MenuItem>
        </TextField>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          size="small"
          type="date"
          label={t.labels.startDate}
          value={form.start_date}
          disabled={structureLocked}
          onChange={(e) => update({ start_date: e.target.value })}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Grid>
      <Grid size={12}>
        <Alert severity="info" icon={false}>
          {isTotal ? t.helper.total : t.helper.fixed}
        </Alert>
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          size="small"
          type="time"
          label={t.labels.postTime}
          value={form.post_time}
          helperText={t.helper.postTime}
          onChange={(e) => update({ post_time: e.target.value })}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          select
          fullWidth
          size="small"
          label={t.labels.frequency}
          value={form.frequency}
          disabled={structureLocked}
          onChange={(e) => update({ frequency: e.target.value as ScheduleForm['frequency'] })}
        >
          {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((frequency) => (
            <MenuItem key={frequency} value={frequency}>
              {t.frequencies[frequency]}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          size="small"
          type="number"
          label={`${t.labels.repeatEvery} (${t.units[form.frequency]})`}
          value={form.repeat_every}
          disabled={structureLocked}
          slotProps={{ htmlInput: { min: 1, max: 366 } }}
          onChange={(e) => update({ repeat_every: Number(e.target.value) })}
        />
      </Grid>

      {form.frequency === 'weekly' && (
        <Grid size={12}>
          <Typography variant="caption" color="text.secondary">
            {t.labels.weekdays}
          </Typography>
          <ToggleButtonGroup
            fullWidth
            size="small"
            color="primary"
            value={form.weekdays}
            disabled={structureLocked}
            onChange={(_, weekdays) => update({ weekdays })}
          >
            {WEEKDAY_ORDER.map((day) => (
              <ToggleButton key={day} value={day}>
                {t.weekdays[day]}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <Typography variant="caption" color="text.secondary">
            {t.helper.weekdays}
          </Typography>
        </Grid>
      )}

      {form.frequency === 'monthly' && (
        <Grid size={12}>
          <FormControlLabel
            control={
              <Switch
                checked={form.month_end}
                disabled={structureLocked}
                onChange={(e) => update({ month_end: e.target.checked })}
              />
            }
            label={t.labels.monthEnd}
          />
        </Grid>
      )}

      <Grid size={12}>
        <Typography variant="caption" color="text.secondary">
          {isTotal ? t.labels.periods : t.labels.ends}
        </Typography>
        {!isTotal && (
          <RadioGroup row value={endMode} onChange={(e) => update({ end_mode: e.target.value as ScheduleForm['end_mode'] })}>
            <FormControlLabel value="count" control={<Radio size="small" />} label={t.labels.afterCount} />
            <FormControlLabel value="date" control={<Radio size="small" />} label={t.labels.onDate} />
            <FormControlLabel value="never" control={<Radio size="small" />} label={t.labels.never} />
          </RadioGroup>
        )}
      </Grid>
      {endMode === 'count' && (
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            size="small"
            type="number"
            label={isTotal ? t.labels.periods : t.labels.occurrences}
            value={form.max_occurrences}
            disabled={endLocked}
            slotProps={{ htmlInput: { min: 1 } }}
            onChange={(e) => update({ max_occurrences: e.target.value === '' ? '' : Number(e.target.value) })}
          />
        </Grid>
      )}
      {endMode === 'date' && (
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            size="small"
            type="date"
            label={t.labels.endDate}
            value={form.end_date}
            onChange={(e) => update({ end_date: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
      )}
      {endMode === 'never' && (
        <Grid size={12}>
          <Alert severity="warning" icon={false}>
            {t.helper.never}
          </Alert>
        </Grid>
      )}

      {!structureLocked && form.start_date && dayjs(form.start_date).isBefore(dayjs(), 'day') && (
        <Grid size={12}>
          <Alert severity="warning">{t.helper.pastStart}</Alert>
        </Grid>
      )}
    </Grid>
  );
};

export default RecurringScheduleFields;
