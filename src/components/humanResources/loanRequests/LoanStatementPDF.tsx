import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import PdfLogo from '@/components/pdf/PdfLogo';
import pdfStyles from '@/components/pdf/pdf-styles';
import { Document, Page, Text, View } from '@react-pdf/renderer';

interface StatementRow {
  period_label: string;
  amount: number;
  running_balance: number;
}

interface LoanStatementData {
  loan: {
    employee_id: number;
    employee_number?: string | null;
    employee_name?: string | null;
    department?: string | null;
    status_label?: string;
    recovery_mode?: string;
    amount_approved: number;
    installment_amount: number;
  };
  history: StatementRow[];
  projection: StatementRow[];
  summary: {
    amount_approved: number;
    amount_recovered: number;
    outstanding_balance: number;
    fully_recovered: boolean;
    projected_payoff: string | null;
  };
}

interface LoanStatementPDFProps {
  data: LoanStatementData;
  organization: any;
  userName: string;
  // react-pdf renders outside the React tree, so context isn't available —
  // the caller passes the dictionary down.
  dictionary: any;
}

function money(value?: number | null) {
  return (value != null ? Number(value) : 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function LoanStatementPDF({
  data,
  organization,
  userName,
  dictionary,
}: LoanStatementPDFProps) {
  const t = dictionary.humanResources.loanRequests.pdf;
  const mainColor = organization?.settings?.main_color || '#2113AD';
  const lightColor = organization?.settings?.light_color || '#bec5da';
  const contrastText = organization?.settings?.contrast_text || '#FFFFFF';

  const { loan, history, projection, summary } = data;
  const employeeName =
    loan.employee_name ||
    dictionary.humanResources.loanRequests.common.employeeFallback.replace(
      '{id}',
      String(loan.employee_id)
    );

  const headerCellStyle = {
    ...pdfStyles.tableHeader,
    backgroundColor: mainColor,
    color: contrastText,
    flex: 1,
  };

  const summaryTiles: { label: string; value: string }[] = [
    { label: t.amountApproved, value: money(summary.amount_approved) },
    { label: t.recoveredSoFar, value: money(summary.amount_recovered) },
    { label: t.outstandingBalance, value: money(summary.outstanding_balance) },
    {
      label: t.projectedPayoff,
      value: summary.fully_recovered
        ? t.fullyRecovered
        : summary.projected_payoff || '—',
    },
  ];

  return (
    <Document
      title={t.statementTitle.replace('{name}', employeeName)}
      creator={`${userName} | Powered By ProsERP`}
      producer='ProsERP'
    >
      <Page size='A4' style={pdfStyles.page}>
        <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
          <View style={{ flex: 1, maxWidth: 120 }}>
            <PdfLogo organization={organization} />
          </View>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>
              {t.statement}
            </Text>
          </View>
        </View>

        <View style={{ ...pdfStyles.tableRow, marginBottom: 14 }}>
          <View style={{ flex: 1.5 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              {t.employee}
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>
              {loan.employee_number ? `${loan.employee_number} — ` : ''}
              {employeeName}
            </Text>
            {loan.department && (
              <Text style={{ ...pdfStyles.minInfo }}>{loan.department}</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              {t.status}
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>
              {loan.status_label || '—'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              {t.recovery}
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>
              {loan.recovery_mode === 'fixed_amount'
                ? t.perPeriod.replace('{amount}', money(loan.installment_amount))
                : t.perPeriodInstallments.replace(
                    '{amount}',
                    money(loan.installment_amount)
                  )}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              {t.printedOn}
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>
              {readableDate(undefined, true)}
            </Text>
          </View>
        </View>

        <View style={{ ...pdfStyles.tableRow, marginBottom: 16 }}>
          {summaryTiles.map((tile) => (
            <View
              key={tile.label}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: lightColor,
                padding: 6,
                marginRight: 6,
              }}
            >
              <Text style={{ fontSize: 8, color: '#666666' }}>
                {tile.label}
              </Text>
              <Text style={{ fontSize: 11, fontWeight: 'bold', marginTop: 2 }}>
                {tile.value}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ ...pdfStyles.tableRow, marginBottom: 6 }}>
          <Text style={{ fontSize: 12, fontWeight: 'bold' }}>
            {t.repaymentHistory}
          </Text>
        </View>
        {history.length === 0 ? (
          <Text style={{ fontSize: 9, color: '#666666', marginBottom: 14 }}>
            {t.noPayrollRepayments}
          </Text>
        ) : (
          <View style={{ ...pdfStyles.table, marginBottom: 14 }}>
            <View style={pdfStyles.tableRow}>
              <Text style={headerCellStyle}>{t.period}</Text>
              <Text style={{ ...headerCellStyle, textAlign: 'right' }}>
                {t.amountRecovered}
              </Text>
              <Text style={{ ...headerCellStyle, textAlign: 'right' }}>
                {t.balanceAfter}
              </Text>
            </View>
            {history.map((row, index) => (
              <View key={`h-${index}`} style={pdfStyles.tableRow}>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 1,
                  }}
                >
                  {row.period_label}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 1,
                    textAlign: 'right',
                  }}
                >
                  {money(row.amount)}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 1,
                    textAlign: 'right',
                  }}
                >
                  {money(row.running_balance)}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ ...pdfStyles.tableRow, marginBottom: 6 }}>
          <Text style={{ fontSize: 12, fontWeight: 'bold' }}>
            {t.recoveryProjection}
          </Text>
        </View>
        {summary.fully_recovered ? (
          <Text style={{ fontSize: 9, color: '#15803D' }}>
            {t.loanFullyRecovered}
          </Text>
        ) : projection.length === 0 ? (
          <Text style={{ fontSize: 9, color: '#666666' }}>
            {t.projectionUnavailable}
          </Text>
        ) : (
          <>
            <Text style={{ fontSize: 8, color: '#666666', marginBottom: 6 }}>
              {t.estimateOnly}
            </Text>
            <View style={pdfStyles.table}>
              <View style={pdfStyles.tableRow}>
                <Text style={headerCellStyle}>{t.periodProjected}</Text>
                <Text style={{ ...headerCellStyle, textAlign: 'right' }}>
                  {t.expectedDeduction}
                </Text>
                <Text style={{ ...headerCellStyle, textAlign: 'right' }}>
                  {t.balanceAfter}
                </Text>
              </View>
              {projection.map((row, index) => (
                <View key={`p-${index}`} style={pdfStyles.tableRow}>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor:
                        index % 2 === 0 ? '#FFFFFF' : lightColor,
                      flex: 1,
                      color: '#666666',
                      fontStyle: 'italic',
                    }}
                  >
                    {row.period_label}
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor:
                        index % 2 === 0 ? '#FFFFFF' : lightColor,
                      flex: 1,
                      textAlign: 'right',
                      color: '#666666',
                      fontStyle: 'italic',
                    }}
                  >
                    {money(row.amount)}
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor:
                        index % 2 === 0 ? '#FFFFFF' : lightColor,
                      flex: 1,
                      textAlign: 'right',
                      color: '#666666',
                      fontStyle: 'italic',
                    }}
                  >
                    {money(row.running_balance)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </Page>
    </Document>
  );
}
