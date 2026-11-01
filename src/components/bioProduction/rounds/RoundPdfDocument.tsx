import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import PageNumber from '@/components/pdf/PageNumber';
import { RoundRecord } from './roundTypes';
import { recordFacts, recordTable } from './roundExport';

const RoundPdfDocument = ({
  record,
  text,
  inputTypes,
  authOrganization,
  user,
  total,
}: {
  record: RoundRecord;
  text: any;
  inputTypes: Record<string, string>;
  authOrganization: any;
  user?: { name?: string };
  total: string;
}) => {
  const mainColor = authOrganization?.organization?.settings?.main_color || '#1C2B3A';
  const contrastText = authOrganization?.organization?.settings?.contrast_text || '#FFFFFF';
  const lightColor = authOrganization?.organization?.settings?.light_color || '#bec5da';
  const { head, rows, numeric } = recordTable(record, text);
  const flex = head.length > 5 ? [1.5, 1.2, 1, 0.9, 0.9, 1.1] : [1.6, 1.4, 1.2, 1, 1];

  return (
    <Document creator={`${user?.name} | Powered By ProsERP`} producer='ProsERP' title={record.recordNo}>
      <Page size='A4' style={pdfStyles.page}>
        <View style={{ ...pdfStyles.tableRow, marginBottom: 16 }}>
          <View style={{ flex: 1, maxWidth: 120 }}>
            <PdfLogo organization={authOrganization?.organization} />
          </View>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>{record.recordNo}</Text>
            <Text style={pdfStyles.minInfo}>{text.messages.printedBy}: {user?.name}</Text>
            <Text style={pdfStyles.minInfo}>{text.messages.printedOn}: {new Date().toLocaleString()}</Text>
          </View>
        </View>

        <View style={{ marginBottom: 12 }}>
          {recordFacts(record, text, inputTypes).map(([label, value]) => (
            <View key={label} style={pdfStyles.tableRow}>
              <Text style={{ ...pdfStyles.midInfo, width: 110, fontWeight: 'bold' }}>{label}</Text>
              <Text style={{ ...pdfStyles.midInfo, flex: 1 }}>{value}</Text>
            </View>
          ))}
        </View>

        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            {head.map((title, i) => (
              <Text key={i} style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: flex[i], textAlign: numeric[i] ? 'right' : 'left' }}>
                {title}
              </Text>
            ))}
          </View>
          {rows.map((cells, r) => (
            <View key={r} style={{ ...pdfStyles.tableRow, backgroundColor: r % 2 === 0 ? '#FFFFFF' : lightColor }} wrap={false}>
              {cells.map((cell, i) => (
                <Text key={i} style={{ ...pdfStyles.tableCell, flex: flex[i], textAlign: numeric[i] ? 'right' : 'left' }}>{cell}</Text>
              ))}
            </View>
          ))}
        </View>

        <Text style={{ ...pdfStyles.midInfo, marginTop: 10, textAlign: 'right', fontWeight: 'bold' }}>{total}</Text>
        <PageNumber />
      </Page>
    </Document>
  );
};

export default RoundPdfDocument;
