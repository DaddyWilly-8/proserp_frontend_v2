'use client';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import useProsERPStyles from '@/app/helpers/style-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
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
import dayjs from 'dayjs';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import CostCenterSelector from '../../../masters/costCenters/CostCenterSelector';
import PDFContent from '../../../pdf/PDFContent';
import financialReportsServices from '../financial-reports-services';
import ApArAgingOnScreen from './ApArAgingOnScreen';
import ApArAgingPDF from './ApArAgingPDF';

function ApArAgingReport({ setOpenDialog }) {
  const css = useProsERPStyles();
  const {
    authOrganization,
    authUser: { user },
    checkOrganizationPermission,
  } = useJumboAuth();
  const [reportData, setReportData] = useState(null);
  const [selectedType, setSelectedType] = useState('payable');
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
  const [isFetching, setIsFetching] = useState(false);
  const [showOnScreen, setShowOnScreen] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { setValue, handleSubmit } = useForm({
    defaultValues: {
      as_at: dayjs().toISOString(),
    },
  });

  // reportData.group is the Accounts Receivable/Payable tree root (see
  // AgingReportService::generate) rather than a flat rows array — walk it
  // to tell whether there's anything to show/export.
  const hasAgingRows = (group) =>
    !!group &&
    ((group.ledgers?.length ?? 0) > 0 ||
      (group.children || []).some((child) => hasAgingRows(child)));

  const retrieveReport = async (filters) => {
    setIsFetching(true);
    try {
      const report = await financialReportsServices.apArAging({
        ...filters,
        type: selectedType,
        cost_center_ids: costCenterIds,
        only_stakeholder_linked: onlyStakeholderLinked,
      });
      setReportData(report);
    } finally {
      setIsFetching(false);
    }
  };

  const handlExcelExport = async () => {
    setIsExporting(true);
    try {
      const blob = await financialReportsServices.exportApArAgingToExcel({
        reportData,
        authOrganization,
        user,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedType === 'payable' ? 'A-P Aging Report' : 'A-R Aging Report'} ${readableDate(reportData?.filters?.as_at, true)}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  document.title = selectedType === 'payable' ? 'A/P Aging Report' : 'A/R Aging Report';

  return (
    <>
      <DialogTitle textAlign='center'>
        <Grid container>
          <Grid size={12} textAlign='center'>
            <Typography variant='h3'>
              {selectedType === 'payable' ? 'A/P Aging Report' : 'A/R Aging Report'}
            </Typography>
            {belowLargeScreen && (
              <Tooltip title='Close'>
                <IconButton
                  size='small'
                  sx={{ position: 'absolute', top: 10, right: 10 }}
                  onClick={() => setOpenDialog(false)}
                >
                  <HighlightOff color='primary' />
                </IconButton>
              </Tooltip>
            )}
          </Grid>
        </Grid>
        <Span className={css.hiddenOnPrint}>
          <form autoComplete='off' onSubmit={handleSubmit(retrieveReport)}>
            <Grid container columnSpacing={1} rowSpacing={1} alignItems='center' justifyContent='center'>
              <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <DateTimePicker
                    label='As at'
                    minDate={dayjs(authOrganization?.organization.recording_start_date)}
                    defaultValue={dayjs()}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    onChange={(newValue) => {
                      setValue('as_at', newValue ? newValue.toISOString() : null, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <FormControl fullWidth size='small'>
                    <InputLabel id='aging_type_select'>Type</InputLabel>
                    <Select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      label='Type'
                    >
                      <MenuItem value='payable'>Accounts Payable</MenuItem>
                      <MenuItem value='receivable'>Accounts Receivable</MenuItem>
                    </Select>
                  </FormControl>
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: 12, lg: 6 }}>
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
                    setCostCenterIds(ids);
                  }}
                />
              </Grid>
              <Grid size={12}>
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
              </Grid>
              <Grid size={12} textAlign='right'>
                <Stack direction='row' spacing={0.5} justifyContent='flex-end' alignItems='center'>
                  {reportData && hasAgingRows(reportData.group) && (
                    <FileExportGrid
                      exportExcel
                      handlExcelExport={handlExcelExport}
                      exportingExcel={isExporting}
                      exportPdf
                      handlePdf={() => {
                        setShowOnScreen((prev) => !prev);
                      }}
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
        ) : (
          reportData &&
          hasAgingRows(reportData.group) &&
          (showOnScreen ? (
            <ApArAgingOnScreen reportData={reportData} authOrganization={authOrganization} />
          ) : (
            <PDFContent
              fileName={`${selectedType === 'payable' ? 'A-P Aging Report' : 'A-R Aging Report'} ${readableDate(reportData?.filters?.as_at, true)}`}
              document={
                <ApArAgingPDF reportData={reportData} authOrganization={authOrganization} user={user} />
              }
            />
          ))
        )}
        {reportData && !hasAgingRows(reportData.group) && !isFetching && (
          <Typography textAlign='center' color='text.secondary' sx={{ mt: 3 }}>
            Nothing outstanding for the selected filters.
          </Typography>
        )}
      </DialogContent>
    </>
  );
}

export default ApArAgingReport;
