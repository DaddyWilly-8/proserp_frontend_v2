import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import pdfStyles from '../../pdf/pdf-styles';
import PdfLogo from '../../pdf/PdfLogo';
import PageNumber from '../../pdf/PageNumber';

type ApprovalChainLevel = { id: number; position_index: number; label?: string; role?: { id: number; name: string } };
type ApprovalChain = {
  id: number;
  process_type: string;
  status: string;
  cost_center?: { name: string };
  department?: { name: string };
  levels: ApprovalChainLevel[];
};

const ApprovalChainsPdfDocument = ({
  chains,
  authOrganization,
  user,
}: {
  chains: ApprovalChain[];
  authOrganization: any;
  user?: { name?: string };
}) => {
  const mainColor = authOrganization?.organization?.settings?.main_color || '#1C2B3A';
  const contrastText = authOrganization?.organization?.settings?.contrast_text || '#FFFFFF';
  const printedOn = new Date().toLocaleString();

  return (
    <Document creator={`${user?.name} | Powered By ProsERP`} producer='ProsERP' title='Approval Chains'>
      <Page size='A4' style={pdfStyles.page}>
        <View style={{ ...pdfStyles.tableRow, marginBottom: 16 }}>
          <View style={{ flex: 1, maxWidth: 120 }}>
            <PdfLogo organization={authOrganization?.organization} />
          </View>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>Approval Chains</Text>
            <Text style={pdfStyles.minInfo}>Printed By: {user?.name}</Text>
            <Text style={pdfStyles.minInfo}>Printed On: {printedOn}</Text>
          </View>
        </View>

        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2.2 }}>
              Process / Level
            </Text>
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.8 }}>
              Approver Role
            </Text>
          </View>

          {chains.map((chain) => {
            const scope = chain.cost_center?.name || chain.department?.name || 'All';

            return (
              <React.Fragment key={chain.id}>
                <View style={{ backgroundColor: '#EDE9E2', padding: 4, borderTopWidth: 1.5, borderTopColor: '#A9824C' }}>
                  <Text style={{ ...pdfStyles.minInfo, fontWeight: 'bold', color: mainColor }}>
                    {chain.process_type}{'  ·  '}
                    <Text style={{ fontWeight: 'normal', color: '#6B7280' }}>
                      {chain.status} · Scope: {scope}
                    </Text>
                  </Text>
                </View>

                {chain.levels?.length ? (
                  [...chain.levels]
                    .sort((a, b) => a.position_index - b.position_index)
                    .map((level, i) => (
                      <View key={level.id} style={{ ...pdfStyles.tableRow, backgroundColor: i % 2 === 1 ? '#FAF9F6' : '#FFFFFF' }}>
                        <Text style={{ ...pdfStyles.tableCell, flex: 2.2 }}>
                          Level {level.position_index}{level.label ? ` — ${level.label}` : ''}
                        </Text>
                        <Text style={{ ...pdfStyles.tableCell, flex: 1.8 }}>
                          {level.role?.name || '(role deleted)'}
                        </Text>
                      </View>
                    ))
                ) : (
                  <View style={pdfStyles.tableRow}>
                    <Text style={{ ...pdfStyles.tableCell, flex: 4, color: '#9AA5B1', fontStyle: 'italic' }}>
                      No levels configured
                    </Text>
                  </View>
                )}
              </React.Fragment>
            );
          })}
        </View>

        <PageNumber />
      </Page>
    </Document>
  );
};

export default ApprovalChainsPdfDocument;
