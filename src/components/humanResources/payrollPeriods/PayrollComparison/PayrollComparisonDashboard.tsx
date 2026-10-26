'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import PDFContent from '@/components/pdf/PDFContent';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import { ArrowDownward, ArrowUpward, CloseOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  LinearProgress,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useMemo, useState } from 'react';
import humanResourcesServices from '../../humanResourcesServices';
import PayrollComparisonReportDocument from './PayrollComparisonReportDocument';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const MONTH_KEYS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];

type Metric = {
  period_a: number;
  period_b: number;
  diff: number;
  pct_change: number | null;
};

type GroupDiffItem = Metric & {
  type_id: number | null;
  type_name: string;
  employee_count_a: number;
  employee_count_b: number;
};

type ComparisonResponse = {
  period_a?: { summary?: { period?: string } };
  period_b?: { summary?: { period?: string } };
  comparison?: {
    total_employees?: Metric;
    total_employer_cost?: Metric;
    basic_salary?: Metric;
    gross_salary?: Metric;
    net_salary?: Metric;
    employer_contributions_total?: Metric;
    allowances?: GroupDiffItem[];
    deductions?: GroupDiffItem[];
    employer_contributions?: GroupDiffItem[];
  };
};

type AppliedFilters = {
  periodAYear: number;
  periodAMonth: number;
  periodBYear: number;
  periodBMonth: number;
  costCenterIds: number[];
};

