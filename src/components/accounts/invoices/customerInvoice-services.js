import axios from '@/lib/services/config';

const customerInvoiceServices = {};

// Customer Invoices for a given customer — used by InvoicePicker (Receipts'
// relatable linking), mirroring purchaseBillServices.listByStakeholder.
customerInvoiceServices.listByStakeholder = async (stakeholderId, params = {}) => {
  const { data } = await axios.get(
    `/api/masters/stakeholders/${stakeholderId}/customer-invoices`,
    { params }
  );
  return data;
};

// All Customer Invoices (optionally filtered) - used by the Accounts >
// Customer Invoices list page. Covers invoices raised from Sales as well as
// those generated from Project Payment Claims (IPCs).
customerInvoiceServices.getList = async (params = {}) => {
  const { page = 1, limit = 20, ...queryParams } = params;
  const { data } = await axios.get('/api/accountsAndFinance/customerInvoices', {
    params: { page, limit, ...queryParams },
  });
  return data;
};

customerInvoiceServices.details = async (id) => {
  const { data } = await axios.get(`/api/pos/counter/${id}/invoiceDetails`);
  return data;
};

// Manual override for the Due Invoices dashboard card — removes an invoice
// from it when it's been settled through a Receipt that was never linked
// via InvoicePicker. See CustomerInvoice::getUnpaidAmountAttribute().
customerInvoiceServices.markPaid = async (id) => {
  const { data } = await axios.post(`/api/pos/counter/${id}/markInvoicePaid`);
  return data;
};

customerInvoiceServices.unmarkPaid = async (id) => {
  const { data } = await axios.post(`/api/pos/counter/${id}/unmarkInvoicePaid`);
  return data;
};

// Fuel Voucher invoices share the Customer Invoices list but live in their own table, so
// their details and paid-override go through separate endpoints.
customerInvoiceServices.fuelVoucherInvoiceDetails = async (id) => {
  const { data } = await axios.get(`/api/accountsAndFinance/customerInvoices/fuelVoucherInvoices/${id}`);
  return data;
};

customerInvoiceServices.markFuelVoucherInvoicePaid = async (id) => {
  const { data } = await axios.post(`/api/accountsAndFinance/customerInvoices/fuelVoucherInvoices/${id}/markPaid`);
  return data;
};

customerInvoiceServices.unmarkFuelVoucherInvoicePaid = async (id) => {
  const { data } = await axios.post(`/api/accountsAndFinance/customerInvoices/fuelVoucherInvoices/${id}/unmarkPaid`);
  return data;
};

export default customerInvoiceServices;
