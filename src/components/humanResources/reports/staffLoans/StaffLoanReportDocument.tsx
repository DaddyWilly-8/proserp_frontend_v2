import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import PdfLogo from '@/components/pdf/PdfLogo';
import pdfStyles from '@/components/pdf/pdf-styles';
import { Document, Page, Text, View } from '@react-pdf/renderer';

type StaffLoanRow = {
  employee_number: string;
  employee_name: string;
  department: string | null;
  status_label: string;
  requested_at: string | null;
  amount_approved: number;
  installment_amount: number;
  disbursed: boolean;
  amount_recovered: number;
  outstanding_balance: number;
};

type StaffLoansResponse = {
  rows: StaffLoanRow[];
  totals: {
    amount_approved: number;
    amount_recovered: number;
    outstanding_balance: number;
    count: number;
  };
};

interface StaffLoanReportDocumentProps {
  data: StaffLoansResponse;
  organization: any;
  userName: string;
  filtersLabel: string;
  dictionary: any;
}

function formatNumber(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  return numeric.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const buildColumns = (dictionary: any) => [
  { label: dictionary.humanResources.reports.common.employeeNo, flex: 1.1 },
  { label: dictionary.humanResources.reports.common.name, flex: 1.6 },
  { label: dictionary.humanResources.reports.common.department, flex: 1.3 },
  { label: dictionary.humanResources.reports.common.status, flex: 1.1 },
  { label: dictionary.humanResources.reports.staffLoans.columns.requested, flex: 1 },
  { label: dictionary.humanResources.reports.staffLoans.columns.approved, flex: 1, align: 'right' as const },
  { label: dictionary.humanResources.reports.staffLoans.columns.installment, flex: 1, align: 'right' as const },
  { label: dictionary.humanResources.reports.staffLoans.columns.disbursed, flex: 0.8, align: 'center' as const },
  { label: dictionary.humanResources.reports.staffLoans.columns.recovered, flex: 1, align: 'right' as const },
  { label: dictionary.humanResources.reports.staffLoans.columns.outstanding, flex: 1, align: 'right' as const },
];

export default function StaffLoanReportDocument({
  data,
  organization,
  userName,
  filtersLabel,
  dictionary,
}: StaffLoanReportDocumentProps) {
  const columns = buildColumns(dictionary);
  const mainColor = organization?.settings?.main_color || '#2113AD';
  const lightColor = organization?.settings?.light_color || '#bec5da';
  const contrastText = organization?.settings?.contrast_text || '#FFFFFF';

  const rows = data?.rows ?? [];
  const totals = data?.totals;

  return (
    <Document
      title={dictionary.humanResources.reports.staffLoans.pdfTitle}
      creator={` ${userName} | Powered By ProsERP`}
      producer='ProsERP'
    >
      <Page size='A4' orientation='landscape' style={pdfStyles.page}>
        <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
          <View style={{ flex: 1, maxWidth: 120 }}>
            <PdfLogo organization={organization} />
          </View>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>{dictionary.humanResources.reports.staffLoans.pdfTitle}</Text>
          </View>
        </View>

        <View style={{ ...pdfStyles.tableRow, marginBottom: 12 }}>
          <View style={{ flex: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>{dictionary.humanResources.reports.common.filters}</Text>
            <Text style={pdfStyles.minInfo}>{filtersLabel}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>{dictionary.humanResources.reports.common.printedOn}</Text>
            <Text style={pdfStyles.minInfo}>{readableDate(undefined, true)}</Text>
          </View>
        </View>

        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            {columns.map((column) => (
              <Text
                key={column.label}
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: column.flex,
                  textAlign: column.align || 'left',
                }}
              >
                {column.label}
              </Text>
            ))}
          </View>

          {rows.map((row, index) => {
            const bg = index % 2 === 0 ? '#FFFFFF' : lightColor;
            return (
              <View key={`${row.employee_number}-${index}`} style={pdfStyles.tableRow}>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: bg, flex: 1.1 }}>{row.employee_number}</Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: bg, flex: 1.6 }}>{row.employee_name}</Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: bg, flex: 1.3 }}>{row.department || '-'}</Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: bg, flex: 1.1 }}>{row.status_label}</Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: bg, flex: 1 }}>{row.requested_at || '-'}</Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: bg, flex: 1, textAlign: 'right' }}>
                  {formatNumber(row.amount_approved)}
                </Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: bg, flex: 1, textAlign: 'right' }}>
                  {formatNumber(row.installment_amount)}
                </Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: bg, flex: 0.8, textAlign: 'center' }}>
                  {row.disbursed ? dictionary.humanResources.reports.common.yes : dictionary.humanResources.reports.common.no}
                </Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: bg, flex: 1, textAlign: 'right' }}>
                  {formatNumber(row.amount_recovered)}
                </Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: bg, flex: 1, textAlign: 'right' }}>
                  {formatNumber(row.outstanding_balance)}
                </Text>
              </View>
            );
          })}

          {totals && (
            <View style={pdfStyles.tableRow}>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 6.9 }}>
                {dictionary.humanResources.reports.common.totalWithCount.replace('{count}', String(totals.count))}
              </Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1, textAlign: 'right' }}>
                {formatNumber(totals.amount_approved)}
              </Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.8 }} />
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1, textAlign: 'right' }}>
                {formatNumber(totals.amount_recovered)}
              </Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1, textAlign: 'right' }}>
                {formatNumber(totals.outstanding_balance)}
              </Text>
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}
