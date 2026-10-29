import { Document, Page, Text, View } from '@react-pdf/renderer';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import pdfStyles from '../../../pdf/pdf-styles';
import PdfLogo from '../../../pdf/PdfLogo';
import { formatDate } from '../../bankReconciliation/reconciliation/date-format';
import {
  describeEntryMatch,
  describeLineMatch,
  FLAG_LABELS,
  FLAG_ORDER,
  formatAmount,
  optionalAmount,
  balanceRows,
  statementBalancesText,
  statementStatusText,
  VIEW_LABELS,
} from './reconciliation-statement-helpers';

const FLAG_COLORS: Record<string, string> = {
  reconciled: '#1B7A3D',
  unreconciled: '#C62828',
  partial: '#B26A00',
  outstanding: '#1565C0',
  ignored: '#666666',
};

const ReconciliationStatementPDF = ({ reportData, authOrganization, user }: any) => {
  if (!reportData) return null;

  const organization = authOrganization?.organization;
  const mainColor = organization?.settings?.main_color || '#2113AD';
  const lightColor = organization?.settings?.light_color || '#bec5da';
  const contrastText = organization?.settings?.contrast_text || '#FFFFFF';
  const accountName = [reportData.bank_account?.name, reportData.bank_account?.bank].filter(Boolean).join(' — ');

  const header = (cols: { label: string; flex: number; right?: boolean }[]) => (
    <View style={pdfStyles.tableRow} fixed>
      {cols.map((c) => (
        <Text
          key={c.label}
          style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: c.flex, textAlign: c.right ? 'right' : 'left' }}
        >
          {c.label}
        </Text>
      ))}
    </View>
  );

  const cell = (index: number, flex: number, content: any, extra: any = {}) => (
    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex, ...extra }}>{content}</Text>
  );

  return (
    <Document creator={`${user?.name || ''} | Powered By ProsERP`} producer='ProsERP' title='Reconciliation Statement'>
      <Page size='A4' orientation='landscape' style={pdfStyles.page}>
        <View style={{ ...pdfStyles.tableRow, marginBottom: 14 }}>
          <View style={{ flex: 1, maxWidth: 120 }}>
            <PdfLogo organization={organization} />
          </View>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>Reconciliation Statement</Text>
            <Text style={pdfStyles.minInfo}>{accountName}</Text>
            <Text style={pdfStyles.minInfo}>
              {formatDate(reportData.from)} to {formatDate(reportData.to)} · {VIEW_LABELS[reportData.view]}
            </Text>
          </View>
        </View>

        <View style={{ ...pdfStyles.tableRow, marginBottom: 8 }}>
          <View style={{ flex: 3, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Statements covered</Text>
            {reportData.statements?.length === 0 && <Text style={pdfStyles.minInfo}>No bank statement overlaps this period.</Text>}
            {(reportData.statements || []).map((s: any) => (
              <Text key={s.id} style={pdfStyles.minInfo}>
                {statementStatusText(s)}
                {'\n'}
                {statementBalancesText(s)}
              </Text>
            ))}
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Printed by</Text>
            <Text style={pdfStyles.minInfo}>{user?.name || ''}</Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Printed on</Text>
            <Text style={pdfStyles.minInfo}>{readableDate(undefined, true)}</Text>
          </View>
        </View>

        {/* Opening / closing balances: bank against books */}
        <View style={{ ...pdfStyles.table, marginBottom: 14 }}>
          {header([
            { label: 'Balances', flex: 2 },
            { label: 'Bank', flex: 2, right: true },
            { label: 'Books', flex: 2, right: true },
            { label: 'Difference', flex: 2, right: true },
          ])}
          {balanceRows(reportData.balances).map((row, i) => (
            <View key={row.label} style={pdfStyles.tableRow} wrap={false}>
              {cell(i, 2, row.label)}
              {cell(i, 2, optionalAmount(row.bank), { textAlign: 'right' })}
              {cell(i, 2, optionalAmount(row.books), { textAlign: 'right' })}
              {cell(i, 2, optionalAmount(row.difference), {
                textAlign: 'right',
                fontWeight: 'bold',
                color: row.difference == null || Math.abs(row.difference) <= 0.05 ? '#000000' : '#C62828',
              })}
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={{ ...pdfStyles.table, marginBottom: 14 }}>
          {header([
            { label: 'Whole period', flex: 2 },
            { label: 'Bank lines', flex: 2, right: true },
            { label: 'Book entries', flex: 2, right: true },
          ])}
          {FLAG_ORDER.map((f, i) => (
            <View key={f} style={pdfStyles.tableRow} wrap={false}>
              {cell(i, 2, FLAG_LABELS[f], { color: FLAG_COLORS[f], fontWeight: 'bold' })}
              {cell(i, 2, `${reportData.totals.lines[f].count} · ${formatAmount(reportData.totals.lines[f].amount)}`, { textAlign: 'right' })}
              {cell(i, 2, `${reportData.totals.entries[f].count} · ${formatAmount(reportData.totals.entries[f].amount)}`, { textAlign: 'right' })}
            </View>
          ))}
        </View>

        {/* Bank statement lines */}
        <Text style={{ ...pdfStyles.minInfo, color: mainColor, marginBottom: 3 }}>Bank statement lines ({reportData.lines.length})</Text>
        <View style={{ ...pdfStyles.table, marginBottom: 14 }}>
          {header([
            { label: 'Date', flex: 1 },
            { label: 'Description', flex: 4 },
            { label: 'Amount', flex: 1.5, right: true },
            { label: 'Status', flex: 1.4 },
            { label: 'Matched to', flex: 4 },
          ])}
          {reportData.lines.length === 0 && (
            <View style={pdfStyles.tableRow}>{cell(0, 1, 'Nothing to show for this selection.')}</View>
          )}
          {reportData.lines.map((l: any, i: number) => (
            <View key={l.id} style={pdfStyles.tableRow} wrap={false}>
              {cell(i, 1, formatDate(l.line_date))}
              {cell(i, 4, l.description)}
              {cell(i, 1.5, formatAmount(l.amount), { textAlign: 'right' })}
              {cell(i, 1.4, FLAG_LABELS[l.flag], { color: FLAG_COLORS[l.flag], fontWeight: 'bold' })}
              {cell(i, 4, (l.matches || []).map(describeLineMatch).join('\n'))}
            </View>
          ))}
        </View>

        {/* Book entries */}
        <Text style={{ ...pdfStyles.minInfo, color: mainColor, marginBottom: 3 }}>Book entries ({reportData.entries.length})</Text>
        <View style={pdfStyles.table}>
          {header([
            { label: 'Date', flex: 1 },
            { label: 'Voucher', flex: 1.3 },
            { label: 'Description', flex: 3.5 },
            { label: 'Amount', flex: 1.5, right: true },
            { label: 'Status', flex: 1.4 },
            { label: 'Matched lines', flex: 3 },
          ])}
          {reportData.entries.length === 0 && (
            <View style={pdfStyles.tableRow}>{cell(0, 1, 'Nothing to show for this selection.')}</View>
          )}
          {reportData.entries.map((e: any, i: number) => (
            <View key={e.id} style={pdfStyles.tableRow} wrap={false}>
              {cell(i, 1, formatDate(e.journal_date))}
              {cell(i, 1.3, e.voucher_no)}
              {cell(i, 3.5, [e.description, e.counterparty].filter(Boolean).join(' — '))}
              {cell(i, 1.5, formatAmount(e.amount), { textAlign: 'right' })}
              {cell(
                i,
                1.4,
                FLAG_LABELS[e.flag] + (e.flag === 'partial' ? `\n${formatAmount(e.remaining_amount)} not matched` : ''),
                { color: FLAG_COLORS[e.flag], fontWeight: 'bold' }
              )}
              {cell(i, 3, (e.lines || []).map(describeEntryMatch).join('\n'))}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

export default ReconciliationStatementPDF;
