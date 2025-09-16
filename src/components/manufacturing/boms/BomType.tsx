import { MeasurementUnit } from "@/components/masters/measurementUnits/MeasurementUnitType";
import { Product } from "@/components/productAndServices/products/ProductType";



export interface BOMItemPayload {
  id?: number;
  product_id: number | null;
  quantity: number | null;
  conversion_factor: number | null;
  measurement_unit_id?: number | null;
  measurement_unit?: MeasurementUnit | null;
  symbol?: string | null;
  product?: Product | null; // Optional for payload
  alternatives?: BOMAlternativePayload[];
}

export interface BOMAlternativePayload {
id?: number;
  product_id: number | null;
  quantity: number | null;
  conversion_factor: number | null;
  measurement_unit_id?: number | null;
  measurement_unit?: MeasurementUnit | null;
  symbol?: string | null;
  product?: Product | null; // Optional for payload
}




export interface BOMItem {
  id?: number;
  product_id: number | null;
  quantity: number | null;
  conversion_factor: number | null;
  measurement_unit_id?: number | null;
  measurement_unit?: MeasurementUnit | null;
  symbol?: string | null;
  product: Product | null;
  alternatives?: BOMAlternative[];
}

export interface BOMAlternative {
  id?: number;
  product_id: number | null;
  quantity: number | null;
  conversion_factor: number | null;
  measurement_unit_id?: number | null;
  measurement_unit?: MeasurementUnit | null;
  symbol?: string | null;
  product: Product | null;
}

export interface BOM {
  id: number;
  product?: Product;
  product_id: number | null;
  quantity: number | null;
  measurement_unit_id?: number | null;
  conversion_factor?: number | null;
  measurement_unit?: MeasurementUnit | null;
  symbol?: string | null;
  items: BOMItem[];
  alternatives: BOMItem[];
  bomNo?: string;
  creator?: {
    name: string;
  };
}

export interface BomFormValues {
  product_id?: number | null;
  product: Product | null;
  quantity?: number | null;
  measurement_unit_id?: number | null;
  measurement_unit?: MeasurementUnit | null;
  symbol: string;
  conversion_factor: number | null;
  items: BOMItem[]; // Use UI version for form
  alternatives: BOMAlternative[]; // Use UI version for form
}

export interface BOMPayload {
  id?: number;
  product_id: number | null;
  product?: Product | null;
  quantity: number | null;
  measurement_unit?: MeasurementUnit | null;
  measurement_unit_id?: number | null;
  symbol?: string | null;
  conversion_factor?: number | null;
  items: BOMItemPayload[]; // Use payload version for API
  alternatives?: BOMAlternativePayload[]; // Use payload version for API
  bomNo?: string;
}

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