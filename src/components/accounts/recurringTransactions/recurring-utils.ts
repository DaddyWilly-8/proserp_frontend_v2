import dayjs from 'dayjs';

export type ScheduleTransactionType = 'journal_voucher' | 'payment' | 'receipt' | 'fund_transfer';

export type ScheduleForm = {
  name: string;
  amount_mode: 'fixed' | 'total';
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  repeat_every: number;
  weekdays: number[];
  month_end: boolean;
  start_date: string;
  post_time: string;
  end_mode: 'never' | 'date' | 'count';
  end_date: string;
  max_occurrences: number | '';
};

// Order shown in the picker (Monday first); values are the backend's
// 0 = Sunday .. 6 = Saturday.
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export const emptyScheduleForm = (name: string, startDate?: string): ScheduleForm => ({
  name,
  amount_mode: 'fixed',
  frequency: 'monthly',
  repeat_every: 1,
  weekdays: [],
  month_end: false,
  start_date: startDate ?? dayjs().format('YYYY-MM-DD'),
  post_time: '00:00',
  end_mode: 'count',
  end_date: '',
  max_occurrences: 12,
});

// A copy of an existing transaction is the first period already, so the
// schedule starts a month on from it, but never in the past.
export const defaultStartDate = (transactionDate?: string) => {
  const oneMonthOn = dayjs(transactionDate).add(1, 'month');
  return (oneMonthOn.isValid() && oneMonthOn.isAfter(dayjs(), 'day') ? oneMonthOn : dayjs()).format('YYYY-MM-DD');
};

export const scheduleFormFromSchedule = (schedule: any): ScheduleForm => ({
  name: schedule.name,
  amount_mode: schedule.amount_mode,
  frequency: schedule.frequency,
  repeat_every: schedule.repeat_every,
  weekdays: schedule.weekdays ?? [],
  month_end: !!schedule.month_end,
  start_date: dayjs(schedule.start_date).format('YYYY-MM-DD'),
  post_time: (schedule.post_time ?? '00:00').slice(0, 5),
  end_mode: schedule.end_date ? 'date' : schedule.max_occurrences ? 'count' : 'never',
  end_date: schedule.end_date ? dayjs(schedule.end_date).format('YYYY-MM-DD') : '',
  max_occurrences: schedule.max_occurrences ?? '',
});

export const toSchedulePayload = (form: ScheduleForm) => {
  // A total spread over periods ends by itself after that many periods.
  const endMode = form.amount_mode === 'total' ? 'count' : form.end_mode;

  return {
    name: form.name.trim(),
    amount_mode: form.amount_mode,
    frequency: form.frequency,
    repeat_every: Number(form.repeat_every),
    weekdays: form.frequency === 'weekly' && form.weekdays.length ? form.weekdays : undefined,
    month_end: form.frequency === 'monthly' ? form.month_end : false,
    start_date: form.start_date,
    post_time: form.post_time || '00:00',
    end_date: endMode === 'date' && form.end_date ? form.end_date : null,
    max_occurrences: endMode === 'count' && form.max_occurrences ? Number(form.max_occurrences) : null,
  };
};

export const isScheduleFormComplete = (form: ScheduleForm) => {
  const endMode = form.amount_mode === 'total' ? 'count' : form.end_mode;

  return (
    form.name.trim() !== '' &&
    !!form.start_date &&
    Number(form.repeat_every) >= 1 &&
    (endMode !== 'count' || Number(form.max_occurrences) >= 1) &&
    (endMode !== 'date' || !!form.end_date)
  );
};

// Whether the "Repeat" action applies. The server is the real gate; this just
// keeps the menu from offering something it will refuse: cancelled
// transactions, ones another module or schedule generated (the backend sets
// system_source / editable=false for them) and payments raised from a
// requisition.
export const canRepeatTransaction = (transaction: any) =>
  !transaction.cancelled_at &&
  !transaction.system_source &&
  !transaction.is_system_generated &&
  !transaction.requisition_approval_id &&
  transaction.editable !== false;

// Turns a transaction form's values plus the schedule fields into the body
// the create endpoint expects. The forms keep the bank/source side at the top
// level (credit for payments and transfers, debit for receipts); the server
// wants it as header_ledger_id and each line as both ledgers, so only the
// line fields it reads are sent.
export const buildScheduleBody = (type: ScheduleTransactionType, values: any, schedule: ScheduleForm) => ({
  ...toSchedulePayload(schedule),
  transaction_type: type,
  narration: values.narration,
  currency_id: values.currency_id,
  exchange_rate: values.exchange_rate,
  cost_centers: (values.cost_centers ?? []).map((costCenter: any) => ({ id: costCenter.id })),
  header_ledger_id:
    type === 'receipt' ? values.debit_ledger_id : type === 'journal_voucher' ? undefined : values.credit_ledger_id,
  items: (values.items ?? []).map((item: any) => ({
    debit_ledger_id: item.debit_ledger_id,
    credit_ledger_id: item.credit_ledger_id,
    amount: item.amount,
    description: item.description,
  })),
});
