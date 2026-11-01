export type WeightUnit = 'g' | 'kg';

/** Weights are stored in grams; a species is entered and read in its own unit. */
export const normalizeUnit = (unit?: string | null): WeightUnit => (unit === 'kg' ? 'kg' : 'g');

const round = (value: number) => Math.round(value * 1e6) / 1e6;

export const fromGrams = (grams: number, unit?: string | null) => (normalizeUnit(unit) === 'kg' ? round(grams / 1000) : grams);

export const toGrams = (value: number, unit?: string | null) => (normalizeUnit(unit) === 'kg' ? round(value * 1000) : value);

/** A label with its unit, e.g. "Average weight (kg)". */
export const withUnit = (label: string, unit?: string | null) => `${label} (${normalizeUnit(unit)})`;
