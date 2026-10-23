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
  Grid,
  IconButton,
  Skeleton,
  Stack,
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
import TankStockReportPDF from './TankStockReportPDF';

const validationSchema = yup.object({
  fuel_station_id: yup
    .number()
    .required('Station is required')
    .typeError('Station is required'),
  from: yup.string().required('Start Date is required'),
  to: yup.string().required('End Date is required'),
});

function TankStockReport({ closeDialog }) {
  const { authUser, authOrganization } = useJumboAuth();
  const organization = authOrganization.organization;
  const css = useProsERPStyles();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { data: stations } = useQuery({
    queryKey: ['userStations', { userId: authUser?.user?.id }],
    queryFn: fuelStationServices.getUserStations,
  });

  const [activeStation, setActiveStation] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [filters, setFilters] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  document.title = 'Tank Stock Report';
  const downloadFileName = filters
    ? `Tank Stock Report ${readableDate(filters.from)}-${readableDate(filters.to)}`
    : 'Tank Stock Report';

  const {
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      from: dayjs().startOf('day').toISOString(),
      to: dayjs().endOf('day').toISOString(),
    },
  });

  const selectStation = (station) => {
    setActiveStation(station);
    setValue('fuel_station_id', station?.id ?? null, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  useEffect(() => {
    if (stations?.length === 1) selectStation(stations[0]);
  }, [stations]);

  const retrieveReport = async (formFilters) => {
    setIsFetching(true);
    try {
      const params = { ...formFilters, fuel_station_id: activeStation.id };
      const report = await fuelStationServices.tankStockReport(params);
      setReportData(report.report_data);
      setFilters(params);
    } finally {
      setIsFetching(false);
    }
  };

  const handleExcelExport = async () => {
    if (!filters) return;
    setIsExporting(true);
    try {
      const blob = await fuelStationServices.exportTankStockReportToExcel({
        reportData,
        activeStation,
        filters,
        organization,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${downloadFileName}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('error exporting file: ', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <DialogTitle textAlign='center'>
        <Stack
          direction='row'
          justifyContent='center'
          alignItems='center'
          position='relative'
        >
          <Typography variant='h3' textAlign='center'>
            Tank Stock Report
          </Typography>
          {belowLargeScreen && (
            <Tooltip title='Close'>
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
                  options={stations ?? []}
                  value={activeStation}
                  getOptionLabel={(option) => option.name}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label='Station'
                      error={!!errors?.fuel_station_id}
                      helperText={errors?.fuel_station_id?.message}
                    />
                  )}
                  onChange={(event, newValue) => selectStation(newValue)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <DateTimePicker
                    label='From (MM/DD/YYYY)'
                    defaultValue={dayjs().startOf('day')}
                    minDate={dayjs(organization.recording_start_date)}
                    ampm={false}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    onChange={(newValue) =>
                      setValue('from', newValue ? newValue.toISOString() : null, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <DateTimePicker
                    label='To (MM/DD/YYYY)'
                    defaultValue={dayjs().endOf('day')}
                    minDate={dayjs(organization.recording_start_date)}
                    ampm={false}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    onChange={(newValue) =>
                      setValue('to', newValue ? newValue.toISOString() : null, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                  />
                </Div>
              </Grid>
              <Grid
                size={12}
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  flexWrap: 'wrap',
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
                >
                  Filter
                </LoadingButton>
              </Grid>
            </Grid>
          </form>
        </Span>
      </DialogTitle>
      <DialogContent>
        {isFetching ? (
          <div style={{ width: '100%', padding: '16px' }}>
            <Skeleton variant='rectangular' width='100%' height={48} />
            <Skeleton variant='rectangular' width='100%' height={32} />
          </div>
        ) : reportData?.length > 0 ? (
          <PDFContent
            document={
              <TankStockReportPDF
                reportData={reportData}
                activeStation={activeStation}
                filters={filters}
                organization={organization}
              />
            }
            fileName={downloadFileName}
          />
        ) : (
          <Alert variant='outlined' severity='info'>
            {filters
              ? 'No tanks found for the selected station'
              : 'Please select filters and click "Filter" to generate the report'}
          </Alert>
        )}
      </DialogContent>
    </>
  );
}

export default TankStockReport;
