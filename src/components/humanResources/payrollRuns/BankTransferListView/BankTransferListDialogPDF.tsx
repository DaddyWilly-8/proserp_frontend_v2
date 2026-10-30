import PageFooter from '@/components/pdf/PageFooter';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Organization } from '@/types/auth-types';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { SalarySheetType } from '../salarySheetType';

interface BankTransferListDialogPDFProps {
  organization: Organization;
  bankTransfer: SalarySheetType;
  // react-pdf renders in its own tree, so React context (useDictionary)
  // isn't available here — the caller passes the dictionary in.
  dictionary: any;
}


function BankTransferListDialogPDF({
  organization,
  bankTransfer,
  dictionary,
}: BankTransferListDialogPDFProps) {
  const t = dictionary.humanResources.payrollRuns.bankTransfer;
  const monthNames: string[] = dictionary.humanResources.payrollRuns.months;
  const mainColor = organization.settings?.main_color || '#2113AD';
  const lightColor = organization.settings?.light_color || '#bec5da';
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';

  const payrollRun = bankTransfer?.run;
  const monthNo = payrollRun?.period?.month;
  const year = payrollRun?.period?.year;
  const monthName = monthNo ? monthNames[monthNo - 1] : '';
  const payrollPeriod = monthName ? `${year} - ${monthName}` : '-';

  const costCenter = payrollRun?.cost_center;
  const rows = bankTransfer?.rows || [];
  const zeroPayEmployees = bankTransfer?.zero_pay_employees || [];

  return (
    <Document
      title={t.docTitle.replace('{period}', payrollPeriod)}
      subject={t.docSubject}
      creator='ProsERP'
      producer='ProsERP'
    >
      <Page size='A4' orientation='landscape' style={pdfStyles.page}>
        {/* HEADER SECTION */}
        <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
          <View
            style={{ flex: 1, maxWidth: organization?.logo_path ? 130 : 250 }}
          >
            <PdfLogo organization={organization} />
          </View>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>
              {t.title}
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>{payrollPeriod}</Text>
          </View>
        </View>

        {/* METADATA / FILTERS GRID */}
        <View style={{ ...pdfStyles.tableRow, marginBottom: 15 }}>
          {costCenter && (
            <View style={{ flex: 1, padding: 2 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
                {t.costCenter}
              </Text>
              <Text style={{ ...pdfStyles.minInfo }}>
                {costCenter.name || '-'}
              </Text>
            </View>
          )}
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              {t.payrollPeriod}
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>{payrollPeriod}</Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              {t.payrollStatus}
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>
              {(dictionary.humanResources.payrollRuns.status as Record<string, string>)[
                String(payrollRun?.status || '').toLowerCase()
              ] ||
                payrollRun?.status ||
                '-'}
            </Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              {t.noBankAccount}
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>
              {bankTransfer?.employees_without_bank_account ?? 0}
            </Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              {t.totalEmployees}
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>
              {bankTransfer?.total_employees ?? 0}
            </Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              {t.netSalary}
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>
              {bankTransfer?.total_net_salary?.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }) ?? '0.00'}
            </Text>
          </View>
        </View>

        {/* MAIN DATA TABLE */}
        <View style={{ ...pdfStyles.table, marginBottom: 10 }}>
          {/* TABLE HEADER */}
          <View style={pdfStyles.tableRow}>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 0.4,
              }}
            >
              {t.sn}
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1.2,
              }}
            >
              {t.empNo}
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 2,
              }}
            >
              {t.employeeName}
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1.5,
              }}
            >
              {t.bankName}
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1.5,
              }}
            >
              {t.branch}
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1.2,
              }}
            >
              {t.bankCode}
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1.5,
              }}
            >
              {t.accountNumber}
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 2,
              }}
            >
              {t.accountName}
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1.2,
                textAlign: 'right',
              }}
            >
              {t.netPay}
            </Text>
          </View>

          {/* TABLE BODY ROWS */}
          {rows.map((row, index) => {
            const rowBgColor = index % 2 === 0 ? '#FFFFFF' : lightColor;
            return (
              <View key={row.employee_id || index} style={pdfStyles.tableRow}>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: rowBgColor,
                    flex: 0.4,
                  }}
                >
                  {index + 1}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: rowBgColor,
                    flex: 1.2,
                  }}
                >
                  {row.employee_number || '-'}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: rowBgColor,
                    flex: 2,
                  }}
                >
                  {row.name || '-'}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: rowBgColor,
                    flex: 1.5,
                  }}
                >
                  {row.bank_name || '-'}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: rowBgColor,
                    flex: 1.5,
                  }}
                >
                  {row.branch || '-'}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: rowBgColor,
                    flex: 1.2,
                  }}
                >
                  {row.bank_code || '-'}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: rowBgColor,
                    flex: 1.5,
                  }}
                >
                  {row.account_number || '-'}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: rowBgColor,
                    flex: 2,
                  }}
                >
                  {row.account_name || '-'}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: rowBgColor,
                    flex: 1.2,
                    textAlign: 'right',
                  }}
                >
                  {(row.net_salary || 0).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
            );
          })}
        </View>

        {/* TOTAL SUMMARY ROW */}
        <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
          <Text style={{ flex: 8.1 }}></Text>
          <Text
            style={{
              ...pdfStyles.tableHeader,
              backgroundColor: mainColor,
              color: contrastText,
              flex: 1.5,
              textAlign: 'left',
            }}
          >
            {t.totalNetPay}
          </Text>
          <Text
            style={{
              ...pdfStyles.tableHeader,
              backgroundColor: mainColor,
              color: contrastText,
              flex: 1.2,
              textAlign: 'right',
            }}
          >
            {(bankTransfer?.total_net_salary || 0).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </View>

        {/* ZERO-PAY EMPLOYEES SECTION */}
        {zeroPayEmployees.length > 0 && (
          <View style={{ marginTop: 10, marginBottom: 20 }}>
            {/* Section Header */}
            <View style={{ ...pdfStyles.tableRow, marginBottom: 5 }}>
              <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>
                {t.zeroPayHeader}
              </Text>
            </View>

            <View style={pdfStyles.table}>
              {/* Header */}
              <View style={pdfStyles.tableRow}>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 0.5,
                  }}
                >
                  {t.sn}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 2,
                  }}
                >
                  {t.employeeNumber}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 5,
                  }}
                >
                  {t.employeeName}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 2,
                    textAlign: 'right',
                  }}
                >
                  {t.netPay}
                </Text>
              </View>

              {/* Rows */}
              {zeroPayEmployees.map((emp, idx) => {
                const rowBgColor = idx % 2 === 0 ? '#FFFFFF' : lightColor;
                return (
                  <View key={emp.employee_id || idx} style={pdfStyles.tableRow}>
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor: rowBgColor,
                        flex: 0.5,
                      }}
                    >
                      {idx + 1}
                    </Text>
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor: rowBgColor,
                        flex: 2,
                      }}
                    >
                      {emp.employee_number ?? '-'}
                    </Text>
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor: rowBgColor,
                        flex: 5,
                      }}
                    >
                      {emp.name || '-'}
                    </Text>
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor: rowBgColor,
                        flex: 2,
                        textAlign: 'right',
                      }}
                    >
                      0.00
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <PageFooter />
      </Page>
    </Document>
  );
}

export default BankTransferListDialogPDF;
