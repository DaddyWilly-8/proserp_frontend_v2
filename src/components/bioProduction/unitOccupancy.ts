export interface UnitWithOccupancy {
  max_batches?: number;
  open_batches?: { id: number; batchNo?: string }[];
}

/** How full a production unit is, from the batches it currently holds. */
export const unitOccupancy = (unit: UnitWithOccupancy) => {
  const batches = unit.open_batches ?? [];
  const max = unit.max_batches ?? 1;

  return { held: batches.length, max, full: batches.length >= max, names: batches.map((batch) => batch.batchNo).filter(Boolean).join(', ') };
};
