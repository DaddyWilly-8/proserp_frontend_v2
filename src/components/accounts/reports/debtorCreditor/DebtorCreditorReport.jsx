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
  Box,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Switch,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import CostCenterSelector from '../../../masters/costCenters/CostCenterSelector';
import pdfStyles from '../../../pdf/pdf-styles';
import PDFContent from '../../../pdf/PDFContent';
import PdfLogo from '../../../pdf/PdfLogo';
import financialReportsServices from '../financial-reports-services';
import {
  pruneZeroNetTree,
  PDF_PAGE_STYLE,
  PeriodPdfHeader,
  PeriodPdfRow,
  periodSubtitle,
} from '../periodColumns';
import DebtorCreditorOnScreen from './DebtorCreditorOnScreen';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

// Flattens the grouped debtors/creditors tree into indented rows, same
// shape the backend's TrialBalanceGroupedExport::flatten() produces for
// the Excel export — group rows first, then that group's ledgers, before
// moving to the next sibling.
const flattenGroupTree = (group, level, rows = []) => {
  rows.push({ name: group.name, node: group, level, isGroup: true });
  (group.children || []).forEach((child) => flattenGroupTree(child, level + 1, rows));
  (group.ledgers || []).forEach((ledger) =>
    rows.push({ name: ledger.name, node: ledger, level: level + 1, isGroup: false })
  );
  return rows;
};

