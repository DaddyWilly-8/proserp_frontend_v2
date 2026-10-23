import StandardInvoicePDF, { money } from '@/components/pdf/StandardInvoicePDF';
import { Text } from '@react-pdf/renderer';
import { fuelInvoiceDetails, fuelInvoiceTotals } from './fuelInvoiceCommon';

// Lines of the same product sold at the same price collapse into one: quantities and
// amounts add up, and `vouchers` counts how many fuel vouchers went into it.
export const groupLines = (lines) => {
  const groups = new Map();
  lines.forEach((line) => {
    const key = `${line.product_id ?? line.product}|${line.price}`;
    const group = groups.get(key) ?? {
      key,
      product: line.product,
      unit: line.unit,
      price: line.price,
      quantity: 0,
      amount: 0,
      vouchers: 0,
    };
    group.quantity += line.quantity;
    group.amount += line.amount;
    group.vouchers += 1;
    groups.set(key, group);
  });
  return Array.from(groups.values()).sort(
    (a, b) => a.product.localeCompare(b.product) || a.price - b.price
  );
};

// The Summary version of a batch Fuel Voucher invoice, on the shared invoice layout
// (same look as the Proforma / Customer Invoice PDFs)
function FuelVoucherInvoiceSummaryPDF({ invoice, organization }) {
  return (
    <StandardInvoicePDF
      organization={organization}
      meta={{
        title: invoice.invoice_no,
        author: invoice.creator?.name,
        subject: 'Invoice',
        keywords: invoice.stakeholder?.name,
      }}
      number={invoice.invoice_no}
      stakeholder={invoice.stakeholder}
      details={fuelInvoiceDetails(invoice)}
      columns={[
        {
          label: 'Product',
          flex: 3,
          get: (row) => (
            <>
              <Text>{row.product}</Text>
              <Text>{`${row.vouchers} ${row.vouchers === 1 ? 'voucher' : 'vouchers'}`}</Text>
            </>
          ),
        },
        { label: 'Unit', flex: 0.5, get: (row) => row.unit ?? '' },
        {
          label: 'Quantity',
          flex: 1,
          align: 'right',
          get: (row) =>
            row.quantity.toLocaleString('en-US', { maximumFractionDigits: 2 }),
        },
        { label: 'Unit Price', flex: 1, align: 'right', get: (row) => money(row.price) },
        { label: 'Amount', flex: 1, align: 'right', get: (row) => money(row.amount) },
      ]}
      rows={groupLines(invoice.lines)}
      totals={fuelInvoiceTotals(invoice)}
      receipts={invoice.receipts ?? []}
      narration={invoice.narration}
      terms={invoice.terms_and_instructions}
      preparedBy={invoice.creator?.name}
    />
  );
}

export default FuelVoucherInvoiceSummaryPDF;
