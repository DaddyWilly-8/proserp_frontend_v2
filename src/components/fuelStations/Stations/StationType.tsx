import { Ledger } from "@/components/accounts/ledgers/LedgerType";
import { Store } from "@/components/procurement/stores/storeTypes";
import { Product } from "@/components/productAndServices/products/ProductType";
import { User } from "@/components/prosControl/userManagement/UserManagementType";

export interface Station {
  id?: number;
  name: string;
  user: User[];
  shifts?: Shift[];
  fuel_pumps?: FuelPump[];
  address?: string;
}

export interface Shift {
  name: string;
  ledger_ids: number[];
  ledgers?: Ledger[];
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

export interface UpdateStationResponse {
  message: string;
}