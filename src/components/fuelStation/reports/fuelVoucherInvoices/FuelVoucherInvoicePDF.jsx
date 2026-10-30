import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import StandardInvoicePDF, { money } from '@/components/pdf/StandardInvoicePDF';
import { Text } from '@react-pdf/renderer';
import { fuelInvoiceDetails, fuelInvoiceTotals } from './fuelInvoiceCommon';
import FuelVoucherInvoiceSummaryPDF from './FuelVoucherInvoiceSummaryPDF';

// Fuel carries no VAT and the EFD receipt is issued at the pump, so neither appears here.
function FuelVoucherInvoicePDF({ invoice, organization, dictionary, summarize = false }) {
  const t = dictionary.reports.fuelStationReports.fuelVoucherInvoices;
  // The Summary version groups lines of the same product and price and prints portrait; this
  // is the Detailed version that lists every voucher, so it needs the width
  if (summarize) {
    return (
      <FuelVoucherInvoiceSummaryPDF invoice={invoice} organization={organization} dictionary={dictionary} />
    );
  }

  return (
    <StandardInvoicePDF
      organization={organization}
      meta={{
        title: invoice.invoice_no,
        author: invoice.creator?.name,
        subject: t.subject,
        keywords: invoice.stakeholder?.name,
      }}
      orientation='landscape'
      number={invoice.invoice_no}
      stakeholder={invoice.stakeholder}
      details={fuelInvoiceDetails(invoice, t)}
      columns={[
        { label: t.date, flex: 1, get: (row) => readableDate(row.date, false) },
        { label: t.voucherNo, flex: 1.2, get: (row) => row.voucherNo },
        { label: t.station, flex: 1.4, get: (row) => row.station ?? '' },
        { label: t.product, flex: 1.4, get: (row) => row.product },
        {
          label: t.referenceAndNarration,
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
          label: t.quantity,
          flex: 1,
          align: 'right',
          get: (row) =>
            `${row.quantity?.toLocaleString('en-US')}${row.unit ? ` ${row.unit}` : ''}`,
        },
        { label: t.unitPrice, flex: 1.2, align: 'right', get: (row) => money(row.price) },
        { label: t.amount, flex: 1.4, align: 'right', get: (row) => money(row.amount) },
      ]}
      rows={invoice.lines.map((line) => ({ ...line, key: line.id }))}
      totals={fuelInvoiceTotals(invoice, t)}
      receipts={invoice.receipts ?? []}
      narration={invoice.narration}
      terms={invoice.terms_and_instructions}
      preparedBy={invoice.creator?.name}
    />
  );
}

export default FuelVoucherInvoicePDF;
