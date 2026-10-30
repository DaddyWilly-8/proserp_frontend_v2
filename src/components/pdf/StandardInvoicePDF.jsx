import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { Document, Font, Page, Text, View } from '@react-pdf/renderer';
import DocumentStakeholders from './DocumentStakeholders';
import PageFooter from './PageFooter';
import pdfStyles from './pdf-styles';
import PdfLogo from './PdfLogo';

const money = (value = 0) =>
  (value ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/**
 * The shared invoice layout, modelled on the Proforma / Sales Invoice PDFs: logo and title on
 * the left/right, the BILL FROM / BILL TO block, a details row, an S/N items table, right-aligned
 * total rows, then receipts, narration / terms and the Prepared By / Received By block.
 *
 * Callers describe their document rather than lay it out:
 *  - details:  [{ label, value }]            the small label/value row under the parties
 *  - columns:  [{ label, flex, align, get }] items table columns after S/N; get(row) returns a
 *                                            string or a React node
 *  - rows:     [{ key, ... }]                one per item line
 *  - totals:   [{ label, value }]            right-aligned header-styled rows, in order
 *  - receipts: [{ id, voucherNo, ... }]      optional table of payments received
 */
function StandardInvoicePDF({
  organization,
  meta = {},
  heading = 'INVOICE',
  number,
  stakeholder,
  details = [],
  columns,
  rows,
  totals = [],
  receipts = [],
  narration,
  terms,
  preparedBy,
  orientation = 'portrait',
}) {
  const mainColor = organization?.settings?.main_color || '#2113AD';
  const lightColor = organization?.settings?.light_color || '#bec5da';
  const contrastText = organization?.settings?.contrast_text || '#FFFFFF';

  Font.registerHyphenationCallback((word) => [word]);

  const headerCell = (flex, align) => ({
    ...pdfStyles.tableCell,
    ...pdfStyles.tableHeader,
    backgroundColor: mainColor,
    color: contrastText,
    flex,
    ...(align === 'right' ? { textAlign: 'right' } : {}),
  });
  const bodyCell = (index, flex) => ({
    ...pdfStyles.tableCell,
    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
    flex,
  });
  const label = { ...pdfStyles.minInfo, color: mainColor };
  const totalCell = (flex) => ({
    ...pdfStyles.tableHeader,
    backgroundColor: mainColor,
    color: contrastText,
    flex,
    textAlign: 'right',
  });

  const cell = (value, align) =>
    typeof value === 'string' || typeof value === 'number' ? (
      <Text style={align === 'right' ? { textAlign: 'right' } : undefined}>
        {value}
      </Text>
    ) : (
      value
    );

  return (
    <Document
      title={meta.title ?? number}
      author={meta.author}
      subject={meta.subject ?? 'Invoice'}
      creator='ProsERP'
      producer='ProsERP'
      keywords={meta.keywords}
    >
      <Page size='A4' orientation={orientation} style={pdfStyles.page}>
        <View style={{ ...pdfStyles.tableRow, marginBottom: 10 }}>
          <View
            style={{ flex: 1, maxWidth: organization?.logo_path ? 130 : 250 }}
          >
            <PdfLogo organization={organization} />
          </View>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>
              {heading}
            </Text>
            <Text style={pdfStyles.midInfo}>{number}</Text>
          </View>
        </View>

        {stakeholder && (
          <DocumentStakeholders
            stakeholder={stakeholder}
            organization={organization}
          />
        )}

        {details.length > 0 && (
          <View style={{ ...pdfStyles.tableRow, marginBottom: 8 }}>
            {details.map((detail) => (
              <View key={detail.label} style={{ flex: 1, padding: 2 }}>
                <Text style={label}>{detail.label}</Text>
                <Text style={pdfStyles.minInfo}>{detail.value}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ ...pdfStyles.table, minHeight: 130 }}>
          <View style={pdfStyles.tableRow} fixed>
            <Text style={headerCell(0.3)}>S/N</Text>
            {columns.map((column) => (
              <Text key={column.label} style={headerCell(column.flex, column.align)}>
                {column.label}
              </Text>
            ))}
          </View>
          {rows.map((row, index) => (
            <View key={row.key} style={pdfStyles.tableRow} wrap={false}>
              <Text style={bodyCell(index, 0.3)}>{index + 1}</Text>
              {columns.map((column) => (
                <View
                  key={column.label}
                  style={{ ...bodyCell(index, column.flex), flexDirection: 'column' }}
                >
                  {cell(column.get(row, index), column.align)}
                </View>
              ))}
            </View>
          ))}
        </View>

        {totals.map((total, index) => (
          <View
            key={total.label}
            style={{ ...pdfStyles.tableRow, marginTop: index === 0 ? 4 : 1 }}
            wrap={false}
          >
            <Text style={{ textAlign: 'center', flex: 4.3 }}></Text>
            <Text style={totalCell(2.2)}>{total.label}</Text>
            <Text style={totalCell(2)}>{total.value}</Text>
          </View>
        ))}

        {receipts.length > 0 && (
          <View style={{ ...pdfStyles.table, minHeight: 40, marginTop: 14 }}>
            <View style={pdfStyles.tableRow}>
              <Text style={headerCell(3)}>Receipt No.</Text>
              <Text style={headerCell(2)}>Date</Text>
              <Text style={headerCell(2)}>Reference</Text>
              <Text style={headerCell(2, 'right')}>Amount</Text>
            </View>
            {receipts.map((receipt, index) => (
              <View key={receipt.id} style={pdfStyles.tableRow} wrap={false}>
                <Text style={bodyCell(index, 3)}>
                  {receipt.voucherNo}
                  {receipt.cancelled_at ? ' (Cancelled)' : ''}
                </Text>
                <Text style={bodyCell(index, 2)}>
                  {readableDate(receipt.transaction_date, false)}
                </Text>
                <Text style={bodyCell(index, 2)}>
                  {receipt.reference || receipt.narration}
                </Text>
                <Text style={{ ...bodyCell(index, 2), textAlign: 'right' }}>
                  {money(receipt.amount)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {(!!narration || !!terms) && (
          <View style={{ ...pdfStyles.tableRow, marginTop: 10 }} wrap={false}>
            {!!narration && (
              <View style={{ flex: 1, padding: 2 }}>
                <Text style={label}>Narration</Text>
                <Text style={pdfStyles.minInfo}>{narration}</Text>
              </View>
            )}
            {!!terms && (
              <View style={{ flex: 1, padding: 2 }}>
                <Text style={label}>Terms And Instructions</Text>
                <Text style={pdfStyles.minInfo}>{terms}</Text>
              </View>
            )}
          </View>
        )}

        <View style={{ ...pdfStyles.tableRow, marginTop: 15 }} wrap={false}>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={label}>Prepared By</Text>
            <Text style={{ ...pdfStyles.minInfo, paddingTop: 5 }}>
              {preparedBy}
            </Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={label}>Received By</Text>
            <View
              style={{
                borderBottomWidth: 0.5,
                borderBottomColor: '#000',
                marginTop: 14,
                marginRight: 40,
              }}
            />
          </View>
        </View>

        <PageFooter />
      </Page>
    </Document>
  );
}

export { money };
export default StandardInvoicePDF;
