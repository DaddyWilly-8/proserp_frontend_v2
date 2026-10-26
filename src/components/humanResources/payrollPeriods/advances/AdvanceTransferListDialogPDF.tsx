import PageFooter from '@/components/pdf/PageFooter';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Organization } from '@/types/auth-types';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { AdvanceSheetType } from './AdvanceSheetType';

interface AdvanceTransferListDialogPDFProps {
  organization: Organization;
  advanceSheet: AdvanceSheetType;
  dictionary: any;
}

const monthNames = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];

function AdvanceTransferListDialogPDF({
  organization,
  advanceSheet,
  dictionary,
}: AdvanceTransferListDialogPDFProps) {
  const t = dictionary.humanResources.payrollPeriods;
  const mainColor = organization.settings?.main_color || '#2113AD';
  const lightColor = organization.settings?.light_color || '#bec5da';
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';

  const monthNo = advanceSheet?.period?.month;
  const year = advanceSheet?.period?.year;
  const monthName = monthNo ? t.common.months[monthNames[monthNo - 1]] : '';
  const payrollPeriod = monthName ? `${year} - ${monthName}` : '-';

  const rows = advanceSheet?.rows || [];

  return (
    <Document
      title={`${t.advances.transfer.docTitle} - ${payrollPeriod}`}
      subject={t.advances.transfer.title}
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
              {t.advances.transfer.title}
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>{payrollPeriod}</Text>
          </View>
        </View>

        {/* METADATA / FILTERS GRID */}
        <View style={{ ...pdfStyles.tableRow, marginBottom: 15 }}>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              {t.advances.transfer.payrollPeriod}
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>{payrollPeriod}</Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              {t.advances.transfer.noBankAccount}
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>
              {advanceSheet?.employees_without_bank_account ?? 0}
            </Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              {t.advances.transfer.totalEmployees}
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>
              {advanceSheet?.total_employees ?? 0}
            </Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              {t.advances.transfer.totalAmount}
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>
              {advanceSheet?.total_amount?.toLocaleString('en-US', {
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
              {t.advances.transfer.columns.sn}
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1.2,
              }}
            >
              {t.advances.transfer.columns.empNo}
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 2,
              }}
            >
              {t.advances.transfer.columns.employeeName}
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1.5,
              }}
            >
              {t.advances.transfer.columns.bankName}
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1.5,
              }}
            >
              {t.advances.transfer.columns.branch}
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1.2,
              }}
            >
              {t.advances.transfer.columns.bankCode}
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1.5,
              }}
            >
              {t.advances.transfer.columns.accountNumber}
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 2,
              }}
            >
              {t.advances.transfer.columns.accountName}
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
              {t.advances.transfer.columns.advanceAmount}
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1,
                textAlign: 'center',
              }}
            >
              {t.advances.transfer.columns.status}
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
                  {(row.amount || 0).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: rowBgColor,
                    flex: 1,
                    textAlign: 'center',
                  }}
                >
                  {row.paid ? t.common.paid : t.common.unpaid}
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
            {t.advances.transfer.totalAmount}
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
            {(advanceSheet?.total_amount || 0).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </View>

        <PageFooter />
      </Page>
    </Document>
  );
}

export default AdvanceTransferListDialogPDF;
