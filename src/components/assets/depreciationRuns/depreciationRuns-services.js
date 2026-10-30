import axios from "@/lib/services/config";

const depreciationRunsServices = {};

depreciationRunsServices.getList = async ({ year, page, limit }) => {
  const response = await axios.get('/api/assets/depreciation-runs', {
    params: { year, page, limit },
  });
  return response.data;
};

depreciationRunsServices.getOne = async (id) => {
  const { data } = await axios.get(`/api/assets/depreciation-runs/${id}`);
  return data;
};

depreciationRunsServices.preview = async (period) => {
  const { data } = await axios.get('/api/assets/depreciation-runs/preview', {
    params: { period },
  });
  return data;
};

depreciationRunsServices.post = async (payload) => {
  const { data } = await axios.post('/api/assets/depreciation-runs', payload);
  return data;
};

depreciationRunsServices.rollback = async (run) => {
  const { data } = await axios.delete(`/api/assets/depreciation-runs/${run.id}`);
  return data;
};

depreciationRunsServices.exportExcel = async (id) => {
  const response = await axios.get(`/api/assets/depreciation-runs/${id}/export-excel`, {
    responseType: 'blob',
  });
  return response.data;
};

depreciationRunsServices.getTemplate = async () => {
  const { data } = await axios.get('/api/assets/depreciation-template');
  return data;
};

depreciationRunsServices.saveTemplate = async (template) => {
  const { data } = await axios.put('/api/assets/depreciation-template', template);
  return data;
};

export default depreciationRunsServices;
