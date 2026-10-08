'use client'

import React, { useEffect, useState } from 'react';
import {
  Chip,
  FormControlLabel,
  LinearProgress,
  Stack,
  Switch,
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
import UsersRolesPdfDocument from './UsersRolesPdfDocument';

type Role = { id: number; name: string };
type OrgUser = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  organization_roles: Role[];
};

const UsersRolesReport = () => {
  const dictionary = useDictionary();
  const dict = dictionary.accessControlReports;
  const { enqueueSnackbar } = useSnackbar();
  const { authOrganization, authUser } = useJumboAuth();
  const user = authUser?.user;

  const [isFetching, setIsFetching] = useState(false);
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [showPdf, setShowPdf] = useState(false);
  const [showContacts, setShowContacts] = useState(true);

  const retrieveReport = async () => {
    setIsFetching(true);
    try {
      const data = await accessControlReportsServices.usersRoles();
      setUsers(data || []);
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
    accessControlReportsServices.markUsersRolesPdfExported().catch(() => {});
  };

  return (
    <Div>
      <Stack direction='row' justifyContent='space-between' alignItems='center' mb={2}>
        <FormControlLabel
          control={
            <Switch
              checked={showContacts}
              onChange={(e) => setShowContacts(e.target.checked)}
              size='small'
            />
          }
          label={dict.usersRoles.showContacts}
        />
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
              <UsersRolesPdfDocument
                users={users}
                authOrganization={authOrganization}
                user={user}
                showContacts={showContacts}
              />
            }
            fileName='Users and Roles'
          />
        ) : (
        <TableContainer>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>{dict.usersRoles.name}</TableCell>
                {showContacts && (
                  <>
                    <TableCell sx={{ fontWeight: 'bold' }}>{dict.usersRoles.email}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{dict.usersRoles.phone}</TableCell>
                  </>
                )}
                <TableCell sx={{ fontWeight: 'bold' }}>{dict.usersRoles.roles}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((orgUser) => (
                <TableRow key={orgUser.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Typography variant='body1' fontWeight='medium'>{orgUser.name}</Typography>
                  </TableCell>
                  {showContacts && (
                    <>
                      <TableCell>{orgUser.email}</TableCell>
                      <TableCell>{orgUser.phone}</TableCell>
                    </>
                  )}
                  <TableCell>
                    {orgUser.organization_roles?.length ? (
                      <Stack direction='row' flexWrap='wrap' gap={0.5}>
                        {orgUser.organization_roles.map((role) => (
                          <Chip key={role.id} label={role.name} size='small' variant='outlined' />
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant='body2' color='text.secondary'>
                        {dict.usersRoles.noRoles}
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        )
      )}
    </Div>
  );
};

export default UsersRolesReport;
