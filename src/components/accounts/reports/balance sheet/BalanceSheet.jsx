'use client';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import useProsERPStyles from '@/app/helpers/style-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import { yupResolver } from '@hookform/resolvers/yup';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Div, Span } from '@jumbo/shared';
import { HighlightOff } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  LinearProgress,
  Stack,
  Switch,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import pdfStyles from '../../../pdf/pdf-styles';
import PDFContent from '../../../pdf/PDFContent';
import PdfLogo from '../../../pdf/PdfLogo';
import financialReportsServices from '../financial-reports-services';
import {
  PeriodPdfHeader,
  PDF_PAGE_STYLE,
  PeriodPdfRow,
  hasPeriodActivity,
  periodSubtitle,
} from '../periodColumns';
import BalanceSheetOnScreen from './BalanceSheetOnScreen';

// Walks the balance sheet tree into indented rows; a node with visible
// children is followed by its own "Total" row, as on screen.
const flattenForPdf = (nodes, level) =>
  nodes.filter(hasPeriodActivity).flatMap((node) => {
    const visibleChildren = (node.children ?? []).filter(hasPeriodActivity);
    return [
      { label: node.name, level, node, bold: level === 0, shaded: level === 0 },
      ...flattenForPdf(visibleChildren, level + 1),
      ...(visibleChildren.length > 0
        ? [{ label: `Total ${node.name}`, level, node, bold: true, shaded: false }]
        : []),
    ];
  });

const ReportDocument = ({ reportData, authOrganization, user, netOnly }) => {
  const mainColor =
    authOrganization.organization.settings?.main_color || '#2113AD';
  const contrastText =
    authOrganization.organization.settings?.contrast_text || 'black';
  const lightColor =
    authOrganization.organization.settings?.light_color || '#bec5da';
  const reportPeriod = periodSubtitle(reportData.filters, readableDate);

  return reportData ? (
    <Document
      creator={` ${user.name} | Powered By ProsERP`}
      producer='ProsERP'
      title={`Balance Sheet ${reportPeriod}`}
    >
      <Page size='A4' orientation='landscape' style={PDF_PAGE_STYLE}>
        <View style={pdfStyles.table}>
          <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
            <View style={{ flex: 1, maxWidth: 120 }}>
              <PdfLogo organization={authOrganization.organization} />
            </View>
            <View style={{ flex: 1, textAlign: 'right' }}>
              <Text
                style={{ ...pdfStyles.majorInfo, color: mainColor }}
              >{`Balance Sheet`}</Text>
              <Text style={{ ...pdfStyles.minInfo }}>{reportPeriod}</Text>
            </View>
          </View>
        </View>
        <View style={{ ...pdfStyles.tableRow, marginTop: 10 }}>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              Printed By
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>{user.name}</Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              Printed On
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>
              {readableDate(undefined, true)}
            </Text>
          </View>
        </View>
        <View style={{ ...pdfStyles.table, marginTop: 15 }}>
          <PeriodPdfHeader netOnly={netOnly}
            leading={[{ label: 'Category', flex: 3 }]}
            mainColor={mainColor}
            contrastText={contrastText}
          filters={reportData.filters}
          />
          {flattenForPdf(reportData?.balanceSheetData ?? [], 0).map((row, index) => (
            <PeriodPdfRow netOnly={netOnly}
              key={index}
              leading={[{ text: row.label, flex: 3, indent: row.level }]}
              node={row.node}
              backgroundColor={row.shaded ? lightColor : '#FFFFFF'}
              bold={row.bold}
            />
          ))}
        </View>
      </Page>
    </Document>
  ) : (
    ''
  );
};

