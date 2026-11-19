'use client';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import useProsERPStyles from '@/app/helpers/style-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { yupResolver } from '@hookform/resolvers/yup';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Div, Span } from '@jumbo/shared';
import { HighlightOff } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import CostCenterSelector from '../../../masters/costCenters/CostCenterSelector';
import pdfStyles from '../../../pdf/pdf-styles';
import PDFContent from '../../../pdf/PDFContent';
import PdfLogo from '../../../pdf/PdfLogo';
import financialReportsServices from '../financial-reports-services';
import CashFlowOnScreen, { money } from './CashFlowOnScreen';

// The statement as flat rows - the PDF has no expandable ledgers, so each line stands on its own
const pdfRows = (reportData) => {
  const rows = [];
  const add = (label, amount, type = 'line') => rows.push({ label, amount, type });
  const { operating, investing, financing } = reportData;

  add('Cash flows from operating activities', null, 'section');
  add('Net profit for the period', reportData.net_profit);
  if (operating.adjustments.length) {
    add('Adjustments for non-cash items', null, 'subheading');
    operating.adjustments.forEach((line) => add(line.label, line.amount));
  }
  if (operating.working_capital.length) {
    add('Changes in working capital', null, 'subheading');
    operating.working_capital.forEach((line) => add(line.label, line.amount));
  }
  add('Net cash from operating activities', operating.total, 'total');

  add('Cash flows from investing activities', null, 'section');
  investing.lines.forEach((line) => add(line.label, line.amount));
  add('Net cash from investing activities', investing.total, 'total');

  add('Cash flows from financing activities', null, 'section');
  financing.lines.forEach((line) => add(line.label, line.amount));
  add('Net cash from financing activities', financing.total, 'total');

  add('Net increase / (decrease) in cash', reportData.net_change, 'grand');
  add('Cash at beginning of period', reportData.opening_cash);
  add('Cash at end of period', reportData.closing_cash, 'grand');
  return rows;
};

