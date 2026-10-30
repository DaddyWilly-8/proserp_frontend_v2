import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import pdfStyles from '../../pdf/pdf-styles';
import PdfLogo from '../../pdf/PdfLogo';

const money = (value?: number | null) =>
  value == null ? '—' : value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const percent = (value?: number | null) => (value == null ? '—' : `${value.toFixed(2)}%`);

// S/N, Project, Client, Category, Contract Value, Site Impl %, Time Elapsed %, then five
// amount+% pairs (each rendered as one two-line cell), Outstanding Liabilities. Remarks is
// left off the PDF - it's an engineer's free-text commentary, always blank until filled in
// by hand, and doesn't fit landscape A4 alongside the rest of these columns.
const COLUMNS = [
  { key: 'sn', label: 'sn', flex: 0.4 },
  { key: 'project', label: 'project', flex: 2.4 },
  { key: 'client', label: 'client', flex: 1.3 },
  { key: 'category', label: 'category', flex: 1.1 },
  { key: 'contract_value', label: 'contract_value', flex: 1.3 },
  { key: 'site_implementation_percentage', label: 'site_implementation_percentage', flex: 0.9 },
  { key: 'time_elapsed_percentage', label: 'time_elapsed_percentage', flex: 0.9 },
  { key: 'progressive_revenue', label: 'progressive_revenue', flex: 1.4 },
  { key: 'billed_revenue', label: 'billed_revenue', flex: 1.4 },
  { key: 'unbilled_revenue', label: 'unbilled_revenue', flex: 1.4 },
  { key: 'received_payments', label: 'received_payments', flex: 1.4 },
  { key: 'certified_pending_payment', label: 'certified_pending_payment', flex: 1.4 },
  { key: 'outstanding_liabilities', label: 'outstanding_liabilities', flex: 1.3 },
];

const cellValue = (row: any, key: string): string => {
  switch (key) {
    case 'project':
      return `${row.name || ''}\n${row.projectNo || ''}`;
    case 'client':
      return row.client || '—';
    case 'category':
      return row.category || '—';
    case 'contract_value':
      return money(row.contract_value);
    case 'site_implementation_percentage':
      return percent(row.site_implementation_percentage);
    case 'time_elapsed_percentage':
      return percent(row.time_elapsed_percentage);
    case 'progressive_revenue':
      return `${money(row.progressive_revenue)}\n${percent(row.progressive_revenue_percentage)}`;
    case 'billed_revenue':
      return `${money(row.billed_revenue)}\n${percent(row.billed_revenue_percentage)}`;
    case 'unbilled_revenue':
      return `${money(row.unbilled_revenue)}\n${percent(row.unbilled_revenue_percentage)}`;
    case 'received_payments':
      return `${money(row.received_payments)}\n${percent(row.received_payments_percentage)}`;
    case 'certified_pending_payment':
      return `${money(row.certified_pending_payment)}\n${percent(row.certified_pending_payment_percentage)}`;
    case 'outstanding_liabilities':
      return money(row.outstanding_liabilities);
    default:
      return '';
  }
};

const totalValue = (totals: any, key: string): string => {
  switch (key) {
    case 'contract_value':
    case 'progressive_revenue':
    case 'billed_revenue':
    case 'unbilled_revenue':
    case 'received_payments':
    case 'certified_pending_payment':
    case 'outstanding_liabilities':
      return money(totals?.[key]);
    default:
      return '';
  }
};

const ProjectStatusReportPDF = ({ authOrganization, user, rows, totals, asAt, dictionary }: any) => {
  const organization = authOrganization?.organization;
  const mainColor = organization?.settings?.main_color || '#2113AD';
  const lightColor = organization?.settings?.light_color || '#bec5da';
  const contrastText = organization?.settings?.contrast_text || '#FFFFFF';

  return (
    <Document creator={`${user?.name || ''} | Powered By ProsERP`} producer='ProsERP' title={dictionary.projectManagement.projectStatusReport.title}>
      <Page size='A4' orientation='landscape' style={pdfStyles.page}>
        <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
          <View style={{ flex: 1, maxWidth: 120 }}>
            <PdfLogo organization={organization} />
          </View>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>{dictionary.projectManagement.projectStatusReport.title}</Text>
            <Text style={pdfStyles.minInfo}>{dictionary.projectManagement.projectStatusReport.asAtColon.replace('{date}', readableDate(asAt, true))}</Text>
          </View>
        </View>

        <View style={{ ...pdfStyles.tableRow, marginBottom: 10 }}>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>{dictionary.projectManagement.projectStatusReport.printedBy}</Text>
            <Text style={pdfStyles.minInfo}>{user?.name || ''}</Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>{dictionary.projectManagement.projectStatusReport.printedOn}</Text>
            <Text style={pdfStyles.minInfo}>{readableDate(undefined, true)}</Text>
          </View>
        </View>

        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            {COLUMNS.map((col) => (
              <Text
                key={col.key}
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: col.flex,
                  fontSize: '7px',
                  textAlign: col.key === 'project' || col.key === 'client' || col.key === 'category' ? 'left' : 'right',
                }}
              >
                {dictionary.projectManagement.projectStatusReport.columns[col.label]}
              </Text>
            ))}
          </View>

          {(rows || []).map((row: any, index: number) => (
            <View key={row.id ?? index} style={pdfStyles.tableRow}>
              {COLUMNS.map((col) => (
                <Text
                  key={col.key}
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: col.flex,
                    fontSize: '6px',
                    textAlign: col.key === 'project' || col.key === 'client' || col.key === 'category' ? 'left' : 'right',
                  }}
                >
                  {col.key === 'sn' ? index + 1 : cellValue(row, col.key)}
                </Text>
              ))}
            </View>
          ))}

          <View style={pdfStyles.tableRow}>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: COLUMNS[0].flex + COLUMNS[1].flex + COLUMNS[2].flex + COLUMNS[3].flex,
                fontSize: '8px',
              }}
            >
              {dictionary.projectManagement.projectStatusReport.total}
            </Text>
            {COLUMNS.slice(4).map((col) => (
              <Text
                key={col.key}
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: col.flex,
                  fontSize: '7px',
                  textAlign: 'right',
                }}
              >
                {totalValue(totals, col.key)}
              </Text>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default ProjectStatusReportPDF;