const money = (value?: number) =>
  Number(value ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const DiffCell = ({ diff, pctChange }: { diff: number; pctChange: number | null }) => {
  if (diff === 0) {
    return <Typography color='text.secondary'>—</Typography>;
  }

  const isUp = diff > 0;

  return (
    <Chip
      size='small'
      variant='outlined'
      color={isUp ? 'warning' : 'success'}
      icon={isUp ? <ArrowUpward fontSize='small' /> : <ArrowDownward fontSize='small' />}
      label={`${money(Math.abs(diff))}${pctChange !== null ? ` (${Math.abs(pctChange)}%)` : ''}`}
    />
  );
};

const MetricRow = ({
  label,
  metric,
}: {
  label: string;
  metric?: Metric;
}) => {
  if (!metric) return null;

  return (
    <TableRow>
      <TableCell>{label}</TableCell>
      <TableCell align='right'>{money(metric.period_a)}</TableCell>
      <TableCell align='right'>{money(metric.period_b)}</TableCell>
      <TableCell align='right'>
        <DiffCell diff={metric.diff} pctChange={metric.pct_change} />
      </TableCell>
    </TableRow>
  );
};

const GroupTable = ({
  title,
  rows,
  periodALabel,
  periodBLabel,
}: {
  title: string;
  rows?: GroupDiffItem[];
  periodALabel: string;
  periodBLabel: string;
}) => {
  const dictionary = useDictionary();
  const t = dictionary.humanResources.payrollPeriods;
  if (!rows || rows.length === 0) return null;

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant='h6' mb={1}>
        {title}
      </Typography>
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell>{t.comparison.type}</TableCell>
              <TableCell align='right'>{periodALabel}</TableCell>
              <TableCell align='right'>{periodBLabel}</TableCell>
              <TableCell align='right'>{t.comparison.difference}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={`${title}-${row.type_id ?? row.type_name}`}>
                <TableCell>{row.type_name}</TableCell>
                <TableCell align='right'>{money(row.period_a)}</TableCell>
                <TableCell align='right'>{money(row.period_b)}</TableCell>
                <TableCell align='right'>
                  <DiffCell diff={row.diff} pctChange={row.pct_change} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default function PayrollComparisonDashboard({ onClose }: { onClose?: () => void } = {}) {
  const dictionary = useDictionary();
  const t = dictionary.humanResources.payrollPeriods;
  const monthNames = MONTH_KEYS.map((key) => t.common.months[key]);
  const { authOrganization, authUser } = useJumboAuth() as any;
  const { enqueueSnackbar } = useSnackbar();
  const now = new Date();
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [periodAYear, setPeriodAYear] = useState(lastMonthDate.getFullYear());
  const [periodAMonth, setPeriodAMonth] = useState(lastMonthDate.getMonth() + 1);
  const [periodBYear, setPeriodBYear] = useState(now.getFullYear());
  const [periodBMonth, setPeriodBMonth] = useState(now.getMonth() + 1);
  const [selectedCostCenters, setSelectedCostCenters] = useState<CostCenter[]>([]);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [showOnScreen, setShowOnScreen] = useState(true);

  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({
    periodAYear: lastMonthDate.getFullYear(),
    periodAMonth: lastMonthDate.getMonth() + 1,
    periodBYear: now.getFullYear(),
    periodBMonth: now.getMonth() + 1,
    costCenterIds: [],
  });

  const costCenterIds = useMemo(
    () => selectedCostCenters.map((costCenter) => costCenter.id),
    [selectedCostCenters]
  );

  const { data, isFetching, isError, error } = useQuery<ComparisonResponse>({
    queryKey: [
      'payroll-comparison',
      appliedFilters.periodAYear,
      appliedFilters.periodAMonth,
      appliedFilters.periodBYear,
      appliedFilters.periodBMonth,
      appliedFilters.costCenterIds.join(','),
    ],
    queryFn: async () => {
      return humanResourcesServices.getPayrollComparison({
        period_a_year: appliedFilters.periodAYear,
        period_a_month: appliedFilters.periodAMonth,
        period_b_year: appliedFilters.periodBYear,
        period_b_month: appliedFilters.periodBMonth,
        ...(appliedFilters.costCenterIds.length
          ? { cost_center_ids: appliedFilters.costCenterIds }
          : {}),
      });
    },
    enabled: true,
    staleTime: 60_000,
  });

  const handleFilter = () => {
    setAppliedFilters({
      periodAYear,
      periodAMonth,
      periodBYear,
      periodBMonth,
      costCenterIds,
    });
  };

  const handleExcelExport = async () => {
    setIsExportingExcel(true);
    try {
      const blob = await humanResourcesServices.exportPayrollComparisonExcel({
        period_a_year: appliedFilters.periodAYear,
        period_a_month: appliedFilters.periodAMonth,
        period_b_year: appliedFilters.periodBYear,
        period_b_month: appliedFilters.periodBMonth,
        ...(appliedFilters.costCenterIds.length
          ? { cost_center_ids: appliedFilters.costCenterIds }
          : {}),
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Payroll Comparison.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data?.message || t.comparison.errors.exportFailed, {
        variant: 'error',
      });
    } finally {
      setIsExportingExcel(false);
    }
  };

  const yearOptions = Array.from({ length: 6 }, (_, index) => now.getFullYear() - index);
  const monthOptions = monthNames.map((name, index) => ({ value: index + 1, label: name }));

  const periodALabel =
    data?.period_a?.summary?.period ||
    `${monthNames[appliedFilters.periodAMonth - 1]} ${appliedFilters.periodAYear}`;
  const periodBLabel =
    data?.period_b?.summary?.period ||
    `${monthNames[appliedFilters.periodBMonth - 1]} ${appliedFilters.periodBYear}`;

  const comparison = data?.comparison;

  return (
    <>
      <DialogTitle sx={{ pb: 1 }}>
        {onClose && (
          <Tooltip title={dictionary.tooltips.close}>
            <IconButton onClick={() => onClose()} sx={{ position: 'absolute', right: 12, top: 12 }}>
              <CloseOutlined />
            </IconButton>
          </Tooltip>
        )}
        <Grid container spacing={1.5} alignItems='center'>
          <Grid size={{ xs: 12, md: 12 }} textAlign='center' marginBottom={2} sx={onClose ? { px: 4 } : undefined}>
            <Typography variant='h3'>{t.comparison.title}</Typography>
            <Typography variant='body2' color='text.secondary'>
              {t.comparison.vs
                .replace('{a}', periodALabel)
                .replace('{b}', periodBLabel)}
            </Typography>
          </Grid>

          <Grid size={{ xs: 6, md: 3 }}>
            <TextField
              select
              label={t.comparison.periodAYear}
              size='small'
              value={periodAYear}
              onChange={(event) => setPeriodAYear(Number(event.target.value))}
              fullWidth
            >
              {yearOptions.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 6, md: 3 }}>
            <TextField
              select
              label={t.comparison.periodAMonth}
              size='small'
              value={periodAMonth}
              onChange={(event) => setPeriodAMonth(Number(event.target.value))}
              fullWidth
            >
              {monthOptions.map((month) => (
                <MenuItem key={month.value} value={month.value}>
                  {month.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 6, md: 3 }}>
            <TextField
              select
              label={t.comparison.periodBYear}
              size='small'
              value={periodBYear}
              onChange={(event) => setPeriodBYear(Number(event.target.value))}
              fullWidth
            >
              {yearOptions.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 6, md: 3 }}>
            <TextField
              select
              label={t.comparison.periodBMonth}
              size='small'
              value={periodBMonth}
              onChange={(event) => setPeriodBMonth(Number(event.target.value))}
              fullWidth
            >
              {monthOptions.map((month) => (
                <MenuItem key={month.value} value={month.value}>
                  {month.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <CostCenterSelector
              multiple
              allowSameType={true}
              label={t.comparison.costCenters}
              defaultValue={selectedCostCenters}
              onChange={(value) => {
                setSelectedCostCenters(Array.isArray(value) ? value : []);
              }}
            />
          </Grid>

          <Grid
            size={{ xs: 12, md: 6 }}
            sx={{
              display: 'flex',
              justifyContent: { xs: 'flex-start', md: 'flex-end' },
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Button variant='contained' size='small' onClick={handleFilter}>
              {t.comparison.compare}
            </Button>
            <FileExportGrid
              exportExcel
              handlExcelExport={handleExcelExport}
              exportingExcel={isExportingExcel}
              exportPdf
              handlePdf={() => {
                setShowOnScreen((prev) => !prev);
              }}
            />
          </Grid>
        </Grid>
      </DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
        <Box>
          {isFetching && <LinearProgress sx={{ mb: 2 }} />}

          {isError && (
            <Alert severity='error' sx={{ mb: 2 }}>
              {(error as Error)?.message || t.comparison.errors.loadFailed}
            </Alert>
          )}

          {!isFetching && !data && !isError && (
            <Alert severity='info'>{t.comparison.noData}</Alert>
          )}

          {comparison && !showOnScreen && (
            <PDFContent
              document={
                <PayrollComparisonReportDocument
                  data={data!}
                  periodALabel={periodALabel}
                  periodBLabel={periodBLabel}
                  selectedCostCenters={selectedCostCenters.filter((cc) =>
                    appliedFilters.costCenterIds.includes(cc.id)
                  )}
                  organization={authOrganization?.organization}
                  userName={authUser?.user?.name || 'ProsERP'}
                  dictionary={dictionary}
                />
              }
              fileName={`Payroll Comparison ${periodALabel} vs ${periodBLabel}`}
            />
          )}

          {comparison && showOnScreen && (
            <Box>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t.comparison.metric}</TableCell>
                      <TableCell align='right'>{periodALabel}</TableCell>
                      <TableCell align='right'>{periodBLabel}</TableCell>
                      <TableCell align='right'>{t.comparison.difference}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <MetricRow label={t.comparison.totalEmployerCost} metric={comparison.total_employer_cost} />
                    <MetricRow label={t.comparison.basicSalary} metric={comparison.basic_salary} />
                    <MetricRow label={t.comparison.grossSalary} metric={comparison.gross_salary} />
                    <MetricRow label={t.comparison.netSalary} metric={comparison.net_salary} />
                    <MetricRow
                      label={t.comparison.employerContributionsTotal}
                      metric={comparison.employer_contributions_total}
                    />
                    <MetricRow label={t.comparison.totalEmployees} metric={comparison.total_employees} />
                  </TableBody>
                </Table>
              </TableContainer>

              <GroupTable
                title={t.comparison.allowances}
                rows={comparison.allowances}
                periodALabel={periodALabel}
                periodBLabel={periodBLabel}
              />
              <GroupTable
                title={t.comparison.deductions}
                rows={comparison.deductions}
                periodALabel={periodALabel}
                periodBLabel={periodBLabel}
              />
              <GroupTable
                title={t.comparison.employerContributions}
                rows={comparison.employer_contributions}
                periodALabel={periodALabel}
                periodBLabel={periodBLabel}
              />
            </Box>
          )}
        </Box>
      </DialogContent>
      {onClose && (
        <DialogActions>
          <Button sx={{ m: 1 }} size='small' variant='outlined' onClick={() => onClose()}>
            {t.common.close}
          </Button>
        </DialogActions>
      )}
    </>
  );
}