const ReportDocumet = ({
  reportData,
  authOrganization,
  user,
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
  const rawRootGroup = reportData.debtors || reportData.creditors;
  const rootGroup =
    rawRootGroup && netOnly
      ? pruneZeroNetTree(rawRootGroup, closingOnly)
      : rawRootGroup;
  const rows = rootGroup ? flattenGroupTree(rootGroup, 0) : [];

  return reportData ? (
    <Document
      creator={` ${user.name} | Powered By ProsERP`}
      producer='ProsERP'
      title={
        reportData.debtors
          ? t.debtorCreditor.debtorsReport
          : t.debtorCreditor.creditorsReport
      }
    >
      <Page size='A4' orientation={closingOnly ? 'portrait' : 'landscape'} style={PDF_PAGE_STYLE}>
        <View style={pdfStyles.table}>
          <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
            <View style={{ flex: 1, maxWidth: 120 }}>
              <PdfLogo organization={authOrganization.organization} />
            </View>
            <View style={{ flex: 1, textAlign: 'right' }}>
              <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>
                {reportData.debtors
                  ? t.debtorCreditor.debtorsReport
                  : t.debtorCreditor.creditorsReport}
              </Text>
              <Text style={{ ...pdfStyles.minInfo }}>{reportPeriod}</Text>
            </View>
          </View>
        </View>
        <View
          style={{ ...pdfStyles.tableRow, marginTop: 10, marginBottom: 10 }}
        >
          {reportData.filters.cost_centers.length > 0 && (
            <View style={{ flex: 2, padding: 2 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
                {t.common.costCenters}
              </Text>
              <Text style={{ ...pdfStyles.minInfo }}>
                {reportData.filters.cost_centers
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
        <View style={{ ...pdfStyles.table, minHeight: 230 }}>
          <PeriodPdfHeader netOnly={netOnly} closingOnly={closingOnly}
            leading={[{ label: t.debtorCreditor.name, flex: 3 }]}
            labels={t.common}
            mainColor={mainColor}
            contrastText={contrastText}
          filters={reportData.filters}
          />
          {rows.map((row, index) => (
            <PeriodPdfRow netOnly={netOnly} closingOnly={closingOnly}
              key={index}
              leading={[
                { text: row.name, flex: 3, indent: row.level },
              ]}
              node={row.node}
              backgroundColor={
                row.isGroup ? lightColor : index % 2 === 0 ? '#FFFFFF' : lightColor
              }
              bold={row.isGroup}
            />
          ))}
          <PeriodPdfRow netOnly={netOnly} closingOnly={closingOnly}
            leading={[{ text: t.common.total, flex: 3 }]}
            node={reportData.total}
            backgroundColor={lightColor}
            bold
          />
        </View>
      </Page>
    </Document>
  ) : (
    ''
  );
};

function DebtorCreditorReport({ setOpenDebtorsCreditorsDialog }) {
  const dictionary = useDictionary();
  const css = useProsERPStyles();
  const {
    authOrganization,
    authUser: { user },
    checkOrganizationPermission,
  } = useJumboAuth();
  const [reportData, setReportData] = useState(null);
  const [selectedType, setSelectedType] = useState('creditors');
  const [showOnScreen, setShowOnScreen] = useState(true);
  // A CostCenters:All user who hasn't deliberately filtered sends the
  // literal 'all' sentinel, not every cost center id explicitly — otherwise
  // the backend sees a deliberate, exhaustive selection and the PDF/Excel
  // list every cost center by name instead of showing "All" (same
  // convention IncomeStatement.jsx uses).
  const [costCenterIds, setCostCenterIds] = useState(
    checkOrganizationPermission(PERMISSIONS.COST_CENTERS_ALL)
      ? 'all'
      : authOrganization?.costCenters.map((cost_center) => cost_center.id)
  );
  const [onlyStakeholderLinked, setOnlyStakeholderLinked] = useState(false);
  const [includeZeroBalances, setIncludeZeroBalances] = useState(false);
  const [netOnly, setNetOnly] = useState(true);
  const [closingOnly, setClosingOnly] = useState(true);
  const [uploadFieldsKey, setUploadFieldsKey] = useState(0);

  const [isExporting, setIsExporting] = useState(false);

  //Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

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

  const { setValue, handleSubmit, reset } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      from: dayjs().startOf('year').toISOString(),
      to: dayjs().toISOString(),
      cost_center_ids: authOrganization?.costCenters.map(
        (cost_center) => cost_center.id
      ),
    },
  });

  const [isFetching, setisFetching] = useState(false);
  const retrieveReport = async (filters) => {
    setisFetching(true);

    const finalFilters = {
      ...filters,
      cost_center_ids: costCenterIds,
      only_stakeholder_linked: onlyStakeholderLinked,
      include_zero_balances: includeZeroBalances,
    };

    const report =
      selectedType === 'debtors'
        ? await financialReportsServices.debtors(finalFilters)
        : await financialReportsServices.creditors(finalFilters);

    setReportData(report);
    setisFetching(false);
    reset();
  };

  const exportedData = {
    reportData: reportData,
    authOrganization: authOrganization,
    user: user,
    netOnly,
    closingOnly,
  };

  const handlExcelExport = async (exportedData) => {
    setIsExporting(true);
    try {
      const blob =
        await financialReportsServices.exportDebtorsOrCreditorsToExcel(
          exportedData
        );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportData?.debtors ? 'Debtors Report' : 'Creditors Report'} ${readableDate(reportData?.filters?.from, true)} to ${readableDate(reportData?.filters?.to, true)}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.log('error exporting: ', e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  document.title =
    selectedType === 'debtors'
      ? dictionary.reports.accountsReports.debtorCreditor.debtorsReport
      : dictionary.reports.accountsReports.debtorCreditor.creditorsReport;

  const downloadFileName = `${reportData?.debtors ? 'Debtors Report' : 'Creditors Report'} ${readableDate(reportData?.filters?.from)} to ${readableDate(reportData?.filters?.to)}`;

  return (
    <>
      <DialogTitle textAlign={'center'}>
        <Grid container>
          <Grid size={12} textAlign={'center'}>
            <Typography variant='h3'>
              {selectedType === 'debtors'
                ? dictionary.reports.accountsReports.debtorCreditor.debtorsReport
                : dictionary.reports.accountsReports.debtorCreditor.creditorsReport}
            </Typography>
            {belowLargeScreen && (
              <Tooltip title={dictionary.tooltips.close}>
                <IconButton
                  size='small'
                  sx={{ position: 'absolute', top: 10, right: 10 }}
                  onClick={() => setOpenDebtorsCreditorsDialog(false)}
                >
                  <HighlightOff color='primary' />
                </IconButton>
              </Tooltip>
            )}
          </Grid>
        </Grid>
        <Span className={css.hiddenOnPrint}>
          <form autoComplete='off' onSubmit={handleSubmit(retrieveReport)}>
            <Grid
              container
              columnSpacing={1}
              rowSpacing={1}
              key={uploadFieldsKey}
              alignItems='center'
              justifyContent='center'
              sx={{ mt: 1 }}
            >
              <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
                <Div>
                  <FormControl
                    fullWidth
                    size='small'
                    label={dictionary.reports.accountsReports.debtorCreditor.type}
                    align={'left'}
                  >
                    <InputLabel id='type_select'>
                      {dictionary.reports.accountsReports.debtorCreditor.type}
                    </InputLabel>
                    <Select
                      value={selectedType}
                      onChange={(e) => {
                        setSelectedType(e.target.value);
                      }}
                      label={
                        dictionary.reports.accountsReports.debtorCreditor.type
                      }
                    >
                      <MenuItem value='creditors'>
                        {dictionary.reports.accountsReports.debtorCreditor.creditors}
                      </MenuItem>
                      <MenuItem value='debtors'>
                        {dictionary.reports.accountsReports.debtorCreditor.debtors}
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Div>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Div>
                  <DateTimePicker
                    label={dictionary.reports.accountsReports.debtorCreditor.from}
                    minDate={dayjs(
                      authOrganization?.organization.recording_start_date
                    )}
                    defaultValue={dayjs().startOf('year')}
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
                <Div>
                  <DateTimePicker
                    label={dictionary.reports.accountsReports.debtorCreditor.to}
                    minDate={dayjs(
                      authOrganization?.organization.recording_start_date
                    )}
                    defaultValue={dayjs()}
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
              <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                <CostCenterSelector
                  label={
                    dictionary.reports.accountsReports.trialBalance
                      .costCenterLabel
                  }
                  multiple={true}
                  allowSameType={true}
                  // Declutters the field for a CostCenters:All user — projects
                  // auto-create a cost center each, so pre-filling every one as
                  // a chip can mean dozens of them for no filtering benefit.
                  // Restricted users still get their own (short, meaningful)
                  // accessible list pre-selected.
                  defaultValue={
                    checkOrganizationPermission(PERMISSIONS.COST_CENTERS_ALL)
                      ? []
                      : authOrganization?.costCenters
                  }
                  onChange={(cost_centers) => {
                    // Clearing back to nothing must resubmit 'all' for a
                    // CostCenters:All user (or their full accessible list
                    // otherwise) — an empty array matches zero cost centers
                    // server-side, not "every" one, and sending every id
                    // explicitly is read as a deliberate selection, not "All".
                    const ids =
                      cost_centers.length === 0
                        ? checkOrganizationPermission(
                            PERMISSIONS.COST_CENTERS_ALL
                          )
                          ? 'all'
                          : authOrganization?.costCenters.map(
                              (cost_center) => cost_center.id
                            )
                        : cost_centers.map((cost_center) => cost_center.id);
                    setCostCenterIds(ids); // Update the state with selected cost centers
                    setValue('cost_center_ids', ids);
                  }}
                />
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
                    {/* Grid keeps the switches aligned in columns across rows */}
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                        // Tablets (portrait included) have room for all four on one line.
                        // A top-level media query: raw media strings aren't valid keys
                        // inside a breakpoint object like { xs, md }.
                        '@media (min-width:700px)': {
                          gridTemplateColumns: 'repeat(4, auto)',
                        },
                        columnGap: 2,
                        alignItems: 'center',
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Switch
                            size='small'
                            checked={onlyStakeholderLinked}
                            onChange={(e) => setOnlyStakeholderLinked(e.target.checked)}
                          />
                        }
                        label={
                          dictionary.reports.accountsReports.debtorCreditor
                            .stakeholdersOnly
                        }
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            size='small'
                            checked={includeZeroBalances}
                            onChange={(e) => setIncludeZeroBalances(e.target.checked)}
                          />
                        }
                        label={
                          dictionary.reports.accountsReports.debtorCreditor
                            .showZeroBalances
                        }
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            size='small'
                            checked={netOnly}
                            onChange={(e) => setNetOnly(e.target.checked)}
                          />
                        }
                        label={dictionary.reports.accountsReports.common.netOnly}
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
                      />
                    </Box>
                    {reportData && (
                      <FileExportGrid
                        exportExcel
                        handlExcelExport={() => handlExcelExport(exportedData)}
                        exportingExcel={isExporting}
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
          reportData &&
          (reportData.debtors || reportData.creditors) && (
            <>
              {showOnScreen ? (
                <DebtorCreditorOnScreen
                  reportData={reportData}
                  authOrganization={authOrganization}
                  user={user}
                  netOnly={netOnly}
                  closingOnly={closingOnly}
                />
              ) : (
                <PDFContent
                  document={
                    <ReportDocumet
                      reportData={reportData}
                      authOrganization={authOrganization}
                      user={user}
                      netOnly={netOnly}
                      closingOnly={closingOnly}
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

export default DebtorCreditorReport;
