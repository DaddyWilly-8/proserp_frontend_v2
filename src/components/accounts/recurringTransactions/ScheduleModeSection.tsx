import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { Alert, Divider, FormControlLabel, Switch } from '@mui/material';
import React from 'react';
import RecurringScheduleFields from './RecurringScheduleFields';
import { ScheduleForm } from './recurring-utils';

interface ScheduleModeSectionProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  form: ScheduleForm;
  setForm: React.Dispatch<React.SetStateAction<ScheduleForm>>;
  // Text to suggest as the schedule's name when it is first switched on.
  narration?: string;
  // Editing an existing transaction never turns it into a schedule.
  hidden?: boolean;
}

// Sits at the bottom of the journal, payment, receipt and transfer forms. When
// switched on, submitting the form creates a schedule from what was entered
// instead of posting the transaction now.
const ScheduleModeSection: React.FC<ScheduleModeSectionProps> = ({ enabled, onEnabledChange, form, setForm, narration, hidden }) => {
  const dictionary = useDictionary();
  const t = dictionary.recurringTransactions.form;
  const { checkOrganizationPermission } = useJumboAuth();

  if (hidden || !checkOrganizationPermission([PERMISSIONS.RECURRING_TRANSACTIONS_CREATE])) return null;

  return (
    <>
      <Divider sx={{ my: 1 }} />
      <FormControlLabel
        control={
          <Switch
            checked={enabled}
            onChange={(e) => {
              onEnabledChange(e.target.checked);
              if (e.target.checked && !form.name && narration) setForm((current) => ({ ...current, name: narration.slice(0, 255) }));
            }}
          />
        }
        label={t.scheduleMode.toggle}
      />
      {enabled && (
        <>
          <Alert severity="info" sx={{ mt: 1 }}>
            {t.scheduleMode.info}
          </Alert>
          <RecurringScheduleFields form={form} setForm={setForm} />
        </>
      )}
    </>
  );
};

export default ScheduleModeSection;
