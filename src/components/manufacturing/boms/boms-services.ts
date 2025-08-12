import axios from '@/lib/services/config';
import {
  AddBOMResponse,
  UpdateBOMResponse,
  DeleteBOMResponse,
  PaginatedBOMResponse,
  BOM,  // Add this import
  BomsFormValues
} from './BomsType';

// ... rest of your imports and interfaces ...

const bomsServices = {
  // ✅ Get paginated list of BOMs
  getList: async (
    params: { keyword?: string; page?: number; limit?: number } = {}
  ): Promise<PaginatedBOMResponse> => {
    const { page = 1, limit = 10, ...queryParams } = params;
    const { data } = await axios.get('/api/manufacturing/boms', {
      params: { page, limit, ...queryParams },
    });
    return data;
  },

  // ✅ Get single BOM by ID
  show: async (id: number): Promise<BOM> => {
    const { data } = await axios.get(`/api/manufacturing/boms/${id}`);
    return data;
  },

  // ✅ Add a new BOM
  add: async (bom: {
    output_product_id?: number;
    output_quantity: number;
    items: {
      product_id?: number;
      quantity: number;
      alternatives?: {
        product_id?: number;
        quantity: number;
      }[][];
    }[];
  }): Promise<AddBOMResponse> => {
    await axios.get('/sanctum/csrf-cookie');
    const { data } = await axios.post('/api/manufacturing/boms/add', bom);
    return data;
  },

  // ✅ Update existing BOM
  update: async (
    id: number,
    bom: Pick<BomsFormValues, 'output_product_id' | 'output_quantity' | 'items'>
  ): Promise<UpdateBOMResponse> => {
    await axios.get('/sanctum/csrf-cookie');
    const { data } = await axios.put(`/api/manufacturing/boms/${id}/update`, bom);
    return data;
  },

  // ✅ Delete a BOM
  delete: async (
    params: { id: number }
  ): Promise<DeleteBOMResponse> => {
    await axios.get('/sanctum/csrf-cookie');
    const { data } = await axios.delete(`/api/manufacturing/boms/${params.id}/delete`);
    return data;
  },
};

export default bomsServices;

// Re-export types
export type {
  BomsFormValues,
  AddBOMResponse,
  UpdateBOMResponse,
  DeleteBOMResponse,
  PaginatedBOMResponse,
  BOM  // Add this export if needed
};