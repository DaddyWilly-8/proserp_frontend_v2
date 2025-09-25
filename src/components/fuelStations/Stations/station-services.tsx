import axios from 'axios';
import { Station, AddStationResponse, UpdateStationResponse } from './StationType';

const stationServices = {
  add: async (station: Station): Promise<AddStationResponse> => {
    const response = await axios.post('/api/fuel-stations/stations', station);
    return response.data;
  },
  update: async (station: Station & { id: number }): Promise<UpdateStationResponse> => {
    const response = await axios.put(`/api/fuel-stations/stations/${station.id}`, station);
    return response.data;
  },
  getAll: async (keyword: string = ''): Promise<Station[]> => {
    const response = await axios.get('/api/fuel-stations/stations', { params: { keyword } });
    return response.data;
  },
};

export default stationServices;