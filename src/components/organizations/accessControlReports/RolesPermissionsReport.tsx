'use client'

import React, { useEffect, useState } from 'react';
import {
  Chip,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { Div } from '@jumbo/shared';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import accessControlReportsServices from './access-control-reports-services';
import ReportExportButtons from './ReportExportButtons';
import PDFContent from '../../pdf/PDFContent';
import RolesPermissionsPdfDocument from './RolesPermissionsPdfDocument';
import { groupPermissionsByCategory } from './permissionCategory';

type Permission = { id: number; name: string; is_core?: boolean; modules?: { id: number; name: string }[] };
type Role = { id: number; name: string; description?: string; permissions: Permission[] };

const RolesPermissionsReport = () => {
  const dictionary = useDictionary();
  const dict = dictionary.accessControlReports;
  const { enqueueSnackbar } = useSnackbar();
  const { authOrganization, authUser } = useJumboAuth();
  const user = authUser?.user;

  const [isFetching, setIsFetching] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [showPdf, setShowPdf] = useState(false);

  const retrieveReport = async () => {
    setIsFetching(true);
    try {
      const data = await accessControlReportsServices.rolesPermissions();
      setRoles(data || []);
    } catch (error) {
      enqueueSnackbar(dict.messages.loadError, { variant: 'error' });
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    retrieveReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTogglePdf = () => {
    setShowPdf((prev) => !prev);
    accessControlReportsServices.markRolesPermissionsPdfExported().catch(() => {});
  };

  return (
    <Div>
      <Stack direction='row' justifyContent='flex-end' mb={2}>
        <ReportExportButtons
          onExportPdf={handleTogglePdf}
          pdfLabel={dict.buttons.exportPdf}
        />
      </Stack>

      {isFetching && <LinearProgress />}

      {!isFetching && (
        showPdf ? (
          <PDFContent
            document={
              <RolesPermissionsPdfDocument roles={roles} authOrganization={authOrganization} user={user} />
            }
            fileName='Roles and Permissions'
          />
        ) : (
        <TableContainer>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>{dict.rolesPermissions.role}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{dict.rolesPermissions.category}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{dict.rolesPermissions.permissions}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roles.map((role) => {
                const grouped = groupPermissionsByCategory(role.permissions || []);

                const roleCell = (rowSpan: number) => (
                  <TableCell
                    rowSpan={rowSpan}
                    sx={{ verticalAlign: 'top', whiteSpace: 'nowrap', borderRight: '1px solid', borderColor: 'divider' }}
                  >
                    <Typography variant='body1' fontWeight='medium'>{role.name}</Typography>
                    {role.description && (
                      <Typography variant='caption' color='text.secondary'>{role.description}</Typography>
                    )}
                  </TableCell>
                );

                if (grouped.length === 0) {
                  return (
                    <TableRow key={role.id} hover>
                      {roleCell(1)}
                      <TableCell colSpan={2} sx={{ verticalAlign: 'top', borderColor: 'divider' }}>
                        <Typography variant='body2' color='text.secondary'>
                          {dict.rolesPermissions.noPermissions}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                }

                return grouped.map((group, groupIndex) => (
                  <TableRow key={`${role.id}-${group.category}`} hover>
                    {groupIndex === 0 && roleCell(grouped.length)}
                    <TableCell sx={{ verticalAlign: 'top', whiteSpace: 'nowrap', borderColor: 'divider' }}>
                      <Typography variant='caption' fontWeight='bold' color='text.secondary' sx={{ textTransform: 'uppercase' }}>
                        {group.category}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top', borderColor: 'divider' }}>
                      <Stack direction='row' flexWrap='wrap' gap={0.5}>
                        {group.permissions.map((permission) => (
                          <Chip key={permission.id} label={permission.name} size='small' variant='outlined' />
                        ))}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ));
              })}
            </TableBody>
          </Table>
        </TableContainer>
        )
      )}
    </Div>
  );
};

export default RolesPermissionsReport;
