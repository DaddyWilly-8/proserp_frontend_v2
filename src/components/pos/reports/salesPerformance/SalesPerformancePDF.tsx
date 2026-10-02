import PageFooter from '@/components/pdf/PageFooter';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Organization } from '@/types/auth-types';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import dayjs from 'dayjs';
import React from 'react';

interface SalesPerformanceProductRow {
  product_id: number;
  product_name: string;
  unit_symbol?: string | null;
  quantity: number;
  amount_ordered: number;
  amount_dispatched: number;
}

interface SalesPerformanceRow {
  key: number | string;
  label: string;
  transaction_count: number;
  amount_ordered: number;
  amount_collected: number;
  products: SalesPerformanceProductRow[];
}

interface SalesPerformancePDFProps {
  organization: Organization;
  rows: SalesPerformanceRow[];
  groupBy: 'customer' | 'sales_person';
  from: string;
  to: string;
  baseCurrencyCode: string;
  printedBy?: string;
}

const formatQuantity = (value: number, unitSymbol?: string | null) =>
  `${(value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}${
    unitSymbol ? ` ${unitSymbol}` : ''
  }`;

const formatAmount = (value: number) =>
  (value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function SalesPerformancePDF({
  organization,
  rows,
  groupBy,
  from,
  to,
  baseCurrencyCode,
  printedBy,
}: SalesPerformancePDFProps) {
  const mainColor = organization.settings?.main_color || '#2113AD';
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';
  const labelColumn = groupBy === 'sales_person' ? 'Sales Person' : 'Customer';

  const totalTransactions = rows.reduce(
    (sum, row) => sum + (row.transaction_count || 0),
    0
  );
  const totalOrdered = rows.reduce(
    (sum, row) => sum + (row.amount_ordered || 0),
    0
  );
  const totalCollected = rows.reduce(
    (sum, row) => sum + (row.amount_collected || 0),
    0
  );

  return (
    <Document
      title={`Sales Performance | ${organization.name}`}
      creator={`${printedBy || ''} | Powered By ProsERP`}
      producer='ProsERP'
    >
      <Page size='A4' orientation='landscape' style={pdfStyles.page}>
        <View style={{ ...pdfStyles.tableRow, marginBottom: 15 }}>
          <View style={{ flex: 1, maxWidth: organization?.logo_path ? 130 : 250 }}>
            <PdfLogo organization={organization} />
          </View>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>
              SALES PERFORMANCE
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>
              {dayjs(from).format('DD MMM YYYY HH:mm')} to {dayjs(to).format('DD MMM YYYY HH:mm')}
            </Text>
            {!!baseCurrencyCode && (
              <Text style={{ ...pdfStyles.minInfo }}>
                Amounts in base currency ({baseCurrencyCode})
              </Text>
            )}
          </View>
        </View>

        <View style={{ ...pdfStyles.table, marginTop: 10 }}>
          <View style={pdfStyles.tableRow}>
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.6 }}>
              Rank
            </Text>
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2.6 }}>
              {labelColumn}
            </Text>
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.2, textAlign: 'right' }}>
              Transactions
            </Text>
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.6, textAlign: 'right' }}>
              Amount Ordered
            </Text>
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.6, textAlign: 'right' }}>
              Amount Collected
            </Text>
          </View>

          {rows.map((row, index) => (
            <React.Fragment key={row.key}>
              <View
                style={{
                  ...pdfStyles.tableRow,
                  backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#f0f0f0',
                }}
              >
                <Text style={{ ...pdfStyles.tableCell, flex: 0.6 }}>{index + 1}</Text>
                <Text style={{ ...pdfStyles.tableCell, flex: 2.6, fontWeight: 'bold' as any }}>
                  {row.label}
                </Text>
                <Text style={{ ...pdfStyles.tableCell, flex: 1.2, textAlign: 'right' }}>
                  {row.transaction_count}
                </Text>
                <Text style={{ ...pdfStyles.tableCell, flex: 1.6, textAlign: 'right' }}>
                  {formatAmount(row.amount_ordered)}
                </Text>
                <Text style={{ ...pdfStyles.tableCell, flex: 1.6, textAlign: 'right' }}>
                  {formatAmount(row.amount_collected)}
                </Text>
              </View>
              {(row.products || []).map((product) => (
                <View
                  key={product.product_id}
                  style={{
                    ...pdfStyles.tableRow,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#f0f0f0',
                  }}
                >
                  <Text style={{ ...pdfStyles.tableCell, flex: 0.6 }} />
                  <Text style={{ ...pdfStyles.tableCell, flex: 2.6, fontSize: 8, paddingLeft: 12, color: '#555555' }}>
                    {product.product_name} (qty: {formatQuantity(product.quantity, product.unit_symbol)})
                  </Text>
                  <Text style={{ ...pdfStyles.tableCell, flex: 1.2 }} />
                  <Text style={{ ...pdfStyles.tableCell, flex: 1.6, textAlign: 'right', fontSize: 8, color: '#555555' }}>
                    {formatAmount(product.amount_ordered)}
                  </Text>
                  <Text style={{ ...pdfStyles.tableCell, flex: 1.6, textAlign: 'right', fontSize: 8, color: '#555555' }}>
                    Disp: {formatAmount(product.amount_dispatched)}
                  </Text>
                </View>
              ))}
            </React.Fragment>
          ))}

          <View style={{ ...pdfStyles.tableRow, backgroundColor: '#d5d5d5' }}>
            <Text style={{ ...pdfStyles.tableHeader, flex: 0.6 }} />
            <Text style={{ ...pdfStyles.tableHeader, flex: 2.6 }}>Total</Text>
            <Text style={{ ...pdfStyles.tableHeader, flex: 1.2, textAlign: 'right' }}>
              {totalTransactions.toLocaleString('en-US')}
            </Text>
            <Text style={{ ...pdfStyles.tableHeader, flex: 1.6, textAlign: 'right' }}>
              {formatAmount(totalOrdered)}
            </Text>
            <Text style={{ ...pdfStyles.tableHeader, flex: 1.6, textAlign: 'right' }}>
              {formatAmount(totalCollected)}
            </Text>
          </View>
        </View>

        <PageFooter />
      </Page>
    </Document>
  );
}

export default SalesPerformancePDF;
