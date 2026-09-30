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

type ApprovalChainLevel = {
  id: number;
  position_index: number;
  label?: string;
  role?: { id: number; name: string };
};
type ApprovalChain = {
  id: number;
  process_type: string;
  status: string;
  cost_center?: { name: string };
  department?: { name: string };
  levels: ApprovalChainLevel[];
};

const ApprovalChainsReport = () => {
  const dictionary = useDictionary();
  const dict = dictionary.accessControlReports;
  const { enqueueSnackbar } = useSnackbar();

  const [isFetching, setIsFetching] = useState(false);
  const [chains, setChains] = useState<ApprovalChain[]>([]);
  const [exportingPdf, setExportingPdf] = useState(false);

  const retrieveReport = async () => {
    setIsFetching(true);
    try {
      const data = await accessControlReportsServices.approvalChains();
      setChains(data || []);
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
      const data = await accessControlReportsServices.downloadPdfApprovalChains();
      downloadBlob(data, MIME_TYPES.pdf, 'Approval Chains.pdf');
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
                <TableCell sx={{ fontWeight: 'bold' }}>{dict.approvalChains.processType}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{dict.approvalChains.costCenter}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{dict.approvalChains.department}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{dict.approvalChains.status}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{dict.approvalChains.levels}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {chains.map((chain) => (
                <TableRow key={chain.id} hover>
                  <TableCell sx={{ verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                    <Typography variant='body1' fontWeight='medium'>{chain.process_type}</Typography>
                  </TableCell>
                  <TableCell sx={{ verticalAlign: 'top' }}>{chain.cost_center?.name || 'All'}</TableCell>
                  <TableCell sx={{ verticalAlign: 'top' }}>{chain.department?.name || 'All'}</TableCell>
                  <TableCell sx={{ verticalAlign: 'top' }}>
                    <Chip
                      label={chain.status}
                      size='small'
                      color={chain.status === 'active' ? 'success' : 'default'}
                      variant='outlined'
                    />
                  </TableCell>
                  <TableCell sx={{ verticalAlign: 'top' }}>
                    {chain.levels?.length ? (
                      <Stack direction='column' gap={0.5}>
                        {chain.levels
                          .sort((a, b) => a.position_index - b.position_index)
                          .map((level) => (
                            <Typography variant='body2' key={level.id}>
                              {level.position_index}. {level.label ? `${level.label} — ` : ''}
                              {level.role?.name || dict.approvalChains.noLevels}
                            </Typography>
                          ))}
                      </Stack>
                    ) : (
                      <Typography variant='body2' color='text.secondary'>
                        {dict.approvalChains.noLevels}
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

export default ApprovalChainsReport;
