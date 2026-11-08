export type BioInputType = 'feed' | 'medication' | 'other';

export interface BatchStage {
  id: number;
  name: string;
  sequence: number;
  purpose: 'consumable' | 'bearer';
  normal_mortality_pct: number | string | null;
  start_date: string;
  end_date: string | null;
  opening_quantity: number;
  closing_quantity: number | null;
  opening_avg_weight_g: number | string | null;
  closing_avg_weight_g: number | string | null;
  mortality_quantity: number;
  mortality_pct: number | null;
  abnormal_mortality_quantity: number | null;
  useful_life_days?: number | null;
  salvage_value_per_head?: number | string | null;
}

export interface BatchCosts {
  total: number;
  written_off: number;
  harvested: number;
  collected: number;
  wip_balance: number;
  per_unit: number | null;
  by_stage: Record<string, number>;
}

export interface Batch {
  id: number;
  batchNo: string;
  status: 'on progress' | 'closed';
  species_template_id: number;
  farm_id: number;
  production_unit_id: number;
  start_date: string;
  end_date: string | null;
  initial_quantity: number;
  current_quantity: number;
  remarks: string | null;
  species_template?: { id: number; name: string; count_label?: string; weight_unit?: 'g' | 'kg' };
  farm?: { id: number; name: string; cost_center?: { id: number; name: string } | null };
  production_unit?: { id: number; name: string; type: string };
  current_stage?: BatchStage | null;
  stages?: BatchStage[];
  unit_transfers?: { id: number; transfer_date: string; remarks: string | null; from_unit?: { name: string }; to_unit?: { name: string } }[];
  weight_samplings?: { id: number; sample_date: string; sample_size: number; average_weight_g: number | string; remarks: string | null }[];
  mortality_writeoffs?: { id: number; writeoff_date: string; kind: 'abnormal' | 'residual'; quantity: number; cost_per_fish: number | string; amount: number | string }[];
  harvests?: BatchHarvest[];
  costs?: BatchCosts;
}

export interface BatchHarvest {
  id: number;
  harvest_date: string;
  quantity: number;
  product_id: number;
  store_id: number;
  product_quantity: number | string;
  cost_amount: number | string;
  cost_per_unit: number | null;
  remarks: string | null;
  product?: { id: number; item_name: string; name?: string };
  store?: { id: number; name: string };
}

export interface BatchProduce {
  id: number;
  collection_date: string;
  product_quantity: number | string;
  running_cost_amount: number | string;
  depreciation_amount: number | string;
  cost_amount: number | string;
  cost_per_unit: number | null;
  remarks: string | null;
  product_id: number;
  store_id: number;
  product?: { id: number; item_name: string; name?: string };
  store?: { id: number; name: string };
  batch_stage?: { id: number; name: string };
}

export interface ProduceCostPreview {
  running_cost: number;
  depreciation: number;
  cost: number;
  carrying_value: number;
  days: number;
  days_left: number | null;
  last_collection_date: string | null;
}

export interface BatchExpense {
  id: number;
  expense_date: string;
  quantity: number | string;
  rate: number | string;
  amount: number | string;
  remarks: string | null;
  ledger?: { name: string };
}

export interface BatchMortality {
  id: number;
  event_date: string;
  quantity: number;
  cause: string | null;
  remarks: string | null;
  batch_stage_id: number;
  /** The daily record the loss belongs to, where it is corrected. */
  daily_record_id?: number | null;
  daily_record?: { id: number; recordNo: string; lines_count: number } | null;
}

export interface BatchInput {
  id: number;
  daily_record_id?: number | null;
  recordNo?: string | null;
  /** How many lines the record holds; more than one means it is corrected on Daily Records. */
  record_lines?: number | null;
  event_date: string;
  type: 'feed' | 'medication' | 'other';
  reason: string | null;
  remarks: string | null;
  stage?: { name: string };
  store?: { id?: number; name: string };
  consumptionNo?: string;
  cost: number;
  items: {
    product?: { id?: number; item_name?: string; name?: string };
    quantity: number;
    measurement_unit?: { id?: number; symbol?: string; name?: string };
    rate: number;
  }[];
}

export interface DialogProps {
  batch: Batch;
  open: boolean;
  onClose: () => void;
}

/** A dialog that can also correct a record already made. */
export interface EditableDialogProps<T> extends DialogProps {
  record?: T | null;
}

export interface BatchSummary {
  costs: BatchCosts;
  categories: { group: 'input' | 'ledger'; key: string; name: string | null; amount: number; entries?: number }[];
  by_stage: { stage_id: number; name: string; start_date: string; end_date: string | null; inputs: number; other: number; total: number }[];
  inputs: { type: BioInputType; product_id: number; product: string | null; unit: string | null; quantity: number; cost: number; rate: number | null; applications: number; first_date: string | null; last_date: string | null }[];
  outputs: {
    harvests: { product: string; animals: number; quantity: number; cost: number }[];
    produce: { product: string; quantity: number; cost: number; depreciation: number }[];
  };
  animals: { initial: number; alive: number; died: number; mortality_pct: number | null; written_off: number; harvested: number };
  days: number;
  environment: { parameter_id: number; name: string; unit_label: string | null; decimals: number; readings: number; average: number; min: number; max: number; out_of_range: number }[];
  fcr: { batch: FcrRow | null; stages: (FcrRow & { stage_id: number; stage: string })[] };
  feed_trend: { days: { date: string; kg: number; cost: number }[]; other_units: string[] };
}

export interface FcrRow {
  feed_kg: number;
  gain_kg: number | null;
  fcr: number | null;
  reason?: 'no_weights';
  last_weighed_at: string | null;
  other_units?: string[];
}
