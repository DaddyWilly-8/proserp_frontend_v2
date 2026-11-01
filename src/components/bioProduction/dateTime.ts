import dayjs from 'dayjs';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';

/** The moment now, as the date and time every Bio Production record is entered and sent with. */
export const nowStamp = () => dayjs().format('YYYY-MM-DD HH:mm:ss');

/**
 * A record's date and time for display. Records made before times were kept sit at midnight, so a
 * time of 00:00 is left off and they still read as plain dates.
 */
export const stamp = (value?: string | null) => {
  if (!value) return '—';

  return readableDate(value, dayjs(value).format('HH:mm') !== '00:00');
};
