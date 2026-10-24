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
  Checkbox,
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

const ReportDocumet = ({ reportData, authOrganization, user, netOnly }) => {
  const mainColor =
    authOrganization.organization.settings?.main_color || '#2113AD';
  const lightColor =
    authOrganization.organization.settings?.light_color || '#bec5da';
  const contrastText =
    authOrganization.organization.settings?.contrast_text || '#FFFFFF';
  const reportPeriod = periodSubtitle(reportData.filters, readableDate);
  const rawRootGroup = reportData.debtors || reportData.creditors;
  const rootGroup =
    rawRootGroup && netOnly ? pruneZeroNetTree(rawRootGroup) : rawRootGroup;
  const rows = rootGroup ? flattenGroupTree(rootGroup, 0) : [];

  return reportData ? (
    <Document
      creator={` ${user.name} | Powered By ProsERP`}
      producer='ProsERP'
      title={reportData.debtors ? `Debtors Report` : `Creditors Report`}
    >
      <Page size='A4' orientation='landscape' style={PDF_PAGE_STYLE}>
        <View style={pdfStyles.table}>
          <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
            <View style={{ flex: 1, maxWidth: 120 }}>
              <PdfLogo organization={authOrganization.organization} />
            </View>
            <View style={{ flex: 1, textAlign: 'right' }}>
              <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>
                {reportData.debtors ? `Debtors Report` : `Creditors Report`}
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
                Cost Centers
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
        <View style={{ ...pdfStyles.table, minHeight: 230 }}>
          <PeriodPdfHeader netOnly={netOnly}
            leading={[{ label: 'Name', flex: 3 }]}
            mainColor={mainColor}
            contrastText={contrastText}
          filters={reportData.filters}
          />
          {rows.map((row, index) => (
            <PeriodPdfRow netOnly={netOnly}
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
          <PeriodPdfRow netOnly={netOnly}
            leading={[{ text: 'Total', flex: 3 }]}
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
  const [uploadFieldsKey, setUploadFieldsKey] = useState(0);

  const [isExporting, setIsExporting] = useState(false);

  //Screen handling constants
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

  document.title = `${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Report`;

  const downloadFileName = `${reportData?.debtors ? 'Debtors Report' : 'Creditors Report'} ${readableDate(reportData?.filters?.from)} to ${readableDate(reportData?.filters?.to)}`;

  return (
    <>
      <DialogTitle textAlign={'center'}>
        <Grid container>
          <Grid size={12} textAlign={'center'}>
            <Typography variant='h3'>
              {selectedType === 'debtors'
                ? 'Debtors Report'
                : 'Creditors Report'}
            </Typography>
            {belowLargeScreen && (
              <Tooltip title='Close'>
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
                    label='Type'
                    align={'left'}
                  >
                    <InputLabel id='type_select'>Type</InputLabel>
                    <Select
                      value={selectedType}
                      onChange={(e) => {
                        setSelectedType(e.target.value);
                      }}
                      label='Type'
                    >
                      <MenuItem value='creditors'>Creditors</MenuItem>
                      <MenuItem value='debtors'>Debtors</MenuItem>
                    </Select>
                  </FormControl>
                </Div>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Div>
                  <DateTimePicker
                    label='From'
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
                    label='To'
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
                  label='Cost Centers (leave empty for all)'
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
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack direction='row' flexWrap='wrap' columnGap={2}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={onlyStakeholderLinked}
                        onChange={(e) =>
                          setOnlyStakeholderLinked(e.target.checked)
                        }
                      />
                    }
                    label='Stakeholders Only'
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={includeZeroBalances}
                        onChange={(e) =>
                          setIncludeZeroBalances(e.target.checked)
                        }
                      />
                    }
                    label='Show Zero Balances'
                  />
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }} textAlign='right'>
                <Stack
                  direction='row'
                  spacing={0.5}
                  justifyContent={{ xs: 'center', md: 'flex-end' }}
                  flexWrap='wrap'
                  rowGap={0.5}
                  alignItems='center'
                >
                  <>
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
          (reportData.debtors || reportData.creditors) && (
            <>
              {showOnScreen ? (
                <DebtorCreditorOnScreen
                  reportData={reportData}
                  authOrganization={authOrganization}
                  user={user}
                  netOnly={netOnly}
                />
              ) : (
                <PDFContent
                  document={
                    <ReportDocumet
                      reportData={reportData}
                      authOrganization={authOrganization}
                      user={user}
                      netOnly={netOnly}
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
