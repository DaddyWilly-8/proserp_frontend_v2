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
  Alert,
  Autocomplete,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  Skeleton,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import PDFContent from '../../../pdf/PDFContent';
import fuelStationServices from '../../fuelStationServices';
import DippingReportPDF from './DippingReportPDF';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

function DippingReport({ closeDialog }) {
  const dictionary = useDictionary();
  const t = dictionary.reports.fuelStationReports.dipping;
  const { authUser } = useJumboAuth();
  const { data: stations, isFetching: isFetchingStation } = useQuery({
    queryKey: ['userStations', { userId: authUser?.user?.id }],
    queryFn: fuelStationServices.getUserStations,
  });
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const [activeStation, setActiveStation] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  // Display-only: the cumulative figures (Cumulative Deviation / Stock
  // Deviation) are a running total since the station's first dipping, so a
  // single uncorrected historical gap keeps showing up on every report
  // indefinitely. This doesn't touch how anything is calculated, it only
  // controls whether those two columns render - the period-specific Opening/
  // Stock In/Stock Out/Closing/Tank Difference/Deviation figures are
  // unaffected either way.
  const [showCumulativeDeviation, setShowCumulativeDeviation] = useState(true);
  const [showCalculatedStock, setShowCalculatedStock] = useState(true);

  useEffect(() => {
    if (stations?.length === 1) {
      setActiveStation(stations[0]);
    }
  }, [stations]);

  document.title = t.title;
  const css = useProsERPStyles();
  const {
    authOrganization: { organization },
  } = useJumboAuth();
  const [reportData, setReportData] = useState(null);

  const [filters, setFilters] = useState({
    from: dayjs().startOf('day').toISOString(),
    to: dayjs().endOf('day').toISOString(),
    fuel_station_id: activeStation?.id,
    with_calculated_stock: 1,
  });

  useEffect(() => {
    if (activeStation) {
      setValue('fuel_station_id', activeStation?.id, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setFilters((prevFilters) => ({
        ...prevFilters,
        fuel_station_id: activeStation.id,
      }));
    }
  }, [activeStation]);

  const validationSchema = yup.object({
    fuel_station_id: yup
      .number()
      .required(t.stationRequired)
      .typeError(t.stationRequired),
    from: yup
      .string()
      .required(t.startDateRequired)
      .typeError(t.startDateRequired),
    to: yup
      .string()
      .required(t.endDateRequired)
      .typeError(t.endDateRequired),
  });

  const {
    setValue,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: filters,
  });

  const [isFetching, setisFetching] = useState(false);

  const retrieveReport = async (formFilters) => {
    setisFetching(true);
    const filtersWithStation = {
      ...formFilters,
      fuel_station_id: activeStation.id,
    };
    const report = await fuelStationServices.dippingReport(filtersWithStation);
    setReportData(report.report_data);
    setisFetching(false);
    setFilters(filtersWithStation); // Update the filters state after fetching the report
  };

  const downloadFileName = `Dipping Report ${readableDate(filters.from)}-${readableDate(filters.to)}`;

  const handleExcelExport = async () => {
    setIsExporting(true);
    setisFetching(true);
    const { from, to } = getValues();
    const filtersWithStation = {
      from,
      to,
      fuel_station_id: activeStation?.id,
      with_calculated_stock: 1,
    };
    const report = await fuelStationServices.dippingReport(filtersWithStation);
    if (!report.report_data?.length || !filtersWithStation) {
      setIsExporting(false);
      setisFetching(false);
      return;
    }
    try {
      const blob = await fuelStationServices.exportDippingReportToExcel({
        reportData: report.report_data,
        activeStation: activeStation,
        filters: filtersWithStation,
        organization: organization,
        showCumulativeDeviation: showCumulativeDeviation,
        showCalculatedStock: showCalculatedStock,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Dipping Report ${readableDate(from)}-${readableDate(to)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('error exporting file: ', e);
    } finally {
      setIsExporting(false);
      setisFetching(false);
    }
  };

  if (isFetchingStation) {
    return (
      <div style={{ width: '100%', padding: '16px' }}>
        <Skeleton
          variant='text'
          width={180}
          height={32}
          style={{ borderRadius: 4, marginLeft: 'auto' }}
        />
        <Skeleton
          variant='rectangular'
          width='100%'
          height={48}
          style={{ borderRadius: 4 }}
        />
        <Skeleton
          variant='rectangular'
          width='100%'
          height={32}
          style={{ borderRadius: 4 }}
        />
      </div>
    );
  }

  return (
    <>
      <DialogTitle textAlign={'center'}>
        <Stack
          direction='row'
          justifyContent='center'
          alignItems='center'
          position='relative'
        >
          <Typography variant='h3' textAlign={'center'}>{t.title}</Typography>
          {belowLargeScreen && (
            <Tooltip title={dictionary.tooltips.close}>
              <IconButton
                size='small'
                sx={{ position: 'absolute', right: 20, top: 0 }}
                onClick={() => closeDialog?.(false)}
              >
                <HighlightOff color='primary' />
              </IconButton>
            </Tooltip>
          )}
        </Stack>

        <Span className={css.hiddenOnPrint}>
          <form autoComplete='off' onSubmit={handleSubmit(retrieveReport)}>
            <Grid
              container
              columnSpacing={1}
              rowSpacing={1}
              alignItems='center'
              justifyContent='center'
            >
              <Grid size={{ xs: 12, md: 4 }}>
                <Autocomplete
                  size='small'
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  options={stations}
                  getOptionLabel={(option) => option.name}
                  defaultValue={stations?.length === 1 ? stations[0] : null}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t.station}
                      error={errors && !!errors?.fuel_station_id}
                      helperText={errors && errors.fuel_station_id?.message}
                    />
                  )}
                  onChange={(event, newValue) => {
                    if (newValue) {
                      setValue('fuel_station_id', newValue.id, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                      setActiveStation(newValue);
                    } else {
                      setValue('fuel_station_id', null, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                      setActiveStation(null);
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <DateTimePicker
                    label={t.fromDate}
                    defaultValue={dayjs().startOf('day')}
                    minDate={dayjs(organization.recording_start_date)}
                    ampm={false}
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
              <Grid size={{ xs: 12, md: 4 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <DateTimePicker
                    label={t.toDate}
                    defaultValue={dayjs().endOf('day')}
                    minDate={dayjs(organization.recording_start_date)}
                    ampm={false}
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
              <Grid
                size={12}
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'stretch', sm: 'center' },
                  justifyContent: 'space-between',
                  gap: 1,
                }}
              >
                <Div
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    flexWrap: 'wrap',
                    gap: { xs: 0, sm: 1 },
                  }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        size='small'
                        checked={showCumulativeDeviation}
                        onChange={(e) =>
                          setShowCumulativeDeviation(e.target.checked)
                        }
                      />
                    }
                    label={t.showCumulativeDeviation}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size='small'
                        checked={showCalculatedStock}
                        onChange={(e) =>
                          setShowCalculatedStock(e.target.checked)
                        }
                      />
                    }
                    label={t.showCalculatedStock}
                  />
                </Div>
                <Div
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: { xs: 'flex-end', sm: 'end' },
                    gap: 1,
                  }}
                >
                  <FileExportGrid
                    exportExcel
                    handlExcelExport={handleExcelExport}
                    exportingExcel={isExporting}
                  />
                  <LoadingButton
                    loading={isFetching}
                    type='submit'
                    size='small'
                    variant='contained'
                  >{t.filter}</LoadingButton>
                </Div>
              </Grid>
            </Grid>
          </form>
        </Span>
      </DialogTitle>
      <DialogContent>
        {isFetching ? (
          <div style={{ width: '100%', padding: '16px' }}>
            <Skeleton
              variant='text'
              width={180}
              height={32}
              style={{ borderRadius: 4, marginLeft: 'auto' }}
            />
            <Skeleton
              variant='rectangular'
              width='100%'
              height={48}
              style={{ borderRadius: 4 }}
            />
            <Skeleton
              variant='rectangular'
              width='100%'
              height={32}
              style={{ borderRadius: 4 }}
            />
          </div>
        ) : reportData && reportData?.length > 0 ? (
          <PDFContent
            // react-pdf's PDFViewer pushes prop changes through
            // pdfInstance.updateContainer(), which keeps content (text,
            // tables) in sync but doesn't reliably re-resolve page-level
            // attributes like Page's size/orientation on that update path -
            // only on first mount. That's why toggling these switches
            // changed the columns but not the page orientation. Keying both
            // the wrapper and (via documentKey) the inner PDFViewer forces a
            // real remount whenever either toggle changes, which does
            // re-resolve orientation correctly (verified in isolation:
            // @react-pdf/renderer itself produces the right MediaBox for
            // each orientation when freshly rendered).
            key={`${showCumulativeDeviation}-${showCalculatedStock}`}
            documentKey={`${showCumulativeDeviation}-${showCalculatedStock}`}
            document={
              <DippingReportPDF
                reportData={reportData}
                activeStation={activeStation}
                filters={filters}
                organization={organization}
                showCumulativeDeviation={showCumulativeDeviation}
                showCalculatedStock={showCalculatedStock}
                dictionary={dictionary}
              />
            }
            fileName={downloadFileName}
          />
        ) : (
          <Alert variant='outlined' severity='info'>{t.noRecords}</Alert>
        )}
      </DialogContent>
    </>
  );
}

export default DippingReport;
