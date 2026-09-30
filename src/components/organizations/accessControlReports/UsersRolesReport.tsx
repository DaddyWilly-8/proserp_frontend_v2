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
import accessControlReportsServices from './access-control-reports-services';
import ReportExportButtons from './ReportExportButtons';
import { downloadBlob, MIME_TYPES } from './downloadBlob';

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

  const [isFetching, setIsFetching] = useState(false);
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [exportingPdf, setExportingPdf] = useState(false);

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

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      const data = await accessControlReportsServices.downloadPdfUsersRoles();
      downloadBlob(data, MIME_TYPES.pdf, 'Users and Roles.pdf');
    } catch (error) {
      enqueueSnackbar(dict.messages.exportError, { variant: 'error' });
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <Div>
      <Stack direction='row' justifyContent='flex-end' mb={2}>
        <ReportExportButtons
          onExportPdf={handleExportPdf}
          exportingPdf={exportingPdf}
          pdfLabel={dict.buttons.exportPdf}
        />
      </Stack>

      {isFetching && <LinearProgress />}

      {!isFetching && (
        <TableContainer>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>{dict.usersRoles.name}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{dict.usersRoles.email}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{dict.usersRoles.phone}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{dict.usersRoles.roles}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Typography variant='body1' fontWeight='medium'>{user.name}</Typography>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>
                    {user.organization_roles?.length ? (
                      <Stack direction='row' flexWrap='wrap' gap={0.5}>
                        {user.organization_roles.map((role) => (
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
      )}
    </Div>
  );
};

export default UsersRolesReport;
