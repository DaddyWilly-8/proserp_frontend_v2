'use client'

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import BioSelect from '../../BioSelect';
import { productionUnitServices } from '../../bio-production-services';
import { BioProductionUnit } from '../../types';
import { unitOccupancy } from '../../unitOccupancy';
import { unitSuits } from '../../unitSuitability';
import { Batch } from '../batchTypes';

/** The active units on the batch's own farm, with who is in each. */
export const useFarmUnits = (batch: Batch) =>
  useQuery<{ data: BioProductionUnit[] }>({
    queryKey: ['bioFarmUnits', batch.farm_id],
    queryFn: () => productionUnitServices.getList({ farm_id: batch.farm_id, status: 'active', limit: 2000 }),
  });

interface UnitChoiceProps {
  batch: Batch;
  label: string;
  value?: number | '' | null;
  onChange: (unitId: number | '') => void;
  error?: boolean;
  helperText?: string;
  /** The stage the batch will be in once it is in the unit; units not set up for its species at that stage are shown but cannot be chosen. */
  stageName?: string | null;
}

/**
 * A searchable list of the farm's other units. A unit that is already at its limit is shown but cannot
 * be chosen, with the batches in it beside it; the server refuses it too.
 */
const UnitChoice = React.forwardRef<HTMLInputElement, UnitChoiceProps>(({ batch, label, value, onChange, error, helperText, stageName }, ref) => {
  const text = useDictionary().bioProduction.batches.labels;
  const { data, isLoading } = useFarmUnits(batch);

  const options = (data?.data ?? [])
    .filter((unit) => unit.id !== batch.production_unit_id)
    .map((unit) => {
      const { held, max, full, names } = unitOccupancy(unit);
      const suits = unitSuits(unit, batch.species_template_id, stageName ?? batch.current_stage?.name);

      return {
        value: unit.id,
        label: unit.name,
        disabled: full || !suits,
        hint: !suits ? text.notSetUp.replace('{species}', batch.species_template?.name ?? '').replace('{stage}', stageName ?? batch.current_stage?.name ?? '') : full ? text.occupiedBy.replace('{batches}', names) : held > 0 ? text.partlyOccupied.replace('{held}', String(held)).replace('{max}', String(max)) : undefined,
      };
    });

  return (
    <BioSelect
      ref={ref}
      label={label}
      loading={isLoading}
      options={options}
      value={value}
      onChange={(unitId) => onChange(unitId as number | '')}
      error={error}
      helperText={helperText}
    />
  );
});
UnitChoice.displayName = 'UnitChoice';

export default UnitChoice;
