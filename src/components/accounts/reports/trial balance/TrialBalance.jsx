'use client';
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
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  LinearProgress,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
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
import {
  PeriodPdfHeader,
  PDF_PAGE_STYLE,
  PeriodPdfRow,
  hasNetBalance,
  hasPeriodActivity,
  pruneZeroNetTree,
  periodSubtitle,
} from '../periodColumns';
import TrialBalanceGroupedOnScreen from './TrialBalanceGroupedOnScreen';
import TrialBalanceOnScreen from './TrialBalanceOnScreen';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

// Grouped tree -> indented rows, as on screen and in the Balance Sheet PDF:
// a group row, then its sub-groups, then its own ledgers.
const flattenGroupsForPdf = (groups, level = 0) =>
  groups.flatMap((group) => [
    { label: group.name, node: group, level, isGroup: true },
    ...flattenGroupsForPdf(group.children ?? [], level + 1),
    ...(group.ledgers ?? []).map((ledger) => ({
      label: ledger.name,
      node: ledger,
      level: level + 1,
      isGroup: false,
    })),
  ]);

const ReportDocumet = ({
  reportData,
  authOrganization,
  user,
  grouped,
  netOnly,
  closingOnly,
  dictionary,
}) => {
  const t = dictionary.reports.accountsReports;
  const mainColor =
    authOrganization.organization.settings?.main_color || '#2113AD';
  const lightColor =
    authOrganization.organization.settings?.light_color || '#bec5da';
  const contrastText =
    authOrganization.organization.settings?.contrast_text || '#FFFFFF';
  const reportPeriod = periodSubtitle(
    reportData.filters,
    readableDate,
    t.common
  );
  const costCenters = reportData.filters.cost_centers;

  return reportData ? (
    <Document
      creator={` ${user.name} | Powered By ProsERP`}
      producer='ProsERP'
      title={`${t.trialBalance.title} ${reportPeriod}`}
    >
      <Page size='A4' orientation={closingOnly ? 'portrait' : 'landscape'} style={PDF_PAGE_STYLE}>
        <View style={pdfStyles.table}>
          <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
            <View style={{ flex: 1, maxWidth: 120 }}>
              <PdfLogo organization={authOrganization.organization} />
            </View>
            <View style={{ flex: 1, textAlign: 'right' }}>
              <Text
                style={{ ...pdfStyles.majorInfo, color: mainColor }}
              >
                {t.trialBalance.title}
              </Text>
              <Text style={{ ...pdfStyles.minInfo }}>{reportPeriod}</Text>
            </View>
          </View>
        </View>
        <View
          style={{ ...pdfStyles.tableRow, marginTop: 10, marginBottom: 10 }}
        >
          {Array.isArray(costCenters) && costCenters.length > 0 && (
            <View style={{ flex: 2, padding: 2 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
                {t.common.costCenters}
              </Text>
              <Text style={{ ...pdfStyles.minInfo }}>
                {costCenters
                  .map((cost_centers) => cost_centers.name)
                  .join(', ')}
              </Text>
            </View>
          )}
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              {t.common.printedBy}
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>{user.name}</Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              {t.common.printedOn}
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>
              {readableDate(undefined, true)}
            </Text>
          </View>
        </View>
        <View style={pdfStyles.table}>
          {grouped ? (
            <>
              <PeriodPdfHeader netOnly={netOnly} closingOnly={closingOnly}
                leading={[{ label: t.trialBalance.ledgerGroup, flex: 3.4 }]}
                labels={t.common}
                mainColor={mainColor}
                contrastText={contrastText}
              filters={reportData.filters}
              />
              {flattenGroupsForPdf(
                (netOnly
                  ? reportData.groups?.map((group) =>
                      pruneZeroNetTree(group, closingOnly)
                    )
                  : reportData.groups) ?? []
              ).map((row, index) => (
                <PeriodPdfRow netOnly={netOnly} closingOnly={closingOnly}
                  key={index}
                  leading={[
                    { text: row.label, flex: 3.4, indent: row.level },
                  ]}
                  node={row.node}
                  backgroundColor={
                    row.isGroup && row.level === 0 ? lightColor : '#FFFFFF'
                  }
                  bold={row.isGroup}
                />
              ))}
              <PeriodPdfRow netOnly={netOnly} closingOnly={closingOnly}
                leading={[{ text: t.common.total.toUpperCase(), flex: 3.4 }]}
                node={reportData.totals}
                backgroundColor={lightColor}
                bold
              />
            </>
          ) : (
            <>
              <PeriodPdfHeader netOnly={netOnly} closingOnly={closingOnly}
                leading={[
                  { label: t.common.serialNumber, flex: 0.4 },
                  { label: t.trialBalance.ledgerName, flex: 3 },
                ]}
                labels={t.common}
                mainColor={mainColor}
                contrastText={contrastText}
              filters={reportData.filters}
              />
              {reportData.ledgers
                .filter((ledger) =>
                  netOnly
                    ? hasNetBalance(ledger, closingOnly)
                    : hasPeriodActivity(ledger, closingOnly)
                )
                .map((ledger, index) => (
                  <PeriodPdfRow netOnly={netOnly} closingOnly={closingOnly}
                    key={index}
                    leading={[
                      { text: String(index + 1), flex: 0.4 },
                      { text: ledger.name, flex: 3 },
                    ]}
                    node={ledger}
                    backgroundColor={index % 2 === 0 ? '#FFFFFF' : lightColor}
                  />
                ))}
              <PeriodPdfRow netOnly={netOnly} closingOnly={closingOnly}
                leading={[
                  { text: '', flex: 0.4 },
                  { text: t.common.total.toUpperCase(), flex: 3 },
                ]}
                node={reportData.totals}
                backgroundColor={lightColor}
                bold
              />
            </>
          )}
        </View>
      </Page>
    </Document>
  ) : (
    ''
  );
};

function TrialBalance({ setOpenTrialBalanceDialog }) {
  const dictionary = useDictionary();
  document.title = dictionary.reports.accountsReports.trialBalance.title;
  const css = useProsERPStyles();
  const { enqueueSnackbar } = useSnackbar();
  const {
    authOrganization,
    authUser: { user },
    checkOrganizationPermission,
  } = useJumboAuth();
  const validationSchema = yup.object({
    from: yup
      .string()
      .required(dictionary.reports.accountsReports.common.fromDateRequired)
      .typeError(dictionary.reports.accountsReports.common.fromDateRequired),
    to: yup
      .string()
      .required(dictionary.reports.accountsReports.common.toDateRequired)
      .typeError(dictionary.reports.accountsReports.common.toDateRequired),
  });

  const { setValue, watch, handleSubmit } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      from: dayjs().startOf('year').toISOString(),
      to: dayjs().toISOString(),
      cost_center_ids: checkOrganizationPermission(PERMISSIONS.COST_CENTERS_ALL)
        ? 'all'
        : authOrganization?.costCenters.map((cost_center) => cost_center.id),
    },
  });

  const [isFetching, setisFetching] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [groupedReportData, setGroupedReportData] = useState(null);
  const [isDownloadingTemplate, setIsDownloadingTemplate] =
    React.useState(false);
  const [uploadFieldsKey, setUploadFieldsKey] = useState(0);
  const [showOnScreen, setShowOnScreen] = useState(true);
  const [viewMode, setViewMode] = useState('flat');
  const [netOnly, setNetOnly] = useState(true);
  const [closingOnly, setClosingOnly] = useState(true);

  //Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const downloadExcelTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      setUploadFieldsKey((prevKey) => prevKey + 1);

      // Get all current filter parameters
      const filters = {
        from: watch('from'),
        to: watch('to'),
        cost_center_ids: watch('cost_center_ids'),
        net_only: netOnly,
        closing_only: closingOnly,
      };

      // Pass all filters to the service
      const responseData =
        viewMode === 'grouped'
          ? await financialReportsServices.downloadExcelTrialBalanceGrouped(filters)
          : await financialReportsServices.downloadExcelTrialBalance(filters);

      const blob = new Blob([responseData], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Trial Balance ${viewMode === 'grouped' ? 'Grouped ' : ''}${readableDate(filters.from, true)} to ${readableDate(filters.to, true)}.xlsx`;
      link.click();
      setIsDownloadingTemplate(false);
    } catch (error) {
      enqueueSnackbar(
        dictionary.reports.accountsReports.common.excelDownloadError,
        { variant: 'error' }
      );
      setIsDownloadingTemplate(false);
    }
  };

  const retrieveReport = async (filters) => {
    setisFetching(true);
    const [report, groupedReport] = await Promise.all([
      financialReportsServices.trialBalance(filters),
      financialReportsServices.trialBalanceGrouped(filters),
    ]);

    setReportData(report);
    setGroupedReportData(groupedReport);
    setisFetching(false);
  };

  const downloadFileName = `Trial Balance${viewMode === 'grouped' ? ' Grouped' : ''} ${readableDate(watch('from'), true)} to ${readableDate(watch('to'), true)}`;

  return (
    <>
      <DialogTitle textAlign={'center'}>
        <Grid container>
          <Grid size={{ xs: 12 }} textAlign={'center'}>
            <Typography variant='h3'>
              {dictionary.reports.accountsReports.trialBalance.title}
            </Typography>
          </Grid>
          {belowLargeScreen && (
            <Tooltip title={dictionary.tooltips.close}>
              <IconButton
                size='small'
                sx={{ position: 'absolute', top: 10, right: 10 }}
                onClick={() => setOpenTrialBalanceDialog(false)}
              >
                <HighlightOff color='primary' />
              </IconButton>
            </Tooltip>
          )}
        </Grid>
        <Span className={css.hiddenOnPrint}>
          <form
            autoComplete='off'
            key={uploadFieldsKey}
            onSubmit={handleSubmit(retrieveReport)}
          >
            <Grid
              container
              columnSpacing={1}
              rowSpacing={1}
              alignItems='center'
              justifyContent='center'
            >
              <Grid size={{ xs: 12, lg: 6 }}>
                <CostCenterSelector
                  label={
                    dictionary.reports.accountsReports.trialBalance
                      .costCenterLabel
                  }
                  multiple={true}
                  // A user with CostCenters:All starts with nothing pre-selected —
                  // their report already defaults to unfiltered ('all', see
                  // defaultValues above), so pre-filling every cost center as a
                  // chip here only clutters the field (projects auto-create one
                  // each, so this can be dozens of chips) without changing what
                  // gets submitted. A restricted user's own accessible cost
                  // centers are the actual filter boundary, so those still need
                  // to show pre-selected.
                  defaultValue={
                    checkOrganizationPermission(PERMISSIONS.COST_CENTERS_ALL)
                      ? []
                      : authOrganization?.costCenters
                  }
                  allowSameType={true}
                  onChange={(cost_centers) => {
                    // Clearing back down to nothing must resubmit 'all' for a
                    // CostCenters:All user, not an empty array — the backend
                    // (resolveCostCenterIds) treats an empty array as "match no
                    // cost center" and would return a blank report.
                    setValue(
                      'cost_center_ids',
                      cost_centers.length === 0 &&
                        checkOrganizationPermission(PERMISSIONS.COST_CENTERS_ALL)
                        ? 'all'
                        : cost_centers.map((cost_center) => cost_center.id)
                    );
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <DateTimePicker
                    label={dictionary.reports.accountsReports.common.from}
                    defaultValue={dayjs().startOf('year')}
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
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <DateTimePicker
                    label={dictionary.reports.accountsReports.common.to}
                    defaultValue={dayjs()}
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
              <Grid size={{ xs: 12 }}>
                {/* Options and export buttons share a row; Filter sits below it on the right */}
                <Stack direction='column' spacing={1} useFlexGap>
                  <Stack
                    direction='row'
                    useFlexGap
                    flexWrap='wrap'
                    columnGap={1}
                    rowGap={0.5}
                    justifyContent='space-between'
                    alignItems='center'
                  >
                    <Stack
                      direction='row'
                      useFlexGap
                      flexWrap='wrap'
                      columnGap={1}
                      rowGap={0.5}
                      alignItems='center'
                    >
                      <FormControlLabel
                        control={
                          <Switch
                            size='small'
                            checked={netOnly}
                            onChange={(e) => setNetOnly(e.target.checked)}
                          />
                        }
                        label={dictionary.reports.accountsReports.common.netOnly}
                        sx={{ mr: 0.5 }}
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            size='small'
                            checked={closingOnly}
                            onChange={(e) => setClosingOnly(e.target.checked)}
                          />
                        }
                        label={dictionary.reports.accountsReports.common.closingOnly}
                        sx={{ mr: 0.5 }}
                      />
                      {reportData && (
                        <ToggleButtonGroup
                          size='small'
                          color='primary'
                          exclusive
                          value={viewMode}
                          onChange={(event, newViewMode) => {
                            if (newViewMode) setViewMode(newViewMode);
                          }}
                        >
                          <ToggleButton value='flat'>
                            {dictionary.reports.accountsReports.common.flat}
                          </ToggleButton>
                          <ToggleButton value='grouped'>
                            {dictionary.reports.accountsReports.common.grouped}
                          </ToggleButton>
                        </ToggleButtonGroup>
                      )}
                    </Stack>
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
                  </Stack>
                  <Stack direction='row' justifyContent='flex-end'>
                    <LoadingButton
                      loading={isFetching}
                      type='submit'
                      size='small'
                      variant='contained'
                    >
                      {dictionary.reports.accountsReports.common.filter}
                    </LoadingButton>
                  </Stack>
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
          reportData && (
            <>
              {showOnScreen ? (
                viewMode === 'grouped' ? (
                  <TrialBalanceGroupedOnScreen
                    reportData={groupedReportData}
                    authOrganization={authOrganization}
                    netOnly={netOnly}
                    closingOnly={closingOnly}
                  />
                ) : (
                  <TrialBalanceOnScreen
                    reportData={reportData}
                    authOrganization={authOrganization}
                    netOnly={netOnly}
                    closingOnly={closingOnly}
                  />
                )
              ) : (
                <PDFContent
                  document={
                    <ReportDocumet
                      reportData={
                        viewMode === 'grouped' ? groupedReportData : reportData
                      }
                      grouped={viewMode === 'grouped'}
                      netOnly={netOnly}
                      closingOnly={closingOnly}
                      authOrganization={authOrganization}
                      user={user}
                      dictionary={dictionary}
                    />
                  }
                  fileName={downloadFileName}
                />
              )}
            </>
          )
        )}
      </DialogContent>
    </>
  );
}

export default TrialBalance;
