import axios from "@/lib/services/config";

const recurringTransactionServices = {};

const BASE = '/api/accountsAndFinance/recurring-transactions';

recurringTransactionServices.getList = async ({ status, transaction_type, keyword, page, limit }) => {
  const { data } = await axios.get(BASE, {
    params: { status, transaction_type, keyword, page, limit },
  });
  return data;
};

recurringTransactionServices.show = async (id) => {
  const { data } = await axios.get(`${BASE}/${id}`);
  return data;
};

recurringTransactionServices.create = async (body) => {
  const { data } = await axios.post(BASE, body);
  return data;
};

recurringTransactionServices.createFromTransaction = async ({ type, id, schedule }) => {
  const { data } = await axios.post(`${BASE}/from/${type}/${id}`, schedule);
  return data;
};

recurringTransactionServices.update = async ({ id, body }) => {
  const { data } = await axios.put(`${BASE}/${id}`, body);
  return data;
};

recurringTransactionServices.pause = async (schedule) => {
  const { data } = await axios.post(`${BASE}/${schedule.id}/pause`);
  return data;
};

recurringTransactionServices.resume = async (schedule) => {
  const { data } = await axios.post(`${BASE}/${schedule.id}/resume`);
  return data;
};

recurringTransactionServices.delete = async (schedule) => {
  const { data } = await axios.delete(`${BASE}/${schedule.id}`);
  return data;
};

recurringTransactionServices.cancelOccurrence = async ({ id, runId, reason }) => {
  const { data } = await axios.post(`${BASE}/${id}/runs/${runId}/cancel`, { reason });
  return data;
};

export default recurringTransactionServices;
