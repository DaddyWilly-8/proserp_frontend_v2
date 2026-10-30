import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import StandardInvoicePDF, { money } from '../../pdf/StandardInvoicePDF';

const lineDescription = (item) => item.description || item.product?.name || '';
const lineAmount = (item) => item.amount ?? (item.quantity ?? 0) * (item.rate ?? 0);

// Customer Invoices (Sales and Project Payment Claims) on the shared invoice layout, so they
// look like the Proforma / Sales Invoice PDFs
function CustomerInvoicePDF({ invoice, organization }) {
  const currencyCode = invoice.currency?.code;
  const format = (value) =>
    currencyCode
      ? (value ?? 0).toLocaleString('en-US', { style: 'currency', currency: currencyCode })
      : money(value);
  const showQuantities = (invoice.items ?? []).some((item) => item.quantity != null);
  const sourceNo = invoice.source?.claimNo || '';

  const details = [
    { label: 'Invoice Date', value: readableDate(invoice.transaction_date, false) },
    !!invoice.due_date && { label: 'Due Date', value: readableDate(invoice.due_date, false) },
    !!sourceNo && { label: 'Project Payment Claim', value: sourceNo },
    !!invoice.internal_reference && { label: 'Internal Reference', value: invoice.internal_reference },
    !!invoice.customer_reference && { label: 'Customer Reference', value: invoice.customer_reference },
  ].filter(Boolean);

  const columns = [
    {
      label: 'Description',
      flex: 3,
      get: (row) =>
        `${lineDescription(row)}${row.kind === 'adjustment' ? ` (${row.adjustment_type})` : ''}`,
    },
    ...(showQuantities
      ? [
          { label: 'Unit', flex: 0.5, get: (row) => row.measurement_unit?.symbol ?? '' },
          {
            label: 'Quantity',
            flex: 1,
            align: 'right',
            get: (row) => (row.quantity != null ? String(row.quantity) : ''),
          },
          {
            label: 'Unit Price',
            flex: 1,
            align: 'right',
            get: (row) => (row.rate != null ? money(row.rate) : ''),
          },
        ]
      : []),
    { label: 'Amount', flex: 1, align: 'right', get: (row) => money(lineAmount(row)) },
  ];

  const totals = [
    { label: 'Amount', value: format(invoice.amount) },
    ...(invoice.adjustment_amount
      ? [{ label: 'Adjustments', value: format(invoice.adjustment_amount) }]
      : []),
    ...(invoice.vat_amount ? [{ label: 'VAT', value: format(invoice.vat_amount) }] : []),
    { label: 'Net Receivable', value: format(invoice.net_amount) },
    ...(invoice.paid_amount
      ? [
          { label: 'Received', value: format(invoice.paid_amount) },
          { label: 'Balance Due', value: format(invoice.unpaid_amount) },
        ]
      : []),
  ];

  return (
    <StandardInvoicePDF
      organization={organization}
      meta={{
        title: invoice.invoiceNo,
        author: invoice.creator?.name,
        subject: 'INVOICE',
        keywords: invoice.stakeholder?.name,
      }}
      heading={invoice.vfd_receipt ? 'TAX INVOICE' : 'INVOICE'}
      number={invoice.invoiceNo}
      stakeholder={invoice.stakeholder}
      details={details}
      columns={columns}
      rows={(invoice.items ?? []).map((item, index) => ({ ...item, key: item.id ?? index }))}
      totals={totals}
      receipts={invoice.receipts ?? []}
      narration={invoice.narration}
      terms={invoice.terms_and_instructions}
      preparedBy={invoice.creator?.name}
    />
  );
}

export default CustomerInvoicePDF;
