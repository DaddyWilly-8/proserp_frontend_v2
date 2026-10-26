'use client';

import { 
  Box, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Chip,
  Card,
  CardContent
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import smsServices from './smsServices';
import { useSnackbar } from 'notistack';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface DeliveryReport {
  messageId: string;
  sentAt: string;
  doneAt: string;
  to: string;
  smsCount: number;
  status: {
    groupId: number;
    groupName: string;
    id: number;
    name: string;
    description: string;
  } | null;
  error: {
    groupId: number;
    groupName: string;
    id: number;
    name: string;
    description: string;
    permanent: boolean;
  } | null;
}

interface DeliveryReportResponse {
  results: DeliveryReport[];
}

export default function DeliveryReportsForm() {
  const dictionary = useDictionary();
  const { enqueueSnackbar } = useSnackbar();
  const [reports, setReports] = useState<DeliveryReport[]>([]);

  const mutation = useMutation({
    mutationFn: smsServices.getDeliveryReport,
    onSuccess: (data: DeliveryReportResponse) => {
      enqueueSnackbar(dictionary.forms.nextSms.deliveryReports.success, { variant: 'success' });
      setReports(data.results || []);
    },
    onError: (err: any) => {
      enqueueSnackbar(err?.response?.data?.message || dictionary.forms.nextSms.deliveryReports.failed, { variant: 'error' });
      setReports([]);
    }
  });

  const handleGetReports = () => {
    mutation.mutate();
  };

  const getStatusColor = (statusName: string | null) => {
    if (!statusName) return 'default';
    
    switch (statusName) {
      case 'DELIVERED_TO_HANDSET':
        return 'success';
      case 'PENDING_ENROUTE':
        return 'warning';
      case 'REJECTED':
      case 'EXPIRED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getErrorColor = (errorName: string | null) => {
    if (!errorName) return 'default';
    
    switch (errorName) {
      case 'NO_ERROR':
        return 'success';
      default:
        return 'error';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6">{dictionary.forms.nextSms.deliveryReports.title}</Typography>

      <LoadingButton 
        onClick={handleGetReports}
        variant="contained" 
        loading={mutation.isPending}
        sx={{ mb: 2, alignSelf: 'flex-start' }}
      >
        {dictionary.forms.nextSms.deliveryReports.button}
      </LoadingButton>

      {reports.length > 0 && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {dictionary.forms.nextSms.deliveryReports.recordsTitle.replace('{count}', String(reports.length))}
            </Typography>
            
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{dictionary.forms.nextSms.common.to}</TableCell>
                    <TableCell>{dictionary.forms.nextSms.common.status}</TableCell>
                    <TableCell>{dictionary.forms.nextSms.common.description}</TableCell>
                    <TableCell>{dictionary.forms.nextSms.common.smsCount}</TableCell>
                    <TableCell>{dictionary.forms.nextSms.common.sentAt}</TableCell>
                    <TableCell>{dictionary.forms.nextSms.common.completedAt}</TableCell>
                    <TableCell>{dictionary.forms.nextSms.common.error}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reports.map((report, index) => (
                    <TableRow key={index}>
                      <TableCell>{report.to}</TableCell>
                      <TableCell>
                        {report.status ? (
                          <Chip 
                            label={report.status.name} 
                            color={getStatusColor(report.status.name)}
                            size="small"
                          />
                        ) : (
                          <Chip label={dictionary.forms.nextSms.common.unknown} color="default" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        {report.status?.description || dictionary.forms.nextSms.deliveryReports.noStatus}
                      </TableCell>
                      <TableCell>{report.smsCount}</TableCell>
                      <TableCell>{formatDate(report.sentAt)}</TableCell>
                      <TableCell>{report.doneAt ? formatDate(report.doneAt) : dictionary.forms.nextSms.common.notAvailable}</TableCell>
                      <TableCell>
                        {report.error ? (
                          <Chip 
                            label={report.error.name} 
                            color={getErrorColor(report.error.name)}
                            size="small"
                          />
                        ) : (
                          <Chip label="NO_ERROR" color="success" size="small" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Summary Statistics */}
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                {dictionary.forms.nextSms.common.summary}
              </Typography>
              <Typography variant="body2">
                {dictionary.forms.nextSms.common.totalMessages.replace('{count}', String(reports.length))}
              </Typography>
              <Typography variant="body2">
                {dictionary.forms.nextSms.common.delivered.replace('{count}', String(reports.filter(r => r.status?.name === 'DELIVERED_TO_HANDSET').length))}
              </Typography>
              <Typography variant="body2">
                {dictionary.forms.nextSms.common.pending.replace('{count}', String(reports.filter(r => r.status === null).length))}
              </Typography>
              <Typography variant="body2">
                {dictionary.forms.nextSms.common.totalSms.replace('{count}', String(reports.reduce((total, report) => total + report.smsCount, 0)))}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {mutation.isSuccess && reports.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          {dictionary.forms.nextSms.deliveryReports.empty}
        </Typography>
      )}
    </Box>
  );
}