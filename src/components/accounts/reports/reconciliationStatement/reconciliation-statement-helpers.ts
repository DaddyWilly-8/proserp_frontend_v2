import { formatDate } from '../../bankReconciliation/reconciliation/date-format';

export const formatAmount = (amount: number) =>
  Number(amount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Plain-text flag names for the PDF and Excel: the on-screen symbols
// (✔ ✖ ◐ ◷ ○) aren't in the PDF's built-in font and render as boxes.
export const FLAG_LABELS: Record<string, string> = {
  reconciled: 'Reconciled',
  unreconciled: 'Unreconciled',
  partial: 'Partly matched',
  outstanding: 'Outstanding',
  ignored: 'Ignored',
};

export const FLAG_ORDER = ['reconciled', 'unreconciled', 'partial', 'outstanding', 'ignored'];

export const VIEW_LABELS: Record<string, string> = {
  both: 'Reconciled and unreconciled',
  reconciled: 'Reconciled only',
  unreconciled: 'Unreconciled only',
};

// "RCPT/00195 · Doyy Beauty · 600,000.00 · 0d · Yohana Edward, 29/10/2026"
export const describeLineMatch = (m: any): string =>
  [
    m.voucher_no || '[no voucher]',
    m.counterparty || m.description,
    formatAmount(m.matched_amount),
    m.days_gap ? `${Math.abs(m.days_gap)}d ${m.days_gap > 0 ? 'earlier' : 'later'}` : null,
    m.matched_by ? `${m.matched_by}, ${formatDate(m.matched_at)}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

// "29/10/2026 · 600,000.00 · Yohana Edward"
export const describeEntryMatch = (l: any): string =>
  [formatDate(l.line_date), formatAmount(l.matched_amount), l.matched_by].filter(Boolean).join(' · ');

export const statementStatusText = (s: any): string =>
  `${formatDate(s.statement_date_from)} – ${formatDate(s.statement_date_to)} · ${s.status}` +
  (s.status === 'completed' && s.completed_by ? ` by ${s.completed_by} on ${formatDate(s.completed_at)}` : '');

// "Bank 368,336,801.40 → 640,896,442.50 · Books 1,325,954,575.67 → 1,471,899,271.90"
export const statementBalancesText = (s: any): string =>
  `Bank ${formatAmount(s.opening_balance)} → ${formatAmount(s.closing_balance)} · Books ${formatAmount(s.book_opening)} → ${formatAmount(s.book_closing)}`;

// The period's opening / movement / closing, bank against books. Null when the
// bank side can't be known (e.g. no statement line up to the end date).
export const balanceRows = (balances: any) => {
  const move = (b: any, k: 'bank' | 'books') =>
    balances.closing?.[k] == null || balances.opening?.[k] == null ? null : balances.closing[k] - balances.opening[k];
  return [
    { label: 'Opening', bank: balances.opening?.bank, books: balances.opening?.books, difference: balances.opening?.difference },
    {
      label: 'Movement',
      bank: move(balances, 'bank'),
      books: move(balances, 'books'),
      difference: move(balances, 'bank') == null ? null : move(balances, 'bank')! - move(balances, 'books')!,
    },
    { label: 'Closing', bank: balances.closing?.bank, books: balances.closing?.books, difference: balances.closing?.difference },
  ];
};

export const optionalAmount = (value: number | null | undefined): string => (value == null ? '—' : formatAmount(value));

export const reportFileName = (reportData: any): string =>
  `Reconciliation Statement ${reportData?.bank_account?.name ?? ''} ${reportData?.from} to ${reportData?.to}`.trim();
