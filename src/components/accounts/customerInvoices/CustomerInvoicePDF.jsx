import React from 'react';
import { Text, View, Document, Page } from '@react-pdf/renderer';
import pdfStyles from '../../pdf/pdf-styles';
import PdfLogo from '../../pdf/PdfLogo';
import PageFooter from '../../pdf/PageFooter';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';

const styles = pdfStyles;

const money = (value = 0) =>
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const lineDescription = (item) => item.description || item.product?.name || '';
const lineAmount = (item) => item.amount ?? (item.quantity ?? 0) * (item.rate ?? 0);

function CustomerInvoicePDF({ invoice, organization }) {
  const mainColor = organization?.settings?.main_color || '#2113AD';
  const lightColor = organization?.settings?.light_color || '#bec5da';
  const contrastText = organization?.settings?.contrast_text || '#FFFFFF';
  const currencyCode = invoice.currency?.code ? `${invoice.currency.code} ` : '';
  const showQuantities = (invoice.items ?? []).some((item) => item.quantity != null);
  const sourceNo = invoice.source?.claimNo || '';

  const headerCell = (flex, extra = {}) => ({
    ...styles.tableCell,
    ...styles.tableHeader,
    backgroundColor: mainColor,
    color: contrastText,
    flex,
    ...extra,
  });
  const bodyCell = (index, flex, extra = {}) => ({
    ...styles.tableCell,
    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
    flex,
    ...extra,
  });

  return (
    <Document
      title={invoice.invoiceNo}
      author={`${invoice.creator?.name}`}
      subject='INVOICE'
      creator='ProsERP'
      producer='ProsERP'
      keywords={invoice.stakeholder?.name}
    >
      <Page size='A4' style={styles.page}>
        <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
          <View style={{ flex: 1, maxWidth: organization?.logo_path ? 130 : 250 }}>
            <PdfLogo organization={organization} />
          </View>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>INVOICE</Text>
            <Text style={{ ...pdfStyles.midInfo }}>{invoice.invoiceNo}</Text>
          </View>
        </View>

        <View style={{ ...pdfStyles.tableRow, marginTop: 10 }}>
          <View style={{ ...pdfStyles.table, flex: 0.5 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Invoice Date:</Text>
            <Text style={{ ...pdfStyles.minInfo }}>{readableDate(invoice.transaction_date)}</Text>
          </View>
          <View style={{ ...pdfStyles.table, flex: 0.5 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Customer:</Text>
            <Text style={{ ...pdfStyles.minInfo }}>{invoice.stakeholder?.name}</Text>
          </View>
          {sourceNo && (
            <View style={{ ...pdfStyles.table, flex: 0.5 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Project Payment Claim:</Text>
              <Text style={{ ...pdfStyles.minInfo }}>{sourceNo}</Text>
            </View>
          )}
        </View>

        <View style={{ ...pdfStyles.tableRow, marginBottom: 10, marginTop: 5 }}>
          {invoice.due_date && (
            <View style={{ ...pdfStyles.table, flex: 0.5 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Due Date:</Text>
              <Text style={{ ...pdfStyles.minInfo }}>{readableDate(invoice.due_date)}</Text>
            </View>
          )}
          {invoice.internal_reference && (
            <View style={{ ...pdfStyles.table, flex: 0.5 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Internal Reference:</Text>
              <Text style={{ ...pdfStyles.minInfo }}>{invoice.internal_reference}</Text>
            </View>
          )}
          {invoice.customer_reference && (
            <View style={{ ...pdfStyles.table, flex: 0.5 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Customer Reference:</Text>
              <Text style={{ ...pdfStyles.minInfo }}>{invoice.customer_reference}</Text>
            </View>
          )}
        </View>

        {!!invoice.items?.length && (
          <View style={{ ...pdfStyles.table, minHeight: 40, marginTop: 10 }}>
            <View style={styles.tableRow}>
              <Text style={headerCell(6)}>Description</Text>
              {showQuantities && (
                <>
                  <Text style={headerCell(2, { textAlign: 'right' })}>Qty</Text>
                  <Text style={headerCell(2.5, { textAlign: 'right' })}>Rate</Text>
                </>
              )}
              <Text style={headerCell(2.5, { textAlign: 'right' })}>Amount</Text>
            </View>
            {invoice.items.map((item, index) => (
              <View key={item.id ?? index} style={styles.tableRow} wrap={false}>
                <Text style={bodyCell(index, 6)}>
                  {lineDescription(item)}
                  {item.kind === 'adjustment' ? ` (${item.adjustment_type})` : ''}
                </Text>
                {showQuantities && (
                  <>
                    <Text style={bodyCell(index, 2, { textAlign: 'right' })}>
                      {item.quantity != null
                        ? `${item.quantity}${item.measurement_unit?.symbol ? ` ${item.measurement_unit.symbol}` : ''}`
                        : ''}
                    </Text>
                    <Text style={bodyCell(index, 2.5, { textAlign: 'right' })}>
                      {item.rate != null ? money(item.rate) : ''}
                    </Text>
                  </>
                )}
                <Text style={bodyCell(index, 2.5, { textAlign: 'right' })}>{money(lineAmount(item))}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ flexDirection: 'row' }} wrap={false}>
          <View style={{ flex: 1 }}></View>
          <View style={{ ...pdfStyles.table, marginTop: 20, flex: 1 }}>
            <View style={styles.tableRow}>
              <Text style={{ ...styles.tableCell, flex: 0.5 }}>Amount</Text>
              <Text style={{ ...styles.tableCell, flex: 0.5, textAlign: 'right' }}>
                {currencyCode}
                {money(invoice.amount)}
              </Text>
            </View>
            {!!invoice.adjustment_amount && (
              <View style={styles.tableRow}>
                <Text style={{ ...styles.tableCell, flex: 0.5 }}>Adjustments</Text>
                <Text style={{ ...styles.tableCell, flex: 0.5, textAlign: 'right' }}>
                  {currencyCode}
                  {money(invoice.adjustment_amount)}
                </Text>
              </View>
            )}
            {!!invoice.vat_amount && (
              <View style={styles.tableRow}>
                <Text style={{ ...styles.tableCell, flex: 0.5 }}>VAT</Text>
                <Text style={{ ...styles.tableCell, flex: 0.5, textAlign: 'right' }}>
                  {currencyCode}
                  {money(invoice.vat_amount)}
                </Text>
              </View>
            )}
            <View style={styles.tableRow}>
              <Text style={headerCell(0.5)}>Net Receivable</Text>
              <Text style={headerCell(0.5, { textAlign: 'right' })}>
                {currencyCode}
                {money(invoice.net_amount)}
              </Text>
            </View>
            {!!invoice.paid_amount && (
              <>
                <View style={styles.tableRow}>
                  <Text style={{ ...styles.tableCell, flex: 0.5 }}>Received</Text>
                  <Text style={{ ...styles.tableCell, flex: 0.5, textAlign: 'right' }}>
                    {currencyCode}
                    {money(invoice.paid_amount)}
                  </Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={{ ...styles.tableCell, flex: 0.5, fontFamily: 'Helvetica-Bold' }}>Balance Due</Text>
                  <Text style={{ ...styles.tableCell, flex: 0.5, textAlign: 'right', fontFamily: 'Helvetica-Bold' }}>
                    {currencyCode}
                    {money(invoice.unpaid_amount)}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {!!invoice.receipts?.length && (
          <View style={{ ...pdfStyles.table, minHeight: 40, marginTop: 10 }}>
            <View style={styles.tableRow}>
              <Text style={headerCell(3)}>Voucher No.</Text>
              <Text style={headerCell(2)}>Date</Text>
              <Text style={headerCell(2)}>Reference</Text>
              <Text style={headerCell(2, { textAlign: 'right' })}>Amount</Text>
            </View>
            {invoice.receipts.map((receipt, index) => (
              <View key={receipt.id} style={styles.tableRow}>
                <Text style={bodyCell(index, 3)}>
                  {receipt.voucherNo}{receipt.cancelled_at ? ' (Cancelled)' : ''}
                </Text>
                <Text style={bodyCell(index, 2)}>{readableDate(receipt.transaction_date)}</Text>
                <Text style={bodyCell(index, 2)}>{receipt.reference || receipt.narration}</Text>
                <Text style={bodyCell(index, 2, { textAlign: 'right' })}>{money(receipt.amount)}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ ...pdfStyles.tableRow, marginTop: 40 }}>
          <View style={{ flex: 0.8 }}>
            {invoice.narration && (
              <>
                <Text style={{ ...pdfStyles.minInfo, color: mainColor, fontFamily: 'Helvetica-Bold' }}>Narration:</Text>
                <Text style={{ ...pdfStyles.minInfo }}>{invoice.narration}</Text>
              </>
            )}
            {invoice.terms_and_instructions && (
              <>
                <Text style={{ ...pdfStyles.minInfo, color: mainColor, fontFamily: 'Helvetica-Bold', marginTop: 8 }}>
                  Terms and Instructions:
                </Text>
                <Text style={{ ...pdfStyles.minInfo }}>{invoice.terms_and_instructions}</Text>
              </>
            )}
          </View>
          <View style={{ flex: 0.2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor, fontFamily: 'Helvetica-Bold' }}>Prepared By:</Text>
            <Text style={{ ...pdfStyles.minInfo }}>{invoice.creator?.name}</Text>
          </View>
        </View>
        <PageFooter />
      </Page>
    </Document>
  );
}

export default CustomerInvoicePDF;
