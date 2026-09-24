import axios from '@/lib/services/config';

const purchaseBillServices = {};

purchaseBillServices.create = async ({ grnId, ...payload }) => {
  const { data } = await axios.post(`/api/grns/${grnId}/bill`, payload);
  return data;
};

// For non-inventory purchase orders (services, etc.) that never go through
// a GRN — bills the order's Unbilled Goods balance directly.
purchaseBillServices.createForOrder = async ({ orderId, ...payload }) => {
  const { data } = await axios.post(`/api/purchaseOrders/${orderId}/bill`, payload);
  return data;
};

// All Purchase Bills (optionally filtered) — used by the Accounts &
// Finance > Purchase Bills list page.
purchaseBillServices.getList = async (params = {}) => {
  const { page = 1, limit = 10, ...queryParams } = params;
  const { data } = await axios.get('/api/accountsAndFinance/purchaseBills', {
    params: { page, limit, ...queryParams },
  });
  return data;
};

purchaseBillServices.details = async (id) => {
  const { data } = await axios.get(`/api/purchaseBills/${id}`);
  return data;
};

purchaseBillServices.delete = async (id) => {
  const { data } = await axios.delete(`/api/purchaseBills/${id}`);
  return data;
};

// Bills (purchase invoices) for a given supplier — used by the Bill
// search-picker (Payment Requisitions / Direct Payments relatable linking).
purchaseBillServices.listByStakeholder = async (stakeholderId, params = {}) => {
  const { data } = await axios.get(
    `/api/masters/stakeholders/${stakeholderId}/purchase-bills`,
    { params }
  );
  return data;
};

// Manual override for the Due Invoices dashboard card — removes a bill from
// it when it's been settled through a Payment that was never linked via
// BillPicker. See SupplierInvoice::getUnpaidAmountAttribute().
purchaseBillServices.markPaid = async (id) => {
  const { data } = await axios.post(`/api/purchaseBills/${id}/mark-paid`);
  return data;
};

purchaseBillServices.unmarkPaid = async (id) => {
  const { data } = await axios.post(`/api/purchaseBills/${id}/unmark-paid`);
  return data;
};

// Edits a bill in place: clears its existing postings and re-derives them
// from the (possibly changed) request, same shape as create.
purchaseBillServices.update = async ({ id, ...payload }) => {
  const { data } = await axios.put(`/api/purchaseBills/${id}`, payload);
  return data;
};

// Cancels a bill: reverses its journals with offsetting entries instead of
// deleting anything, so it stays on record. `reason` is required.
purchaseBillServices.cancel = async (id, { reason, cancellation_date } = {}) => {
  const { data } = await axios.post(`/api/purchaseBills/${id}/cancel`, {
    reason,
    cancellation_date,
  });
  return data;
};

purchaseBillServices.reverseCancellation = async (id) => {
  const { data } = await axios.post(`/api/purchaseBills/${id}/reverse-cancellation`);
  return data;
};

export default purchaseBillServices;
