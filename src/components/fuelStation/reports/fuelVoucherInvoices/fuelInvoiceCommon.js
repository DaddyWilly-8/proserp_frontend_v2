import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { money } from '@/components/pdf/StandardInvoicePDF';

// Amounts print with the invoice's currency when it has one (TZS 1,234.00), plain otherwise
export const currencyFormatter = (currencyCode) => (value) =>
  currencyCode
    ? (value ?? 0).toLocaleString('en-US', {
        style: 'currency',
        currency: currencyCode,
      })
    : money(value);

// The small label/value row under the parties, shared by the Summary and Detailed versions
export const fuelInvoiceDetails = (invoice, t) =>
  [
    { label: t.invoiceDate, value: readableDate(invoice.invoice_date, false) },
    !!invoice.due_date && {
      label: t.dueDate,
      value: readableDate(invoice.due_date, false),
    },
    !!invoice.from_date &&
      !!invoice.to_date && {
        label: t.period,
        // The period is picked to the time of day, so it is shown with the time
        value: `${readableDate(invoice.from_date, true)} - ${readableDate(invoice.to_date, true)}`,
      },
    !!invoice.internal_reference && {
      label: t.internalReference,
      value: invoice.internal_reference,
    },
    !!invoice.customer_reference && {
      label: t.customerReference,
      value: invoice.customer_reference,
    },
  ].filter(Boolean);

// Fuel carries no VAT, so the total is all that is owed; received / balance only once paid
export const fuelInvoiceTotals = (invoice, t) => {
  const format = currencyFormatter(invoice.currency?.code);
  return [
    { label: t.total, value: format(invoice.total) },
    ...(invoice.paid_amount
      ? [
          { label: t.received, value: format(invoice.paid_amount) },
          { label: t.balanceDue, value: format(invoice.unpaid_amount) },
        ]
      : []),
  ];
};
