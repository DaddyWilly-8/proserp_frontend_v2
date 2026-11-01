import { BioProductionUnit } from './types';

/**
 * Whether a unit is set up for a species at a stage, as the server decides it: a unit listing nothing takes
 * anything, and a species listed with no stages takes every stage (stages matched by name, ignoring case).
 */
export const unitSuits = (unit: BioProductionUnit | undefined, templateId?: number | null, stageName?: string | null): boolean => {
  const list = unit?.suitability ?? [];
  if (!list.length || !templateId || !stageName) return true;

  return list.some(
    (entry) => entry.species_template_id === templateId && (!entry.stages.length || entry.stages.some((name) => name.trim().toLowerCase() === stageName.trim().toLowerCase()))
  );
};
