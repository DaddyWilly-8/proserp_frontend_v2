import { Ledger } from "@/components/accounts/ledgers/LedgerType";
import { Store } from "@/components/procurement/stores/storeTypes";
import { Product } from "@/components/productAndServices/products/ProductType";
import { User } from "@/components/prosControl/userManagement/UserManagementType";

export interface Station {
  id?: number;
  name: string;
  users: User[];
  shift_teams?: ShiftTeam[];
  fuel_pumps?: FuelPump[]  ;
  address?: string;
}

export interface ShiftTeam {
  name: string;
  ledger_ids: number[];
  description?: string;
}

export interface FuelPump {
  product_id: number | null;
  fuelName?: Product;
  name: string;
  tank_id: number | null;
  tankName?: Store;
}

export interface Unit {
  id: number;
  name: string;
}

export interface AddStationResponse {
  message: string;
}
export interface DeleteStationResponse {
  message: string;
}

export interface UpdateStationResponse {
  message: string;
  
}
export interface PaginatedStationResponse {
  data: Station[];
  current_page: number;
  total: number;
  last_page: number;
}
export interface FormData {
  shift_teams: Array<{
    name: string;
    ledger_ids: number[];
    description?: string;
  }>;
  fuel_pumps: Array<{
    product_id: number | null;
    name: string;
    tank_id: number | null;
    fuelName?: any; // Adjust based on ProductSelect's type
    tankName?: any; // Adjust based on StoreSelector's type
  }>;
}