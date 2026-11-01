import { BioMeasurementParameter, MeasurementStatus } from '../types';

/** A range as text: "4 – …" for a lower limit only, "… – 9" for an upper one only, "—" for neither. */
export const rangeText = (min?: number | null, max?: number | null) => (min == null && max == null ? '—' : `${min ?? '…'} – ${max ?? '…'}`);

/** Where a value stands against a parameter's limits: the same rule the server applies. */
export const statusOf = (parameter: Pick<BioMeasurementParameter, 'watch_min' | 'watch_max' | 'critical_min' | 'critical_max'>, value: number): MeasurementStatus => {
  const outside = (min?: number | null, max?: number | null) => (min != null && value < min) || (max != null && value > max);

  return outside(parameter.critical_min, parameter.critical_max) ? 'critical' : outside(parameter.watch_min, parameter.watch_max) ? 'watch' : 'ok';
};

export const statusColor = (status: MeasurementStatus): 'success' | 'warning' | 'error' => (status === 'critical' ? 'error' : status === 'watch' ? 'warning' : 'success');
