import { Product } from "@/components/productAndServices/products/ProductType";

export interface BOM {
   id: number;
  output_product_id: number;
  output_quantity: number;
  organization_id?: number;
  created_at?: string;
  updated_at?: string;
  
  // Optional expanded relationships
  output_product?: {
    id: number;
    name: string;
    measurement_unit_id?: number;
    measurement_unit?: {
      id: number;
      name: string;
      symbol: string;
    };
  };

  items: BOMItem[];
}

export interface BomsFormValues {
  output_product_id?: number;
  output_quantity: number;
  items: BomItem[];
}

export interface BomAlternative {
  product_id?: number;
  quantity: number;
}

export interface BomItem {
  product_id?: number;
  quantity: number;
  measurement_unit_id?: number;
  conversion_factor?: number;
}

export interface BOMItem {
  product_id: number;
  quantity: number;
  conversion_factor: number;
}


// Response types (optional if you want to type responses)
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
