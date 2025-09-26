import axios from 'axios';
import { Station, AddStationResponse, UpdateStationResponse, DeleteStationResponse, PaginatedStationResponse } from './StationType';

const stationServices = {
  add: async (station: Station): Promise<AddStationResponse> => {
    const response = await axios.post('/api/fuelStations/stations/add', station);
    return response.data;
  },
  update: async (station: Station & { id: number }): Promise<UpdateStationResponse> => {
    const response = await axios.put(`/api/fuelStations/stations/${station.id}/update`, station);
    return response.data;
  },
  getList: async (params: { keyword?: string; page?: number; limit?: number } = {}): Promise<PaginatedStationResponse> => {
    const { page = 1, limit = 10, ...queryParams } = params;
    const { data } = await axios.get('/api/fuelStations/stations', {
      params: { page, limit, ...queryParams },
    });
    return data;
  },
  delete: async (params: { id: any; }): Promise<DeleteStationResponse> => {
     const { data } = await axios.delete(`/api/fuelStations/stations/${params.id}/delete`);
     return data;
  },
};

export default stationServices;