export type BioStatus = 'active' | 'inactive';

export interface BioFarm {
  id: number;
  name: string;
  address?: string | null;
  status: BioStatus;
  cost_center_id?: number | null;
  cost_center?: { id: number; name: string; type?: string } | null;
  production_units_count?: number;
  users?: { id: number; name: string; email?: string }[];
  input_categories?: { id: number; name: string }[];
  output_categories?: { id: number; name: string }[];
}

export interface BioProductionUnit {
  id: number;
  farm_id: number;
  name: string;
  type: 'pond' | 'cage' | 'tank' | 'house' | 'pen';
  capacity?: number | string | null;
  capacity_unit?: string | null;
  max_batches?: number;
  open_batches?: { id: number; batchNo?: string }[];
  status: BioStatus;
  farm?: { id: number; name: string } | null;
  /** What the unit is set up for; empty means anything. A species with no stages takes every stage. */
  suitability?: { species_template_id: number; species: string; stages: string[] }[];
}

export interface BioMeasurementParameter {
  id: number;
  name: string;
  /** The unit's symbol, kept beside the link to it; text only for a unit typed in before units were chosen from the list. */
  unit_label?: string | null;
  measurement_unit_id?: number | null;
  measurement_unit?: { id: number; name: string; symbol: string } | null;
  unit_types?: BioProductionUnit['type'][] | null;
  decimals: number;
  watch_min?: number | null;
  watch_max?: number | null;
  critical_min?: number | null;
  critical_max?: number | null;
  status: BioStatus;
  sort_order?: number;
}

export type MeasurementStatus = 'ok' | 'watch' | 'critical';

export interface BioSpeciesTemplateStage {
  id?: number;
  name: string;
  sequence?: number;
  purpose: 'consumable' | 'bearer';
  expected_duration_days?: number | null;
  entry_weight_g?: number | string | null;
  target_weight_g?: number | string | null;
  normal_mortality_pct?: number | string | null;
  useful_life_days?: number | null;
  salvage_value_per_head?: number | string | null;
}

export interface BioSpeciesTemplate {
  id: number;
  name: string;
  description?: string | null;
  tracking_mode: 'batch' | 'individual';
  count_label?: string;
  weight_unit?: 'g' | 'kg';
  status: BioStatus;
  stages_count?: number;
  stages?: BioSpeciesTemplateStage[];
  products?: { id: number; item_name: string; brand?: string | null; model?: string | null; specifications?: string | null; sku?: string | null }[];
  products_count?: number;
}

export interface BioFormProps<T> {
  setOpenDialog: (open: boolean) => void;
  item?: T | null;
}
