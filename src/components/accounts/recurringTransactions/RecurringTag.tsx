import { Chip, Tooltip } from '@mui/material';
import React from 'react';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

// The backend's wording for a transaction a Recurring Schedule generated
// (see Transaction::isScheduled and JournalVoucher::systemSource).
export const RECURRING_SOURCE = 'a Recurring Schedule';

// Marks a transaction that was posted automatically by a recurring schedule,
// so it is recognisable wherever transactions are listed or shown.
const RecurringTag: React.FC = () => {
  const dictionary = useDictionary();
  return (
  <Tooltip title={dictionary.tooltips.postedAutomaticallyByARecurringSchedule}>
    <Chip label='Recurring' size='small' color='info' variant='outlined' sx={{ ml: 1, height: 18, fontSize: 11 }} />
  </Tooltip>
);
};

export default RecurringTag;
