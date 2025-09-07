// bomsServices.ts
import axios from '@/lib/services/config';
import { AddBOMResponse, BOM, BOMPayload, DeleteBOMResponse, PaginatedBOMResponse, UpdateBOMResponse } from './BomType';

const bomsServices = {
  getList: async (
    params: { keyword?: string; page?: number; limit?: number } = {}
  ): Promise<PaginatedBOMResponse> => {
    const { page = 1, limit = 10, ...queryParams } = params;
    const { data } = await axios.get('/api/manufacturing/boms', { 
      params: { page, limit, ...queryParams },
    });
    return data;
  },

  show: async (id: number): Promise<BOM> => {
  const { data } = await axios.get(`/api/manufacturing/boms/${id}/show`); // Updated to match API route
  return data;
},
  add: async (bom: BOMPayload): Promise<AddBOMResponse> => {
    await axios.get('/sanctum/csrf-cookie');
    const { data } = await axios.post('/api/manufacturing/boms/add', bom); 
    return data;
  },

  update: async (
    id: number,
    bom: BOMPayload
  ): Promise<UpdateBOMResponse> => {
    await axios.get('/sanctum/csrf-cookie');
    const { data } = await axios.put(`/api/manufacturing/boms/${id}/update`, bom); // Updated to match API route
    return data;
  },

  delete: async (params: { id: number }): Promise<DeleteBOMResponse> => {
    await axios.get('/sanctum/csrf-cookie');
    const { data } = await axios.delete(`/api/manufacturing/boms/${params.id}/delete`);
    return data;
  },
};

export default bomsServices;