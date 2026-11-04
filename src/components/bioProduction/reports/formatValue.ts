import { ColumnType } from './reportTypes';

/** A report cell as text: blank for no value, thousands separators, and the decimals of its kind. */
export const formatValue = (value: unknown, type: ColumnType): string => {
  if (value === null || value === undefined || value === '') return type === 'text' ? '' : '—';
  if (type === 'text') return String(value);

  const number = Number(value);
  if (Number.isNaN(number)) return String(value);
  if (type === 'integer') return number.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (type === 'percent') return `${number.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

  return number.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
