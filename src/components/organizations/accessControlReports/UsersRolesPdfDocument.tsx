import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import pdfStyles from '../../pdf/pdf-styles';
import PdfLogo from '../../pdf/PdfLogo';
import PageNumber from '../../pdf/PageNumber';

type Role = { id: number; name: string };
type OrgUser = { id: number; name: string; email: string; phone?: string; organization_roles: Role[] };

const UsersRolesPdfDocument = ({
  users,
  authOrganization,
  user,
  showContacts = true,
  dictionary,
}: {
  users: OrgUser[];
  authOrganization: any;
  user?: { name?: string };
  showContacts?: boolean;
  dictionary: any;
}) => {
  const mainColor = authOrganization?.organization?.settings?.main_color || '#1C2B3A';
  const contrastText = authOrganization?.organization?.settings?.contrast_text || '#FFFFFF';
  const printedOn = new Date().toLocaleString();

  const nameFlex = showContacts ? 1.6 : 2.5;
  const rolesFlex = showContacts ? 2 : 3;

  return (
    <Document creator={`${user?.name} | Powered By ProsERP`} producer='ProsERP' title={dictionary.accessControlReports.tabs.usersRoles}>
      <Page size='A4' style={pdfStyles.page}>
        <View style={{ ...pdfStyles.tableRow, marginBottom: 16 }}>
          <View style={{ flex: 1, maxWidth: 120 }}>
            <PdfLogo organization={authOrganization?.organization} />
          </View>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>{dictionary.accessControlReports.tabs.usersRoles}</Text>
            <Text style={pdfStyles.minInfo}>{dictionary.reports.accessControlReports.printedBy}: {user?.name}</Text>
            <Text style={pdfStyles.minInfo}>{dictionary.reports.accessControlReports.printedOn}: {printedOn}</Text>
          </View>
        </View>

        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: nameFlex }}>{dictionary.accessControlReports.usersRoles.name}</Text>
            {showContacts && (
              <>
                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2 }}>{dictionary.accessControlReports.usersRoles.email}</Text>
                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.2 }}>{dictionary.accessControlReports.usersRoles.phone}</Text>
              </>
            )}
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: rolesFlex }}>{dictionary.accessControlReports.usersRoles.roles}</Text>
          </View>

          {users.map((u, i) => (
            <View key={u.id} style={{ ...pdfStyles.tableRow, backgroundColor: i % 2 === 1 ? '#FAF9F6' : '#FFFFFF' }}>
              <Text style={{ ...pdfStyles.tableCell, flex: nameFlex }}>{u.name}</Text>
              {showContacts && (
                <>
                  <Text style={{ ...pdfStyles.tableCell, flex: 2 }}>{u.email}</Text>
                  <Text style={{ ...pdfStyles.tableCell, flex: 1.2 }}>{u.phone}</Text>
                </>
              )}
              <Text style={{ ...pdfStyles.tableCell, flex: rolesFlex, color: '#6B7280' }}>
                {u.organization_roles?.length ? u.organization_roles.map((r) => r.name).join(', ') : dictionary.accessControlReports.usersRoles.noRoles}
              </Text>
            </View>
          ))}
        </View>

        <PageNumber />
      </Page>
    </Document>
  );
};

export default UsersRolesPdfDocument;
