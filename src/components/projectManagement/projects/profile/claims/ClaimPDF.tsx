// ClaimPDF.tsx
import React from 'react';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import PageFooter from '@/components/pdf/PageFooter';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { MeasurementUnit } from '@/components/masters/measurementUnits/MeasurementUnitType';
import { Currency } from '@/components/masters/Currencies/CurrencyType';
import { Organization } from '@/types/auth-types';
interface RevenueLedger {
  name?: string;
}

interface ProjectDeliverable {
  description?: string;
  quantity?: number;
  contract_rate?: number;
  measurement_unit?: MeasurementUnit;
}

interface ClaimItem {
  project_deliverable?: ProjectDeliverable;
  revenue_ledger?: RevenueLedger;
  remarks?: string | null;
}

interface ComplementLedger {
  name?: string;
}

interface Adjustment {
  description: string;
  type: 'addition' | 'deduction';
  amount: number | string;
  complement_ledger?: ComplementLedger;
}

interface Creator {
  name?: string;
}

interface Claim {
  claimNo: string;
  claim_date: string;
  remarks?: string | null;
  currency?: Currency;
  creator?: Creator;
  claim_items: ClaimItem[];
  adjustments?: Adjustment[];
}

const ClaimPDF: React.FC<{ claim: Claim; organization: Organization }> = ({
  claim,
  organization,
}) => {
  const mainColor = organization.settings?.main_color || '#2113AD';
  const lightColor = organization.settings?.light_color || '#bec5da';
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';
  const currencyCode = claim.currency?.code || 'TZS';

  const vatPercentage = claim.vat_percentage || 0;
  const grossAmount = Number(claim.amount) || 0;
  const vatAmount = (grossAmount * vatPercentage) / 100;

  const grossItem = {
    id: 'gross',
    particular: 'Gross Amount Certified',
    amount: grossAmount,
  };

  const vatItem = vatPercentage
    ? {
        id: 'vat',
        particular: `VAT (${vatPercentage}%)`,
        amount: vatAmount,
      }
    : null;

  const adjustmentItems = (claim.adjustments || []).map((adj) => ({
    id: adj.id,
    particular: adj.description,
    complement_ledger: adj.complement_ledger,
    type: adj.type,
    amount: adj.type === 'deduction' ? -adj.amount :  adj.amount
  }));

  const summaryItems = [
    grossItem,
    ...(vatItem ? [vatItem] : []),
    ...adjustmentItems,
  ];

  const grandTotal = summaryItems.reduce((sum, item) => sum + Number(item.amount),0);

  const claimedItems = claim.claim_items.map((it) => {
    const previousQty = it.previous_certified_quantity || 0;
    const presentQty = it.certified_quantity || 0;
    const cumulativeQty = previousQty + presentQty;
    const rate = it.project_deliverable.contract_rate || 0;

    return {
      id: `T${it?.id}`,
      description: it.project_deliverable?.description || '',
      unit: it.measurement_unit?.symbol,
      certifiedQty: it.certified_quantity,
      unitRate: rate,
      ledger: it.revenue_ledger?.name || '',
      contractAmount: presentQty * rate,
      previousQty,
      presentQty,
      cumulativeQty,
      remarks: it.remarks || '',
      previousAmount: previousQty * rate,
      presentAmount: presentQty * rate,
      cumulativeAmount: cumulativeQty * rate,
      revenue_ledger: it.revenue_ledger
    };
  });

  return (
    <Document title={claim.claimNo} author={claim.creator?.name}>
      <Page size="A3" orientation="portrait" style={pdfStyles.page}>
        <View style={{ ...pdfStyles.tableRow, marginBottom: 20, justifyContent: 'space-between' }}>
          <View style={{ maxWidth: organization?.logo_path ? 130 : 250 }}>
            <PdfLogo organization={organization} />
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>Payment Claim</Text>
            <Text style={pdfStyles.minInfo}>{claim.claimNo}</Text>
            <Text style={pdfStyles.minInfo}>{claim.project.name}</Text>
          </View>
        </View>

        <View style={{ ...pdfStyles.tableRow, marginBottom: 20, gap: 20 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Claim Date</Text>
            <Text style={pdfStyles.minInfo}>{readableDate(claim.claim_date, false)}</Text>
          </View>
          {claim.remarks && (
            <View style={{ flex: 1 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Remarks</Text>
              <Text style={pdfStyles.minInfo}>{claim.remarks}</Text>
            </View>
          )}
        </View>

        {/* ================= SUMMARY ================= */}
        <View style={{ marginBottom: 30, alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 12, color: mainColor, marginBottom: 8 }}>
            Summary
          </Text>

          <View style={{ width: '50%', minWidth: 380 }}>
            <View style={pdfStyles.table}>
              <View style={pdfStyles.tableRow}>
                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.4 }}>S/N</Text>
                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2.6 }}>Particulars</Text>
                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1, textAlign: 'right' }}>
                  Amount ({currencyCode})
                </Text>
              </View>

              {summaryItems.map((item, index) => (
                <View key={item.id} style={pdfStyles.tableRow}>
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 ? lightColor : '#FFF', flex: 0.4 }}>
                    {index + 1}.
                  </Text>

                <View
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 2.6,
                    flexDirection: 'column',
                  }}
                >
                  <Text style={{ fontSize: 8 }}>
                    {item.particular}
                  </Text>

                  {item.complement_ledger?.name && (
                    <Text style={{ fontSize: 6.5, color: '#555' }}>
                      ({item.complement_ledger.name})
                    </Text>
                  )}
                </View>

                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: index % 2 ? lightColor : '#FFF',
                      flex: 1,
                      textAlign: 'right',
                      fontSize: 7.5,
                      color: item.type === 'deduction' ? '#B00020' : '#000',
                    }}
                  >
                    {Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              ))}

              <View style={{ ...pdfStyles.tableRow, marginTop: 6 }}>
                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 3.2, textAlign: 'center' }}>
                  Grand Total ({currencyCode})
                </Text>
                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1, textAlign: 'right' }}>
                  {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ marginBottom: 40 }}>
          <Text style={{ fontSize: 12, color: mainColor, textAlign: 'center', marginBottom: 10 }}>
            Claim Derivations
          </Text>

          {(() => {
            const totals = claimedItems.reduce(
              (acc, item) => ({
                contractAmount: acc.contractAmount + Number(item.contractAmount || 0),
                previousAmount: acc.previousAmount + Number(item.previousAmount || 0),
                presentAmount: acc.presentAmount + Number(item.presentAmount || 0),
                cumulativeAmount: acc.cumulativeAmount + Number(item.cumulativeAmount || 0),
              }),
              { contractAmount: 0, previousAmount: 0, presentAmount: 0, cumulativeAmount: 0 }
            );

            return (
              <View style={pdfStyles.table}>
                <View style={pdfStyles.tableRow}>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 4.32 }}></Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.97, textAlign: 'center' }}>Price Schedule</Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 3.6, textAlign: 'center' }}>Quantity</Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 3.6, textAlign: 'center' }}>Amount ({currencyCode})</Text>
                </View>

                <View style={pdfStyles.tableRow}>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.5 }}>S/N</Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2 }}>Description</Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.7 }}>Unit</Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1 }}>Qty</Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1 }}>Unit Rate ({currencyCode})</Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1 }}>Amount ({currencyCode})</Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.2 }}>Previous</Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.2 }}>Present</Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.2 }}>Cumulative</Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.2 }}>Previous</Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.2 }}>Present</Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.2 }}>Cumulative</Text>
                </View>

                {claimedItems.map((item, index) => (
                  <View key={item.id} style={pdfStyles.tableRow}>
                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFF' : lightColor, flex: 0.5 }}>{index + 1}.</Text>
                    <View style={{...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 2, flexDirection: 'column'}}
                    >
                      <Text style={{ fontSize: 8 }}>
                        {item.description}
                      </Text>

                      {item.revenue_ledger && (
                        <Text style={{ fontSize: 6.5 }}>
                          ({item.revenue_ledger.name})
                        </Text>
                      )}

                      {item.remarks && (
                        <Text style={{ fontSize: 6.5, color: '#555' }}>
                          ({item.remarks})
                        </Text>
                      )}
                    </View>
                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFF' : lightColor, flex: 0.7, textAlign: 'center' }}>{item.unit}</Text>
                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFF' : lightColor, flex: 1, textAlign: 'right' }}>{item.certifiedQty}</Text>
                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFF' : lightColor, flex: 1, textAlign: 'right', fontSize: 7.5 }}>{item.unitRate.toLocaleString()}</Text>
                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFF' : lightColor, flex: 1, textAlign: 'right', fontSize: 7.5 }}>{item.contractAmount?.toLocaleString()}</Text>
                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFF' : lightColor, flex: 1.2, textAlign: 'right' }}>{item.previousQty}</Text>
                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFF' : lightColor, flex: 1.2, textAlign: 'right' }}>{item.presentQty}</Text>
                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFF' : lightColor, flex: 1.2, textAlign: 'right' }}>{item.cumulativeQty}</Text>
                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFF' : lightColor, flex: 1.2, textAlign: 'right', fontSize: 7.5 }}>{item.previousAmount?.toLocaleString()}</Text>
                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFF' : lightColor, flex: 1.2, textAlign: 'right', fontSize: 7.5 }}>{item.presentAmount?.toLocaleString()}</Text>
                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFF' : lightColor, flex: 1.2, textAlign: 'right', fontSize: 7.5 }}>{item.cumulativeAmount?.toLocaleString()}</Text>
                  </View>
                ))}

                {/* GRAND TOTAL - STILL BOLD & VISIBLE */}
                <View style={{ ...pdfStyles.tableRow, marginTop: 12 }}>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 5.9, textAlign: 'right', fontSize: 7 }}>
                    GRAND TOTAL {currencyCode}
                  </Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1, textAlign: 'right', fontSize: 7 }}>
                    {totals.contractAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 3.9 }}></Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.2, textAlign: 'right', fontSize: 7 }}>
                    {totals.previousAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.2, textAlign: 'right', fontSize: 7 }}>
                    {totals.presentAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.2, textAlign: 'right', fontSize: 7 }}>
                    {totals.cumulativeAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>
            );
          })()}
        </View>

        {/* Signature */}
        <View style={{ marginTop: 40, flexDirection: 'row', justifyContent: 'flex-end' }}>
          <View style={{ maxWidth: 300 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor, marginBottom: 2 }}>
              Prepared By:
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>
              {claim.creator?.name || ''}
            </Text>
          </View>
        </View>

        <PageFooter />
      </Page>
    </Document>
  );
};

export default ClaimPDF;