import { MeasurementUnit } from "@/components/masters/measurementUnits/MeasurementUnitType";
import { Product } from "@/components/productAndServices/products/ProductType";

export interface BOMItem {
  id?: number;
  product?: Product | null;
  bom_id?: number;
  product_id: number | null;
  quantity: number | null;
  conversion_factor: number | null;
  measurement_unit_id?: number | null | undefined;
  measurement_unit?: MeasurementUnit | null;
  symbol?: string | null;
  alternatives?: BOMAlternative[];
}

export interface BOMAlternative {
  id?: number;
  product?: Product | null;
  product_id: number | null;
  quantity: number | null;
  measurement_unit_id?: number | null;
  measurement_unit?: MeasurementUnit | null;
  symbol?: string | null;
  conversion_factor: number | null;
  alternatives?: BOMAlternative[];
  
}

export interface BOM {
  id: number;
  product?: Product | null;
  product_id: number | null;
  quantity: number | null;
  measurement_unit_id?: number | null;
  conversion_factor?: number | null;
  measurement_unit?: MeasurementUnit | null;
  symbol?: string | null;
  items: BOMItem[];
  alternatives: BOMItem[]; // This might be top-level alternatives, but based on PDF, it's per-item
  bomNo?: string;
  creator?: {
    name: string;
  };
}

export interface BomFormValues {
  product_id?: number | null;
  product?: Product | null;
  quantity?: number | null;
  measurement_unit_id?: number | null;
  measurement_unit?: MeasurementUnit | null;
  symbol: string;
  conversion_factor: number | null;
  items: BOMItem[];
  alternatives: BOMAlternative[];
}

// Katika BomType.ts
export interface BOMPayload {
  id?: number;
  product_id: number | null;
  product?: Product | null;
  quantity: number | null;
  measurement_unit?: MeasurementUnit | null;
  measurement_unit_id?: number | null;
  symbol?: string | null;
  conversion_factor?: number | null;
  items: BOMItem[];
  alternatives?: BOMAlternative[];  // ✅ Ongeza ? ili iwe optional (si required)
  bomNo?: string;
}

// Response types
export interface AddBOMResponse {
  message: string;
  data: BOM;
}

export interface UpdateBOMResponse {
  message: string;
  data: BOM;
}

export interface DeleteBOMResponse {
  message: string;
}

export interface PaginatedBOMResponse {
  data: BOM[];
  total: number;
}