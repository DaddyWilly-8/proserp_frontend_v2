import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import PageFooter from '@/components/pdf/PageFooter';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Document, Page, Text, View } from '@react-pdf/renderer'
import React from 'react'

function CertificatePDF({certificate, organization}) {
  const mainColor = organization.settings?.main_color || "#2113AD";
  const lightColor = organization.settings?.light_color || "#bec5da";
  const contrastText = organization.settings?.contrast_text || "#FFFFFF";

  const grossItem = {
    id: 'gross',
    particular: 'Gross Amount Certified',
    amount: certificate.amount
  };

  const adjustmentItems = (certificate.adjustments || []).map(adj => ({
    id: adj.id,
    particular: adj.description + (adj.type === 'deduction' ? ' (Deduction)' : ' (Addition)'),
    amount: adj.type === 'deduction' ? -adj.amount : adj.amount,
  }));

  const summaryItems = [grossItem, ...adjustmentItems];

  const grandTotal = summaryItems.reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <Document 
        title={`${certificate.certificateNo}`}
        author={`${certificate.creator?.name}`}
        subject='Certificate'
        creator='ProsERP'
        producer='ProsERP'
    >
      <Page size="A4" style={pdfStyles.page}>
        <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
          <View style={{ flex: 1, maxWidth: (organization?.logo_path ? 130 : 250)}}>
            <PdfLogo organization={organization}/>
          </View>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={{...pdfStyles.majorInfo, color: mainColor }}>Certificate</Text>
            <Text style={{ ...pdfStyles.minInfo, }}>{certificate?.certificateNo}</Text>
          </View>
        </View>
        <View style={{ ...pdfStyles.tableRow,marginBottom: 10}}>
          <View style={{ flex: 0.5, padding: 2 }}>
            <Text style={{...pdfStyles.minInfo, color: mainColor }}>Certificate Date</Text>
            <Text style={{...pdfStyles.minInfo }}>{readableDate(certificate.certificate_date, false)}</Text>
          </View>
          <View style={{ flex: 0.5, padding: 2 }}>
            {certificate.reference && <Text style={{...pdfStyles.minInfo, color: mainColor }}>Remarks</Text>}
            {certificate.reference && <Text style={{...pdfStyles.minInfo }}>{certificate.remarks}</Text>}
          </View>
        </View>
        <View style={{ ...pdfStyles.table, minHeight: 200 }}>
          <View style={pdfStyles.tableRow}>
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.3 }}>S/N</Text>
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 3 }}>Particulars</Text>
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.8 }}>Amount</Text>
          </View>

            {summaryItems.map((item, index) => (
              <View key={item.id} style={pdfStyles.tableRow}>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFF' : lightColor, flex: 0.32 }}>
                  {index + 1}
                </Text>

                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFF' : lightColor, flex: 2.9 }}>
                  {item.particular}
                </Text>

                <Text style={{ 
                  ...pdfStyles.tableCell, 
                  backgroundColor: index % 2 === 0 ? '#FFF' : lightColor, 
                  flex: 0.8, 
                  textAlign: 'right' 
                }}>
                  {item.amount.toLocaleString()}
                </Text>
              </View>
            ))}

            <View style={{ ...pdfStyles.tableRow, marginTop: 6 }}>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 3.25 }}>
                Grand Total
              </Text>
              <Text style={{ 
                ...pdfStyles.tableHeader, 
                backgroundColor: mainColor, 
                color: contrastText,
                textAlign: 'right',
                flex: 0.77
              }}>
                {grandTotal.toLocaleString()}
              </Text>
            </View>
        </View>

        <View style={{ ...pdfStyles.tableRow,marginTop: 20}}>
          <View style={{ flex: 0.2, padding: 2 }}>
            <Text style={{...pdfStyles.minInfo, color: mainColor, paddingBottom: 10, paddingLeft: 3 }}>Signature</Text>
            <Text style={{...pdfStyles.minInfo, textDecoration: 'underline', paddingLeft: 3}}>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </Text>
          </View>
        </View>
        <PageFooter/>
      </Page>
    </Document>
  )
}

export default CertificatePDF