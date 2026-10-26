import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import PdfLogo from '@/components/pdf/PdfLogo';
import pdfStyles from '@/components/pdf/pdf-styles';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { LoanRequestType } from './LoanRequestType';

interface LoanRequestPDFProps {
  data: LoanRequestType;
  organization: any;
  userName: string;
  // react-pdf renders outside the React tree, so context isn't available —
  // the caller passes the dictionary down.
  dictionary: any;
  // My HR's list response doesn't eager-load `employee` (it's always the
  // caller's own record) — the caller supplies the name directly in that
  // case; HR's `details.employee` is used otherwise. Mirrors LeaveRequestPDF.
  employeeName?: string;
}

const formatCurrency = (value?: number | null) =>
  value != null ? Number(value).toLocaleString() : '—';

export default function LoanRequestPDF({
  data,
  organization,
  userName,
  dictionary,
  employeeName,
}: LoanRequestPDFProps) {
  const mainColor = organization?.settings?.main_color || '#2113AD';
  const lightColor = organization?.settings?.light_color || '#bec5da';
  const contrastText = organization?.settings?.contrast_text || '#FFFFFF';

  const resolvedEmployeeName =
    employeeName ||
    `${data.employee?.first_name ?? ''} ${data.employee?.middle_name ?? ''} ${data.employee?.last_name ?? ''}`.trim() ||
    dictionary.humanResources.loanRequests.common.employeeFallback.replace(
      '{id}',
      String(data.employee_id)
    );
  const t = dictionary.humanResources.loanRequests.pdf;
  const formatMonths = (count: number | string) =>
    t.months.replace('{count}', String(count));

  const approvals = data.approvals || [];
  const hasDecision =
    data.amount_approved != null || data.installments_approved != null;

  // One signature line per level in the approval chain (e.g. Technical
  // Manager, then General Manager, then HR Officer) rather than a single
  // generic "Approver Signature" — same convention as LeaveRequestPDF/Requisitions.
  const levels = [...(data.approval_chain?.levels || [])].sort(
    (a: any, b: any) => Number(a.position_index ?? 0) - Number(b.position_index ?? 0)
  );
  const signatories = levels.length > 0
    ? levels.map((level: any) =>
        t.roleSignature.replace(
          '{role}',
          level.role?.name || level.label || t.approver
        )
      )
    : [t.approverSignature];

  const headerCellStyle = {
    ...pdfStyles.tableHeader,
    backgroundColor: mainColor,
    color: contrastText,
    flex: 1,
  };

  return (
    <Document
      title={t.applicationTitle.replace('{name}', resolvedEmployeeName)}
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
              {t.applicationForm}
            </Text>
          </View>
        </View>

        <View style={{ ...pdfStyles.tableRow, marginBottom: 14 }}>
          <View style={{ flex: 1.5 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>{t.employee}</Text>
            <Text style={pdfStyles.minInfo}>
              {data.employee?.employee_number ? `${data.employee.employee_number} — ` : ''}
              {resolvedEmployeeName}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>{t.department}</Text>
            <Text style={pdfStyles.minInfo}>{data.department?.name || '—'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>{t.status}</Text>
            <Text style={pdfStyles.minInfo}>{data.status_label || data.status}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>{t.printedOn}</Text>
            <Text style={pdfStyles.minInfo}>{readableDate(undefined, true)}</Text>
          </View>
        </View>

        <View style={{ ...pdfStyles.tableRow, marginBottom: 14 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>{t.amountRequested}</Text>
            <Text style={pdfStyles.minInfo}>{formatCurrency(data.amount)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>{t.installmentsRequested}</Text>
            <Text style={pdfStyles.minInfo}>{formatMonths(data.installments)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>{t.requestedOn}</Text>
            <Text style={pdfStyles.minInfo}>{readableDate(data.requested_at)}</Text>
          </View>
        </View>

        {hasDecision && (
          <View style={{ ...pdfStyles.tableRow, marginBottom: 16 }}>
            {[
              { label: t.amountApproved, value: formatCurrency(data.amount_approved) },
              {
                label: t.installmentsApproved,
                value: data.installments_approved != null ? formatMonths(data.installments_approved) : '—',
              },
              { label: t.installmentAmount, value: formatCurrency(data.installment_amount) },
            ].map((tile) => (
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
                <Text style={{ fontSize: 8, color: '#666666' }}>{tile.label}</Text>
                <Text style={{ fontSize: 11, fontWeight: 'bold', marginTop: 2 }}>
                  {tile.value}
                </Text>
              </View>
            ))}
          </View>
        )}

        {data.reason && (
          <View style={{ marginBottom: 14 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>{t.reason}</Text>
            <Text style={pdfStyles.minInfo}>{data.reason}</Text>
          </View>
        )}

        <View style={{ ...pdfStyles.tableRow, marginBottom: 6 }}>
          <Text style={{ fontSize: 12, fontWeight: 'bold' }}>{t.approvalHistory}</Text>
        </View>
        {approvals.length === 0 ? (
          <Text style={{ fontSize: 9, color: '#666666', marginBottom: 20 }}>
            {t.noApprovalAction}
          </Text>
        ) : (
          <View style={{ ...pdfStyles.table, marginBottom: 20 }}>
            <View style={pdfStyles.tableRow}>
              <Text style={headerCellStyle}>{t.date}</Text>
              <Text style={headerCellStyle}>{t.by}</Text>
              <Text style={headerCellStyle}>{t.status}</Text>
              <Text style={{ ...headerCellStyle, flex: 2 }}>{t.remarks}</Text>
            </View>
            {approvals.map((approval, index) => (
              <View key={approval.id || index} style={pdfStyles.tableRow}>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 1,
                  }}
                >
                  {approval.approval_date ? readableDate(approval.approval_date) : '—'}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 1,
                  }}
                >
                  {approval.creator?.name || '—'}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 1,
                  }}
                >
                  {approval.status_label || approval.status || '—'}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 2,
                  }}
                >
                  {approval.remarks || '—'}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginTop: 30,
          }}
        >
          <View style={{ width: '48%', marginRight: '4%', marginBottom: 24 }}>
            <View style={{ height: 28 }} />
            <View style={{ ...pdfStyles.blackLine, marginBottom: 4 }} />
            <Text style={pdfStyles.minInfo}>{t.employeeSignature}</Text>
            <Text style={{ ...pdfStyles.minInfo, marginTop: 16 }}>{t.dateLine}</Text>
          </View>
          {signatories.map((label, index) => (
            <View key={index} style={{ width: '48%', marginRight: '4%', marginBottom: 24 }}>
              <View style={{ height: 28 }} />
              <View style={{ ...pdfStyles.blackLine, marginBottom: 4 }} />
              <Text style={pdfStyles.minInfo}>{label}</Text>
              <Text style={{ ...pdfStyles.minInfo, marginTop: 16 }}>{t.dateLine}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
