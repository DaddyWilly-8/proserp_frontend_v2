import PageFooter from '@/components/pdf/PageFooter';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import React from 'react';
import { Organization } from '@/types/auth-types';
import { BOMAlternative } from '../BomType';

// Define interfaces for TypeScript
interface MeasurementUnit {
  symbol: string;
}

interface Product {
  name: string;
}

interface Item {
  id: string;
  product: Product;
  quantity: number;
  measurement_unit: MeasurementUnit;
  alternatives?: BOMAlternative[];
}

interface Creator {
  name: string;
}

interface BOM {
  bomNo: string;
  product: Product;
  quantity: number;
  measurement_unit: MeasurementUnit;
  items?: Item[];
  creator: Creator;
}

interface BomPDFProps {
  bom: BOM;
  organization: Organization;
}

const BomPDF: React.FC<BomPDFProps> = ({ bom, organization }) => {
  const mainColor: string = organization.settings?.main_color || "#2113AD";
  const lightColor: string = organization.settings?.light_color || "#bec5da";
  const contrastText: string = organization.settings?.contrast_text || "#FFFFFF";

  return (
    <Document
      title="Bill Of Material"
      subject="Bill Of Material"
      creator="ProsERP"
      producer="ProsERP"
    >
      <Page size="A4" style={pdfStyles.page}>
        <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
          <View style={{ flex: 1, maxWidth: organization?.logo_path ? 130 : 250 }}>
            <PdfLogo organization={organization} />
          </View>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>Bill Of Material</Text>
            <Text style={{ ...pdfStyles.midInfo }}>{bom.bomNo}</Text>
          </View>
        </View>
        <View style={{ ...pdfStyles.tableRow, marginBottom: 10 }}>
          <View style={{ flex: 0.8, padding: 0.5 }}>
            <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>Output Product</Text>
            <Text style={{ ...pdfStyles.midInfo }}>{bom.product.name}</Text>
          </View>
          <View style={{ flex: 0.2, padding: 0.5 }}>
            <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>Quantity</Text>
            <Text style={{ ...pdfStyles.midInfo }}>
              {bom.quantity} {bom.measurement_unit.symbol}
            </Text>
          </View>
        </View>
        <View style={{ ...pdfStyles.table, minHeight: 150, marginBottom: 50 }}>
          <View style={pdfStyles.tableRow}>
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.05 }}>
              S/N
            </Text>
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.75 }}>
              Input Products
            </Text>
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.2 }}>
              Quantity
            </Text>
          </View>
          {bom?.items?.map((item: Item, index: number) => (
            <React.Fragment key={item.id}>
              <View style={pdfStyles.tableRow}>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 0.05,
                  }}
                >
                  {index + 1}
                </Text>
                <View
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 0.75,
                    flexDirection: 'column',
                  }}
                >
                  <Text>{item.product.name}</Text>
                </View>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 0.2,
                    textAlign: 'right',
                  }}
                >
                  {item.quantity?.toLocaleString()} {item.measurement_unit.symbol}
                </Text>
              </View>
              {item.alternatives && item.alternatives.length > 0 && (
                <React.Fragment>
                  <View style={pdfStyles.tableRow}>
                    <Text style={{ ...pdfStyles.tableCell, flex: 0.05 }}></Text>
                    <Text
                      style={{
                        ...pdfStyles.tableHeader,
                        backgroundColor: mainColor,
                        color: contrastText,
                        flex: 0.75,
                        textAlign: 'center',
                      }}
                    >
                      Alternative Input Products
                    </Text>
                    <Text
                      style={{
                        ...pdfStyles.tableHeader,
                        backgroundColor: mainColor,
                        color: contrastText,
                        flex: 0.2,
                      }}
                    >
                      Quantity
                    </Text>
                  </View>
                  {item.alternatives?.map((alternative: BOMAlternative, i: number) => (
                    <View key={i} style={{ ...pdfStyles.tableRow }}>
                      <Text style={{ ...pdfStyles.tableCell, flex: 0.05 }}></Text>
                      <View
                        style={{
                          ...pdfStyles.tableCell,
                          backgroundColor: i % 2 === 0 ? '#FFFFFF' : lightColor,
                          flex: 0.75,
                          flexDirection: 'column',
                        }}
                      >
                        <Text>{alternative.product?.name || 'N/A'}</Text>
                      </View>
                      <Text
                        style={{
                          ...pdfStyles.tableCell,
                          backgroundColor: i % 2 === 0 ? '#FFFFFF' : lightColor,
                          flex: 0.2,
                          textAlign: 'right',
                        }}
                      >
                        {alternative.quantity?.toLocaleString()} {item.measurement_unit.symbol}
                      </Text>
                    </View>
                  ))}
                  <View style={{ ...pdfStyles.tableRow, marginBottom: 10 }}>
                    <Text style={{ flex: 1 }}></Text>
                  </View>
                </React.Fragment>
              )}
            </React.Fragment>
          ))}
        </View>
        <View style={{ ...pdfStyles.tableRow, marginBottom: 10 }}>
          <View style={{ flex: 1, padding: 0.5 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Created By</Text>
            <Text style={{ ...pdfStyles.minInfo }}>{bom.creator.name}</Text>
          </View>
        </View>
        <PageFooter />
      </Page>
    </Document>
  );
};

export default BomPDF;