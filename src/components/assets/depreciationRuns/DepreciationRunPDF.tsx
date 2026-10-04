'use client';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import PageFooter from '@/components/pdf/PageFooter';
import PageNumber from '@/components/pdf/PageNumber';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import dayjs from 'dayjs';

const fmt = (amount: number) =>
  (amount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface DepreciationRunPDFProps {
  run: any;
  authOrganization: any;
  user: any;
}

const DepreciationRunPDF: React.FC<DepreciationRunPDFProps> = ({ run, authOrganization, user }) => {
  const organization = authOrganization?.organization;
  const mainColor = organization?.settings?.main_color || '#2113AD';
  const contrastText = organization?.settings?.contrast_text || 'black';
  const lightColor = organization?.settings?.light_color || '#bec5da';

  const periodLabel = dayjs(run.period_start).format('MMMM YYYY');
  const totalCharge = (run.entries ?? []).reduce((sum: number, e: any) => sum + (e.depreciation_amount ?? 0), 0);

  const entryColWidths = ['8%', '26%', '16%', '14%', '12%', '12%', '12%'];
  const journalColWidths = ['25%', '27%', '27%', '21%'];

  return run ? (
    <Document
      creator={`${user?.name} | Powered By ProsERP`}
      producer="ProsERP"
      title={`Depreciation Run ${periodLabel}`}
    >
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.table}>
          <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
            <View style={{ flex: 1, maxWidth: organization?.logo_path ? 130 : 250 }}>
              <PdfLogo organization={organization} />
            </View>
            <View style={{ flex: 1, textAlign: 'right' }}>
              <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>Depreciation Run</Text>
              <Text style={{ ...pdfStyles.minInfo }}>{periodLabel}</Text>
            </View>
          </View>
        </View>

        <View style={{ ...pdfStyles.tableRow, marginTop: 10, marginBottom: 10 }}>
          <View style={{ flex: 2, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Narration</Text>
            <Text style={{ ...pdfStyles.minInfo }}>{run.narration || '-'}</Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Printed By</Text>
            <Text style={{ ...pdfStyles.minInfo }}>{user?.name}</Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Printed On</Text>
            <Text style={{ ...pdfStyles.minInfo }}>{readableDate(undefined, true)}</Text>
          </View>
        </View>

        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            {['Code', 'Asset', 'Category', 'Cost Center', 'Charge', 'Accum. After', 'NBV After'].map((label, i) => (
              <View key={label} style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, width: entryColWidths[i] }}>
                <Text style={{ ...pdfStyles.tableCell, color: contrastText }}>{label}</Text>
              </View>
            ))}
          </View>
          {(run.entries ?? []).map((entry: any, index: number) => (
            <View key={entry.id} style={pdfStyles.tableRow}>
              <View style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 !== 0 ? lightColor : '#FFFFFF', width: entryColWidths[0] }}>
                <Text>{entry.asset_detail?.code}</Text>
              </View>
              <View style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 !== 0 ? lightColor : '#FFFFFF', width: entryColWidths[1] }}>
                <Text>{entry.asset_detail?.product_item?.product?.name}</Text>
              </View>
              <View style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 !== 0 ? lightColor : '#FFFFFF', width: entryColWidths[2] }}>
                <Text>{entry.asset_detail?.product_item?.product?.category?.name}</Text>
              </View>
              <View style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 !== 0 ? lightColor : '#FFFFFF', width: entryColWidths[3] }}>
                <Text>{entry.asset_detail?.cost_center?.name || '-'}</Text>
              </View>
              <View style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 !== 0 ? lightColor : '#FFFFFF', width: entryColWidths[4], textAlign: 'right' }}>
                <Text>{fmt(entry.depreciation_amount)}</Text>
              </View>
              <View style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 !== 0 ? lightColor : '#FFFFFF', width: entryColWidths[5], textAlign: 'right' }}>
                <Text>{fmt(entry.accumulated_depreciation_after)}</Text>
              </View>
              <View style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 !== 0 ? lightColor : '#FFFFFF', width: entryColWidths[6], textAlign: 'right' }}>
                <Text>{fmt(entry.net_book_value_after)}</Text>
              </View>
            </View>
          ))}
          <View style={pdfStyles.tableRow}>
            <View style={{ ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, fontWeight: 'bold', width: '76%' }}>
              <Text style={{ ...pdfStyles.tableCell }}>Total</Text>
            </View>
            <View style={{ ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, fontWeight: 'bold', width: entryColWidths[4], textAlign: 'right' }}>
              <Text style={{ ...pdfStyles.tableCell }}>{fmt(totalCharge)}</Text>
            </View>
            <View style={{ ...pdfStyles.tableCell, backgroundColor: mainColor, width: entryColWidths[5] }}><Text> </Text></View>
            <View style={{ ...pdfStyles.tableCell, backgroundColor: mainColor, width: entryColWidths[6] }}><Text> </Text></View>
          </View>
        </View>

        <View style={{ marginTop: 16 }}>
          <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>Journals Posted</Text>
        </View>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            {['Cost Center', 'Debit', 'Credit', 'Amount'].map((label, i) => (
              <View key={label} style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, width: journalColWidths[i] }}>
                <Text style={{ ...pdfStyles.tableCell, color: contrastText }}>{label}</Text>
              </View>
            ))}
          </View>
          {(run.journals ?? []).map((journal: any, index: number) => (
            <View key={journal.id} style={pdfStyles.tableRow}>
              <View style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 !== 0 ? lightColor : '#FFFFFF', width: journalColWidths[0] }}>
                <Text>{journal.cost_centers?.length > 0 ? journal.cost_centers.map((cc: any) => cc.name).join(', ') : '-'}</Text>
              </View>
              <View style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 !== 0 ? lightColor : '#FFFFFF', width: journalColWidths[1] }}>
                <Text>{journal.debit_ledger?.name}</Text>
              </View>
              <View style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 !== 0 ? lightColor : '#FFFFFF', width: journalColWidths[2] }}>
                <Text>{journal.credit_ledger?.name}</Text>
              </View>
              <View style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 !== 0 ? lightColor : '#FFFFFF', width: journalColWidths[3], textAlign: 'right' }}>
                <Text>{fmt(journal.amount)}</Text>
              </View>
            </View>
          ))}
        </View>

        <PageFooter />
        <PageNumber />
      </Page>
    </Document>
  ) : null;
};

export default DepreciationRunPDF;
