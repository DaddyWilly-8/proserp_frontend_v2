export interface CustomerInvoiceStakeholder {
  id: number;
  name: string;
}

export interface CustomerInvoiceSource {
  // 'Sale' for invoices raised from POS sales, 'ProjectPaymentClaim' for IPC invoices,
  // 'FuelVoucher' for batch invoices raised over fuel vouchers
  type: 'Sale' | 'ProjectPaymentClaim' | 'FuelVoucher';
  no?: string | null;
}

export interface CustomerInvoiceCurrency {
  id?: number;
  code?: string;
  symbol?: string;
  name?: string;
}

export interface CustomerInvoicePayingReceipt {
  id: number;
  voucherNo?: string;
  reference?: string | null;
  narration?: string | null;
  transaction_date?: string;
  // The amount THIS receipt applied to this specific invoice — not necessarily the receipt's own total.
  amount: number;
  debit_ledger?: { id: number; name: string } | null;
  // Set when the receipt was later cancelled — see CustomerInvoice::getPayingReceiptsAttribute():
  // a cancellation reverses the receipt but doesn't remove this link, so the amount above may no
  // longer be accurate.
  cancelled_at?: string | null;
}

export interface CustomerInvoice {
  id: number;
  // Fuel Voucher invoices are listed with Customer Invoices but are a separate record,
  // so ids can repeat across kinds - list_key is the unique one.
  kind?: 'customer_invoice' | 'fuel_voucher_invoice';
  list_key?: string;
  invoiceNo: string;
  transaction_date: string;
  due_date?: string | null;
  manually_paid_at?: string | null;
  internal_reference?: string | null;
  customer_reference?: string | null;
  stakeholder?: CustomerInvoiceStakeholder;
  currency?: CustomerInvoiceCurrency | null;
  amount: number;
  adjustment_amount?: number;
  vat_amount: number;
  net_amount: number;
  paid_amount: number;
  unpaid_amount: number;
  receipts?: CustomerInvoicePayingReceipt[];
  source?: CustomerInvoiceSource | null;
}

export interface CustomerInvoiceLine {
  id?: number;
  // Invoices generated from an IPC carry 'deliverable' / 'adjustment' lines
  kind?: 'deliverable' | 'adjustment';
  description?: string | null;
  code?: string | null;
  product?: { name?: string } | null;
  measurement_unit?: { name?: string; symbol?: string } | null;
  quantity?: number | null;
  rate?: number | null;
  amount?: number | null;
  vat_amount?: number | null;
  adjustment_type?: 'addition' | 'deduction';
}
