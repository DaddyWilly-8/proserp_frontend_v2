import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import pdfStyles from '../../pdf/pdf-styles';
import PdfLogo from '../../pdf/PdfLogo';
import PageNumber from '../../pdf/PageNumber';
import { groupPermissionsByCategory, CategorizablePermission } from './permissionCategory';

type Role = { id: number; name: string; description?: string; permissions: CategorizablePermission[] };

const RolesPermissionsPdfDocument = ({
  roles,
  authOrganization,
  user,
}: {
  roles: Role[];
  authOrganization: any;
  user?: { name?: string };
}) => {
  const mainColor = authOrganization?.organization?.settings?.main_color || '#1C2B3A';
  const contrastText = authOrganization?.organization?.settings?.contrast_text || '#FFFFFF';
  const printedOn = new Date().toLocaleString();

  return (
    <Document creator={`${user?.name} | Powered By ProsERP`} producer='ProsERP' title='Roles & Permissions'>
      <Page size='A4' style={pdfStyles.page}>
        <View style={{ ...pdfStyles.tableRow, marginBottom: 16 }}>
          <View style={{ flex: 1, maxWidth: 120 }}>
            <PdfLogo organization={authOrganization?.organization} />
          </View>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>Roles & Permissions</Text>
            <Text style={pdfStyles.minInfo}>Printed By: {user?.name}</Text>
            <Text style={pdfStyles.minInfo}>Printed On: {printedOn}</Text>
          </View>
        </View>

        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.3 }}>
              Category
            </Text>
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 3 }}>
              Permissions
            </Text>
          </View>

          {roles.map((role) => {
            const grouped = groupPermissionsByCategory(role.permissions || []);

            return (
              <React.Fragment key={role.id}>
                <View style={{ backgroundColor: '#EDE9E2', padding: 4, borderTopWidth: 1.5, borderTopColor: '#A9824C' }}>
                  <Text style={{ ...pdfStyles.minInfo, fontWeight: 'bold', color: mainColor }}>{role.name}</Text>
                  {!!role.description && (
                    <Text style={{ ...pdfStyles.microInfo, color: '#6B7280' }}>{role.description}</Text>
                  )}
                </View>

                {grouped.length === 0 ? (
                  <View style={pdfStyles.tableRow}>
                    <Text style={{ ...pdfStyles.tableCell, flex: 4.3, color: '#9AA5B1', fontStyle: 'italic' }}>
                      No permissions assigned
                    </Text>
                  </View>
                ) : (
                  grouped.map((group, i) => (
                    <View key={group.category} style={{ ...pdfStyles.tableRow, backgroundColor: i % 2 === 1 ? '#FAF9F6' : '#FFFFFF' }}>
                      <Text style={{ ...pdfStyles.tableCell, flex: 1.3, fontWeight: 'bold', color: mainColor }}>
                        {group.category}
                      </Text>
                      <Text style={{ ...pdfStyles.tableCell, flex: 3, color: '#6B7280' }}>
                        {group.permissions.map((p) => p.name).join(', ')}
                      </Text>
                    </View>
                  ))
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

export default RolesPermissionsPdfDocument;