const ReportDocument = ({ reportData, authOrganization, user }) => {
  const mainColor = authOrganization.organization.settings?.main_color || '#2113AD';
  const lightColor = authOrganization.organization.settings?.light_color || '#bec5da';
  const contrastText = authOrganization.organization.settings?.contrast_text || '#FFFFFF';
  const { from, to, cost_centers: costCenters } = reportData.filters;
  const reportPeriod = `Period: ${readableDate(from, true)} to ${readableDate(to, true)}`;

  return (
    <Document
      creator={` ${user.name} | Powered By ProsERP`}
      producer='ProsERP'
      title={`Cash Flow Statement ${reportPeriod}`}
    >
      <Page size='A4' style={{ ...pdfStyles.page, padding: 24 }}>
        <View style={pdfStyles.table}>
          <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
            <View style={{ flex: 1, maxWidth: 120 }}>
              <PdfLogo organization={authOrganization.organization} />
            </View>
            <View style={{ flex: 1, textAlign: 'right' }}>
              <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>Cash Flow Statement</Text>
              <Text style={{ ...pdfStyles.minInfo }}>Indirect method</Text>
              <Text style={{ ...pdfStyles.minInfo }}>{reportPeriod}</Text>
            </View>
          </View>
        </View>
        <View style={{ ...pdfStyles.tableRow, marginTop: 10, marginBottom: 10 }}>
          {Array.isArray(costCenters) && costCenters.length > 0 && (
            <View style={{ flex: 2, padding: 2 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Cost Centers</Text>
              <Text style={{ ...pdfStyles.minInfo }}>{costCenters.map((costCenter) => costCenter.name).join(', ')}</Text>
            </View>
          )}
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Printed By</Text>
            <Text style={{ ...pdfStyles.minInfo }}>{user.name}</Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Printed On</Text>
            <Text style={{ ...pdfStyles.minInfo }}>{readableDate(undefined, true)}</Text>
          </View>
        </View>

        <View style={pdfStyles.table}>
          {pdfRows(reportData).map((row, index) => {
            const isSection = row.type === 'section';
            const isStrong = ['total', 'grand'].includes(row.type);
            const background = isSection ? mainColor : isStrong ? lightColor : '#FFFFFF';
            const cell = {
              ...pdfStyles.tableCell,
              backgroundColor: background,
              color: isSection ? contrastText : undefined,
              fontWeight: isSection || isStrong || row.type === 'subheading' ? 'bold' : 'normal',
              fontSize: 8,
              paddingVertical: 3,
            };
            return (
              <View key={index} style={pdfStyles.tableRow} wrap={false}>
                <Text style={{ ...cell, flex: 4, paddingLeft: isSection || isStrong ? 4 : 14 }}>{row.label}</Text>
                <Text
                  style={{
                    ...cell,
                    flex: 1.4,
                    textAlign: 'right',
                    color: row.amount < 0 && !isSection ? '#D32F2F' : cell.color,
                  }}
                >
                  {row.amount === null ? '' : money(row.amount)}
                </Text>
              </View>
            );
          })}
        </View>
      </Page>
    </Document>
  );
};

function CashFlow({ setOpenCashFlowDialog }) {
  document.title = 'Cash Flow Statement';
  const dictionary = useDictionary();
  const css = useProsERPStyles();
  const { enqueueSnackbar } = useSnackbar();
  const {
    authOrganization,
    authUser: { user },
    checkOrganizationPermission,
  } = useJumboAuth();

  const validationSchema = yup.object({
    from: yup.string().required('From date is required').typeError('From date is required'),
    to: yup.string().required('To date is required').typeError('To date is required'),
  });

  const { setValue, watch, handleSubmit } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      from: dayjs().startOf('year').toISOString(),
      to: dayjs().toISOString(),
      cost_center_ids: checkOrganizationPermission(PERMISSIONS.COST_CENTERS_ALL)
        ? 'all'
        : authOrganization?.costCenters.map((costCenter) => costCenter.id),
    },
  });

  const [isFetching, setIsFetching] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showOnScreen, setShowOnScreen] = useState(true);

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const retrieveReport = async (filters) => {
    setIsFetching(true);
    setError(null);
    try {
      setReportData(await financialReportsServices.cashFlow(filters));
    } catch (e) {
      setReportData(null);
      setError(e?.response?.data?.message || 'Failed to load the Cash Flow Statement');
    } finally {
      setIsFetching(false);
    }
  };

  const downloadExcel = async () => {
    try {
      setIsDownloading(true);
      const filters = { from: watch('from'), to: watch('to'), cost_center_ids: watch('cost_center_ids') };
      const responseData = await financialReportsServices.downloadExcelCashFlow(filters);
      const blob = new Blob([responseData], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Cash Flow ${readableDate(filters.from, true)} to ${readableDate(filters.to, true)}.xlsx`;
      link.click();
    } catch (e) {
      enqueueSnackbar('Error downloading Excel', { variant: 'error' });
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadFileName = `Cash Flow ${readableDate(watch('from'), true)} to ${readableDate(watch('to'), true)}`;

  return (
    <>
      <DialogTitle textAlign={'center'}>
        <Grid container>
          <Grid size={{ xs: 12 }} textAlign={'center'}>
            <Typography variant='h3'>{dictionary.reports.accountsReports.cashFlow.title}</Typography>
          </Grid>
          {belowLargeScreen && (
            <Tooltip title='Close'>
              <IconButton
                size='small'
                sx={{ position: 'absolute', top: 10, right: 10 }}
                onClick={() => setOpenCashFlowDialog(false)}
              >
                <HighlightOff color='primary' />
              </IconButton>
            </Tooltip>
          )}
        </Grid>
        <Span className={css.hiddenOnPrint}>
          <form autoComplete='off' onSubmit={handleSubmit(retrieveReport)}>
            <Grid container columnSpacing={1} rowSpacing={1} alignItems='center' justifyContent='center'>
              <Grid size={{ xs: 12, lg: 6 }}>
                <CostCenterSelector
                  label='Cost Centers (leave empty for all)'
                  multiple={true}
                  // Same defaulting rule as the Trial Balance: a CostCenters:All user starts unfiltered
                  defaultValue={
                    checkOrganizationPermission(PERMISSIONS.COST_CENTERS_ALL) ? [] : authOrganization?.costCenters
                  }
                  allowSameType={true}
                  onChange={(costCenters) => {
                    setValue(
                      'cost_center_ids',
                      costCenters.length === 0 && checkOrganizationPermission(PERMISSIONS.COST_CENTERS_ALL)
                        ? 'all'
                        : costCenters.map((costCenter) => costCenter.id)
                    );
                  }}
                />
              </Grid>
              {[
                ['From', 'from', dayjs().startOf('year')],
                ['To', 'to', dayjs()],
              ].map(([label, field, defaultValue]) => (
                <Grid key={field} size={{ xs: 12, sm: 6, lg: 3 }}>
                  <Div sx={{ mt: 1, mb: 1 }}>
                    <DateTimePicker
                      label={`${label} (MM/DD/YYYY)`}
                      defaultValue={defaultValue}
                      minDate={dayjs(authOrganization?.organization.recording_start_date)}
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                      onChange={(newValue) => {
                        setValue(field, newValue ? newValue.toISOString() : null, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                    />
                  </Div>
                </Grid>
              ))}
              <Grid size={{ xs: 12 }}>
                {/* Export (once a report is showing) above, Filter below, both on the right */}
                <Stack direction='column' spacing={1} useFlexGap alignItems='flex-end'>
                  {reportData && (
                    <FileExportGrid
                      exportExcel
                      handlExcelExport={() => downloadExcel()}
                      exportingExcel={isDownloading}
                      exportPdf
                      handlePdf={() => setShowOnScreen((previous) => !previous)}
                    />
                  )}
                  <LoadingButton loading={isFetching} type='submit' size='small' variant='contained'>
                    Filter
                  </LoadingButton>
                </Stack>
              </Grid>
            </Grid>
          </form>
        </Span>
      </DialogTitle>
      <DialogContent>
        {isFetching ? (
          <LinearProgress />
        ) : error ? (
          <Alert severity='error'>{error}</Alert>
        ) : (
          reportData &&
          (showOnScreen ? (
            <CashFlowOnScreen reportData={reportData} authOrganization={authOrganization} />
          ) : (
            <PDFContent
              document={<ReportDocument reportData={reportData} authOrganization={authOrganization} user={user} />}
              fileName={downloadFileName}
            />
          ))
        )}
      </DialogContent>
    </>
  );
}

export default CashFlow;
