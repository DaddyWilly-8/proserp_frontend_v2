import React from 'react';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { formatValue } from './formatValue';
import { ReportColumn, ReportTable } from './reportTypes';

interface Props {
  table: ReportTable;
  title: string;
  /** The filters as printed in the header: [label, value]. */
  filterLines: [string, string][];
  labelOf: (column: ReportColumn) => string;
  notes: string[];
  authOrganization: any;
  user: any;
  dict: {
    printedBy: string; printedOn: string; total: string; summary: string; page: string;
    preparedBy: string; verifiedBy: string; approvedBy: string; signature: string;
  };
}

const styles = StyleSheet.create({
  page: { padding: 16, paddingBottom: 26, fontFamily: 'Helvetica' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  title: { fontSize: 12, fontWeight: 'bold', marginBottom: 2 },
  subtitle: { fontSize: 8 },
  table: { display: 'table' as any, width: '100%' },
  row: { flexDirection: 'row' },
  bottomRow: { flexDirection: 'row', marginTop: 10, alignItems: 'flex-start' },
  summaryWrap: { width: '42%' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', minHeight: 15, borderBottomWidth: 0.5, borderBottomStyle: 'solid', borderBottomColor: '#B8B8B8' },
  summaryLabel: { flex: 5, fontSize: 8, fontWeight: 'bold', paddingRight: 6 },
  summaryAmount: { flex: 2, fontSize: 8, fontWeight: 'bold', textAlign: 'right' },
  note: { fontSize: 7, fontStyle: 'italic', marginTop: 4 },
  signaturesWrap: { flex: 1, marginLeft: 28 },
  signatureRow: { flexDirection: 'row', alignItems: 'center', minHeight: 20, borderBottomWidth: 0.5, borderBottomStyle: 'solid', borderBottomColor: '#B8B8B8' },
  signatureLabel: { flex: 6, fontSize: 9, fontWeight: 'bold' },
  signatureText: { flex: 3, fontSize: 9, fontWeight: 'bold', textAlign: 'left' },
  footer: { position: 'absolute', bottom: 10, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, color: '#555555' },
});

/** How wide a column should be, relative to the others: the longest of its heading's longest word and its values, kept within limits. */
const weightOf = (column: ReportColumn, index: number, table: ReportTable, label: string) => {
  const values = [...table.rows, ...(table.totals ? [table.totals] : [])].map((row) => formatValue(row[column.key], column.type).length);
  const longestWord = Math.max(...label.split(' ').map((word) => word.length), 4);
  const content = Math.max(...values, 3);

  return Math.min(Math.max(Math.max(longestWord, content), index === 0 ? 9 : 5), index === 0 ? 30 : 22);
};

/**
 * Any report as a PDF laid out like the Salary Sheet: landscape, tight margins and small type so many columns fit
 * (A3 when there are very many), the heading row repeated on every page, thin bordered cells with banded rows, a
 * coloured total row, a summary panel and the prepared / verified / approved lines at the end.
 */
const BioReportPdf = ({ table, title, filterLines, labelOf, notes, authOrganization, user, dict }: Props) => {
  const organization = authOrganization.organization;
  const settings = organization.settings;
  const mainColor = settings?.main_color || '#2113AD';
  const lightColor = settings?.light_color || '#bec5da';
  const contrastText = settings?.contrast_text || '#FFFFFF';
  const borderColor = '#555555';

  const count = table.columns.length;
  const fontSize = count > 14 ? 6 : count > 9 ? 6.5 : 7.5;
  const weights = table.columns.map((column, index) => weightOf(column, index, table, labelOf(column)));
  const sum = weights.reduce((a, b) => a + b, 0);
  const widthOf = (index: number) => `${(weights[index] / sum) * 100}%`;
  const align = (column: ReportColumn) => (column.type === 'text' ? 'left' : 'right');

  const cell = (column: ReportColumn, index: number, content: string, extra: Record<string, any> = {}) => (
    <Text key={column.key} style={{ width: widthOf(index), padding: 3, fontSize, borderWidth: 0.5, borderStyle: 'solid', borderColor, textAlign: align(column), ...extra }}>{content}</Text>
  );

  // The key figures again, in the summary panel: every column that has a total, the first (label) column apart.
  const summary = table.totals ? table.columns.slice(1).filter((column) => table.totals![column.key] !== undefined && table.totals![column.key] !== null && table.totals![column.key] !== '') : [];
  const subtitle = filterLines.slice(0, 3).map(([, value]) => value).join('  |  ');
  const extra = filterLines.slice(3).map(([label, value]) => `${label}: ${value}`).join('  |  ');

  return (
    <Document title={`${title} ${subtitle}`} author={organization.name} subject={title} creator={`${user.name} | Powered by ProsERP`} producer='ProsERP'>
      <Page size={count > 14 ? 'A3' : 'A4'} orientation='landscape' style={styles.page}>
        <View style={styles.headerRow}>
          <View style={{ width: 110 }}>
            <PdfLogo organization={organization} />
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ ...styles.title, color: mainColor }}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
            {!!extra && <Text style={{ ...styles.subtitle, marginTop: 1 }}>{extra}</Text>}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.row} fixed>
            {table.columns.map((column, index) => cell(column, index, labelOf(column), { fontWeight: 'bold', backgroundColor: mainColor, color: contrastText }))}
          </View>
          {table.rows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row} wrap={false}>
              {table.columns.map((column, index) => cell(column, index, formatValue(row[column.key], column.type), { backgroundColor: rowIndex % 2 === 0 ? '#FFFFFF' : lightColor, fontWeight: row.bold ? 'bold' : 'normal' }))}
            </View>
          ))}
          {table.totals && (
            <View style={styles.row} wrap={false}>
              {table.columns.map((column, index) => cell(column, index, index === 0 ? dict.total : formatValue(table.totals![column.key], column.type), { fontWeight: 'bold', backgroundColor: mainColor, color: contrastText }))}
            </View>
          )}
        </View>

        <View style={styles.bottomRow} wrap={false}>
        {summary.length > 0 && (
          <View style={styles.summaryWrap}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: mainColor, marginBottom: 3 }}>{dict.summary}</Text>
            {summary.map((column) => (
              <View key={column.key} style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{labelOf(column)}</Text>
                <Text style={styles.summaryAmount}>{formatValue(table.totals![column.key], column.type)}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.signaturesWrap}>
          <View style={styles.signatureRow}>
            <Text style={styles.signatureLabel}>{dict.preparedBy}..........................................</Text>
            <Text style={styles.signatureText}>{dict.signature}..................................</Text>
          </View>
          <View style={styles.signatureRow}>
            <Text style={styles.signatureLabel}>{dict.verifiedBy}..........................................</Text>
            <Text style={styles.signatureText}>{dict.signature}..................................</Text>
          </View>
          <Text style={{ fontSize: 8, fontStyle: 'italic', marginVertical: 6 }}>
            {dict.printedBy}: {user.name}   |   {dict.printedOn}: {readableDate(undefined, true)}
          </Text>
          <View style={styles.signatureRow}>
            <Text style={styles.signatureLabel}>{dict.approvedBy}..........................................</Text>
            <Text style={styles.signatureText}>{dict.signature}..................................</Text>
          </View>
        </View>

        </View>

        {notes.map((note) => <Text key={note} style={styles.note}>{note}</Text>)}

        <View style={styles.footer} fixed>
          <Text>{organization.name}  |  {title}</Text>
          <Text render={({ pageNumber, totalPages }) => `${dict.page} ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};

export default BioReportPdf;