function BalanceSheet({ as_at, setOpenBalanceSheettDialog }) {
  document.title = 'Balance Sheet';
  const css = useProsERPStyles();
  const [displayAs, setDisplayAs] = useState('on screen');
  const [triggerFetch, setTriggerFetch] = useState(as_at ? true : false);
  const { enqueueSnackbar } = useSnackbar();
  const {
    authOrganization,
    authUser: { user },
  } = useJumboAuth();
  const [isFetching, setisFetching] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [isDownloadingTemplate, setIsDownloadingTemplate] =
    React.useState(false);
  const [uploadFieldsKey, setUploadFieldsKey] = useState(0);
  const [showOnScreen, setShowOnScreen] = useState(true);
  const [netOnly, setNetOnly] = useState(true);

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const validationSchema = yup.object({
    from: yup
      .string()
      .required('From date is required')
      .typeError('From date is required'),
    to: yup
      .string()
      .required('To date is required')
      .typeError('To date is required'),
  });

  const { setValue, handleSubmit, watch } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      from: as_at
        ? dayjs(as_at).startOf('year').toISOString()
        : dayjs().startOf('year').toISOString(),
      to: as_at ? dayjs(as_at).toISOString() : dayjs().toISOString(),
    },
  });

  const retrieveReport = async (filters) => {
    setisFetching(true);
    const report = await financialReportsServices.balanceSheet({
      from: filters.from,
      to: filters.to,
      display_as: displayAs,
    });
    setReportData(report);
    setisFetching(false);
  };
  0;
  const downloadExcelTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      setUploadFieldsKey((prevKey) => prevKey + 1);

      const responseData = await financialReportsServices.balanceSheet({
        from: watch('from'),
        to: watch('to'),
        display_as: 'excel',
        net_only: netOnly,
      });

      const blob = new Blob([responseData], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Balance Sheet ${readableDate(watch('from'), true)} to ${readableDate(watch('to'), true)}.xlsx`;
      link.click();

      setIsDownloadingTemplate(false);
    } catch (error) {
      enqueueSnackbar('Error downloading Excel template', { variant: 'error' });
      setIsDownloadingTemplate(false);
    }
  };

  useEffect(() => {
    if (as_at && !!triggerFetch) {
      // this if is special to trigger data fetch when dialog opened from Dashboard
      retrieveReport({
        from: watch('from'),
        to: as_at,
        display_as: 'on screen',
      });
      setTriggerFetch(false);
    } else if (
      !!triggerFetch &&
      !reportData.balanceSheetData &&
      (displayAs === 'on screen' || displayAs === 'pdf')
    ) {
      retrieveReport({
        from: watch('from'),
        to: watch('to'),
        display_as: displayAs,
      });
    }
  }, [as_at, displayAs]);

  return (
    <>
      <DialogTitle textAlign={'center'}>
        <Grid container>
          <Grid size={{ xs: 12 }}>
            <Typography variant='h3'>Balance Sheet</Typography>
          </Grid>
          {belowLargeScreen && (
            <Tooltip title='Close'>
              <IconButton
                size='small'
                sx={{ position: 'absolute', top: 10, right: 10 }}
                onClick={() => setOpenBalanceSheettDialog(false)}
              >
                <HighlightOff color='primary' />
              </IconButton>
            </Tooltip>
          )}
        </Grid>
        <Span className={css.hiddenOnPrint}>
          <form
            key={uploadFieldsKey}
            autoComplete='off'
            onSubmit={handleSubmit(retrieveReport)}
          >
            <Grid
              container
              columnSpacing={1}
              rowSpacing={1}
              alignItems='center'
              justifyContent='center'
            >
              <Grid size={{ xs: 12, md: 3 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <DateTimePicker
                    label='From (MM/DD/YYYY)'
                    defaultValue={as_at ? dayjs(as_at).startOf('year') : dayjs().startOf('year')}
                    minDate={dayjs(
                      authOrganization?.organization.recording_start_date
                    )}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                      },
                    }}
                    onChange={(newValue) => {
                      setValue(
                        'from',
                        newValue ? newValue.toISOString() : null,
                        {
                          shouldValidate: true,
                          shouldDirty: true,
                        }
                      );
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <DateTimePicker
                    label='To (MM/DD/YYYY)'
                    defaultValue={as_at ? dayjs(as_at) : dayjs()}
                    minDate={dayjs(
                      authOrganization?.organization.recording_start_date
                    )}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                      },
                    }}
                    onChange={(newValue) => {
                      setValue(
                        'to',
                        newValue ? newValue.toISOString() : null,
                        {
                          shouldValidate: true,
                          shouldDirty: true,
                        }
                      );
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }} textAlign='right'>
                <Stack
                  direction='row'
                  spacing={0.5}
                  justifyContent='end'
                  alignItems='center'
                >
                  <>
                    <FormControlLabel
                    control={
                      <Switch
                        size='small'
                        checked={netOnly}
                        onChange={(e) => setNetOnly(e.target.checked)}
                      />
                    }
                    label='Net only'
                    sx={{ mr: 0.5 }}
                  />
                    {reportData && (
                      <FileExportGrid
                        exportExcel
                        handlExcelExport={() => downloadExcelTemplate()}
                        exportingExcel={isDownloadingTemplate}
                        exportPdf
                        handlePdf={() => {
                          setShowOnScreen((prev) => !prev);
                        }}
                      />
                    )}
                    <LoadingButton
                      loading={isFetching}
                      type='submit'
                      size='small'
                      variant='contained'
                    >
                      Filter
                    </LoadingButton>
                  </>
                </Stack>
              </Grid>
            </Grid>
          </form>
        </Span>
      </DialogTitle>
      <DialogContent>
        {isFetching ? (
          <LinearProgress />
        ) : (
          reportData &&
          (!showOnScreen ? (
            <PDFContent
              document={
                <ReportDocument
                  reportData={reportData}
                  authOrganization={authOrganization}
                  user={user}
                  netOnly={netOnly}
                />
              }
              fileName={`Balance Sheet ${readableDate(reportData?.filters?.from, true)} to ${readableDate(reportData?.filters?.to, true)}`}
            />
          ) : (
            <BalanceSheetOnScreen reportData={reportData} netOnly={netOnly} />
          ))
        )}
      </DialogContent>
    </>
  );
}

export default BalanceSheet;
