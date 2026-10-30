import React from 'react'
import { useState } from 'react';
import * as yup from 'yup';
import financialReportsServices from '../financial-reports-services';
import { Box, DialogContent, DialogTitle, Grid, LinearProgress, Skeleton, Switch, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import dayjs from 'dayjs';
import { DateTimePicker } from '@mui/x-date-pickers';
import { LoadingButton } from '@mui/lab';
import PDFContent from '../../../pdf/PDFContent';
import ZReportPDF from './ZReportPDF';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import useProsERPStyles from '@/app/helpers/style-helpers';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { Div, Span } from '@jumbo/shared';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

function ZReport() {
  const dictionary = useDictionary();
  document.title = dictionary.reports.accountsReports.zReport.title;
  const { authOrganization, authUser: {user}} = useJumboAuth();
  const {hiddenOnPrint} = useProsERPStyles();
  const [reportData, setReportData] = useState(null);
  const [today] = useState(dayjs());
  const [thermalPrinter, setThermalPrinter] = useState(false);

  const validationSchema = yup.object({
      from: yup.string().required(dictionary.reports.accountsReports.common.startDateRequired).typeError(dictionary.reports.accountsReports.common.startDateRequired),
    });
  
  const { setValue, handleSubmit } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      from: dayjs().startOf('day').toISOString(),
      to: dayjs().toISOString(),
    },
  });

  const [isFetching, setisFetching] = useState(false);
  const retrieveReport = async (filters) => {
    setisFetching(true);
    const report = await financialReportsServices.zReport(filters);
    setReportData(report);
    setisFetching(false);
  }

  const downloadFileName = `Z Report ${readableDate(reportData?.filters?.from)}-${readableDate(reportData?.filters?.to)}`;

  return (
  <>
    {
      <DialogTitle textAlign={'center'} className={hiddenOnPrint}>
        <Grid container>
          <Grid size={{xs: 12}}>
            <Typography variant="h3">{dictionary.reports.accountsReports.zReport.title}</Typography>
          </Grid>
        </Grid>
        <Span>
          <form autoComplete="off" onSubmit={handleSubmit(retrieveReport)}>
            <Grid
              container
              columnSpacing={1}
              rowSpacing={1}
              alignItems="center"
              justifyContent="center"
            >
              <Grid size={{xs: 12, md: 6}}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <DateTimePicker
                    label={dictionary.reports.accountsReports.common.from}
                    minDate={dayjs(authOrganization?.organization.recording_start_date)}
                    defaultValue={today.startOf('day')}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                      },
                    }}
                    onChange={(newValue) => {
                      setValue('from', newValue ? newValue.toISOString() : null, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={{xs: 12, md: 6}}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <DateTimePicker
                    label={dictionary.reports.accountsReports.common.to}
                    defaultValue={dayjs().endOf('day')}
                    minDate={dayjs(authOrganization?.organization.recording_start_date)}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                      },
                    }}
                    onChange={(newValue) => {
                      setValue('to', newValue ? newValue.toISOString() : null, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={12} textAlign="right">
                <LoadingButton loading={isFetching} type="submit" size="small" variant="contained">
                  {dictionary.reports.accountsReports.common.filter}
                </LoadingButton>
              </Grid>
            </Grid>
          </form>
        </Span>
        <Box display="flex" alignItems="center" justifyContent="center">
          <Typography variant="body1" style={{ marginRight: 8 }}>
            A4
          </Typography>
          <Switch
            checked={thermalPrinter}
            size='small'
            onChange={(e) => setThermalPrinter(e.target.checked)}
          />
          <Typography variant="body1" style={{ marginLeft: 8 }}>
            80mm
          </Typography>
        </Box>
      </DialogTitle>
    }
      <DialogContent>
        {
          isFetching ? 
            <div style={{ width: '100%', padding: '16px' }}>
              <Skeleton variant="text" width={180} height={32} style={{ borderRadius: 4, marginLeft: 'auto' }} />
              <Skeleton variant="rectangular" width="100%" height={48} style={{ borderRadius: 4 }} />
              <Skeleton variant="rectangular" width="100%" height={32} style={{ borderRadius: 4 }} />
            </div>
              :
          reportData &&
          (
            <PDFContent
              document={<ZReportPDF reportData={reportData} thermalPrinter={thermalPrinter} authOrganization={authOrganization} user={user} dictionary={dictionary}/>}
              fileName={downloadFileName}
            />
          )
        }
      </DialogContent>
  </>
  )
}

export default ZReport;
