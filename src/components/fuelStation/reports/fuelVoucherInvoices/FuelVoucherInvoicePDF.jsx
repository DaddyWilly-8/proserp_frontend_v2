import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import StandardInvoicePDF, { money } from '@/components/pdf/StandardInvoicePDF';
import { Text } from '@react-pdf/renderer';
import { fuelInvoiceDetails, fuelInvoiceTotals } from './fuelInvoiceCommon';
import FuelVoucherInvoiceSummaryPDF from './FuelVoucherInvoiceSummaryPDF';

// Fuel carries no VAT and the EFD receipt is issued at the pump, so neither appears here.
function FuelVoucherInvoicePDF({ invoice, organization, summarize = false }) {
  // The Summary version groups lines of the same product and price and prints portrait; this
  // is the Detailed version that lists every voucher, so it needs the width
  if (summarize) {
    return (
      <FuelVoucherInvoiceSummaryPDF invoice={invoice} organization={organization} />
    );
  }

  return (
    <StandardInvoicePDF
      organization={organization}
      meta={{
        title: invoice.invoice_no,
        author: invoice.creator?.name,
        subject: 'Invoice',
        keywords: invoice.stakeholder?.name,
      }}
      orientation='landscape'
      number={invoice.invoice_no}
      stakeholder={invoice.stakeholder}
      details={fuelInvoiceDetails(invoice)}
      columns={[
        { label: 'Date', flex: 1, get: (row) => readableDate(row.date, false) },
        { label: 'Voucher No.', flex: 1.2, get: (row) => row.voucherNo },
        { label: 'Station', flex: 1.4, get: (row) => row.station ?? '' },
        { label: 'Product', flex: 1.4, get: (row) => row.product },
        {
          label: 'Reference & Narration',
          flex: 2.2,
          // Reference first, then the narration beneath it
          get: (row) => (
            <>
              {!!row.reference && <Text>{row.reference}</Text>}
              {!!row.narration && <Text>{row.narration}</Text>}
            </>
          ),
        },
        {
          label: 'Quantity',
          flex: 1,
          align: 'right',
          get: (row) =>
            `${row.quantity?.toLocaleString('en-US')}${row.unit ? ` ${row.unit}` : ''}`,
        },
        { label: 'Unit Price', flex: 1.2, align: 'right', get: (row) => money(row.price) },
        { label: 'Amount', flex: 1.4, align: 'right', get: (row) => money(row.amount) },
      ]}
      rows={invoice.lines.map((line) => ({ ...line, key: line.id }))}
      totals={fuelInvoiceTotals(invoice)}
      receipts={invoice.receipts ?? []}
      narration={invoice.narration}
      terms={invoice.terms_and_instructions}
      preparedBy={invoice.creator?.name}
    />
  );
}

export default FuelVoucherInvoicePDF;
