import dayjs from 'dayjs';

/**
 * The one date format used across bank reconciliation — dd/mm/yyyy, matching
 * how dates are actually written here (and how bank statements are
 * imported), rather than `toLocaleDateString()`'s browser-locale format
 * (which reads as mm/dd/yyyy for anyone on an en-US locale).
 */
export const formatDate = (date: string | Date | null | undefined): string =>
  date ? dayjs(date).format('DD/MM/YYYY') : '';

/**
 * Calendar-day gap between a book entry's date and the statement line it's
 * matched to — positive when the book entry is earlier (bank settled late),
 * negative when it's later (bank settled early), null when either date is
 * missing. Compares calendar days only (startOf('day')), so a same-day match
 * with different times of day still reads as 0, not ±1 from rounding.
 */
export const daysBetween = (
  bookDate: string | Date | null | undefined,
  statementDate: string | Date | null | undefined
): number | null =>
  bookDate && statementDate
    ? dayjs(statementDate).startOf('day').diff(dayjs(bookDate).startOf('day'), 'day')
    : null;
