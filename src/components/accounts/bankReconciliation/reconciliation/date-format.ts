import dayjs from 'dayjs';

/**
 * The one date format used across bank reconciliation — dd/mm/yyyy, matching
 * how dates are actually written here (and how bank statements are
 * imported), rather than `toLocaleDateString()`'s browser-locale format
 * (which reads as mm/dd/yyyy for anyone on an en-US locale).
 */
export const formatDate = (date: string | Date | null | undefined): string =>
  date ? dayjs(date).format('DD/MM/YYYY') : '';
