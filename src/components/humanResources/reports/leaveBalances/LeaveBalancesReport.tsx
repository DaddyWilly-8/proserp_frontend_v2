'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import PDFContent from '@/components/pdf/PDFContent';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import { CloseOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
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
import { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import DepartmentSelector from '../../departments/DepartmentSelector';
import { DepartmentsProvider } from '../../departments/DepartmentsProvider';
import EmployeeSelector from '../../employees/EmployeeSelector';
import { EmployeesProvider } from '../../employees/EmployeesProvider';
import { Employee } from '../../employees/EmployeesType';
import { Department } from '../../departments/DepartmentsType';
import humanResourcesServices from '../../humanResourcesServices';
import LeaveBalancesReportDocument from './LeaveBalancesReportDocument';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

type LeaveBalanceRow = {
  employee_id: number;
  employee_number: string;
  employee_name: string;
  department: string | null;
  leave_type: string | null;
  allocated_days: number;
  used_days: number;
  remaining_days: number;
};

type LeaveBalancesResponse = {
  year: number;
  rows: LeaveBalanceRow[];
  totals: {
    allocated_days: number;
    used_days: number;
    remaining_days: number;
    count: number;
  };
};

type LeaveTypeOption = { id: number; name: string };

type AppliedFilters = {
  year: number;
  employeeId: number | null;
  departmentId: number | null;
  leaveTypeId: number | null;
};

const fmt = (value: number) =>
  Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

function LeaveBalancesReportContent({ onClose }: { onClose?: () => void }) {
  const dictionary = useDictionary();
  const { enqueueSnackbar } = useSnackbar();
  const { authOrganization, authUser } = useJumboAuth() as any;
  const now = new Date();

  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState<number | ''>('');
  const [isExporting, setIsExporting] = useState(false);
  const [showOnScreen, setShowOnScreen] = useState(true);

  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({
    year: now.getFullYear(),
    employeeId: null,
    departmentId: null,
    leaveTypeId: null,
  });

  const { data: leaveTypes } = useQuery<LeaveTypeOption[]>({
    queryKey: ['all-leave-types-for-report'],
    queryFn: async () => {
      const response = await humanResourcesServices.getAllLeaveTypes();
      return response?.data || response || [];
    },
    staleTime: 5 * 60_000,
  });

  const { data, isFetching, isError, error } = useQuery<LeaveBalancesResponse>({
    queryKey: [
      'leave-balances-report',
      appliedFilters.year,
      appliedFilters.employeeId,
      appliedFilters.departmentId,
      appliedFilters.leaveTypeId,
    ],
    queryFn: () =>
      humanResourcesServices.getLeaveBalancesReport({
        year: appliedFilters.year,
        employee_id: appliedFilters.employeeId ?? undefined,
        department_id: appliedFilters.departmentId ?? undefined,
        leave_type_id: appliedFilters.leaveTypeId ?? undefined,
      }),
    staleTime: 30_000,
  });

  useEffect(() => {
    setAppliedFilters({
      year: now.getFullYear(),
      employeeId: null,
      departmentId: null,
      leaveTypeId: null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = () => {
    setAppliedFilters({
      year: selectedYear,
      employeeId: selectedEmployee?.id ?? null,
      departmentId: selectedDepartment?.id ?? null,
      leaveTypeId: selectedLeaveTypeId === '' ? null : Number(selectedLeaveTypeId),
    });
  };

  const handleExcelExport = async () => {
    setIsExporting(true);
    try {
      const blob = await humanResourcesServices.exportLeaveBalancesReport({
        year: appliedFilters.year,
        employee_id: appliedFilters.employeeId ?? undefined,
        department_id: appliedFilters.departmentId ?? undefined,
        leave_type_id: appliedFilters.leaveTypeId ?? undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Leave Balances - ${appliedFilters.year}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data?.message || dictionary.humanResources.reports.leaveBalances.messages.exportError, { variant: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  const yearOptions = Array.from({ length: 5 }, (_, index) => now.getFullYear() - index);
  const rows = data?.rows || [];
  const totals = data?.totals;

  const filtersLabel = [
    selectedEmployee ? `${dictionary.humanResources.reports.common.employee}: ${selectedEmployee.first_name} ${selectedEmployee.last_name}` : null,
    selectedDepartment ? `${dictionary.humanResources.reports.common.department}: ${selectedDepartment.name}` : null,
    selectedLeaveTypeId !== '' ? `${dictionary.humanResources.reports.common.leaveType}: ${leaveTypes?.find((lt) => lt.id === selectedLeaveTypeId)?.name ?? ''}` : null,
  ]
    .filter(Boolean)
    .join(', ') || dictionary.humanResources.reports.leaveBalances.allEmployees;

  return (
    <>
      <DialogTitle sx={{ pb: 1 }}>
        {onClose && (
          <Tooltip title={dictionary.tooltips.close}>
            <IconButton
              onClick={() => onClose()}
              sx={{ position: 'absolute', right: 12, top: 12 }}
            >
              <CloseOutlined />
            </IconButton>
          </Tooltip>
        )}
        <Grid container spacing={1.5} alignItems='center'>
          <Grid size={{ xs: 12 }} textAlign='center' marginBottom={2} sx={onClose ? { px: 4 } : undefined}>
            <Typography variant='h3'>{dictionary.humanResources.reports.leaveBalances.title}</Typography>
            <Typography variant='body2' color='text.secondary'>
              {dictionary.humanResources.reports.leaveBalances.subtitle.replace('{year}', String(appliedFilters.year))}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              select
              label={dictionary.humanResources.reports.common.year}
              size='small'
              value={selectedYear}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
              fullWidth
            >
              {yearOptions.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <EmployeeSelector
              label={dictionary.humanResources.reports.common.employee}
              value={selectedEmployee}
              onChange={(value) => setSelectedEmployee(Array.isArray(value) ? null : value)}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <DepartmentSelector
              label={dictionary.humanResources.reports.common.department}
              value={selectedDepartment}
              onChange={(value) => setSelectedDepartment(Array.isArray(value) ? null : value)}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              select
              label={dictionary.humanResources.reports.common.leaveType}
              size='small'
              value={selectedLeaveTypeId}
              onChange={(event) =>
                setSelectedLeaveTypeId(event.target.value === '' ? '' : Number(event.target.value))
              }
              fullWidth
            >
              <MenuItem value=''>{dictionary.humanResources.reports.leaveBalances.allLeaveTypes}</MenuItem>
              {(leaveTypes || []).map((leaveType) => (
                <MenuItem key={leaveType.id} value={leaveType.id}>
                  {leaveType.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid
            size={{ xs: 12 }}
            sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, alignItems: 'center', gap: 1 }}
          >
            <Button variant='contained' size='small' onClick={handleFilter}>
              {dictionary.humanResources.reports.common.filter}
            </Button>
            <FileExportGrid
              exportExcel
              handlExcelExport={handleExcelExport}
              exportingExcel={isExporting}
              exportPdf
              handlePdf={() => setShowOnScreen((prev) => !prev)}
            />
          </Grid>
        </Grid>
      </DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
        {isFetching && <LinearProgress sx={{ mb: 2 }} />}

        {isError && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {(error as Error)?.message || dictionary.humanResources.reports.leaveBalances.messages.loadError}
          </Alert>
        )}

        {!isFetching && rows.length === 0 && !isError && (
          <Alert severity='info'>{dictionary.humanResources.reports.leaveBalances.messages.noRecords}</Alert>
        )}

        {rows.length > 0 && (
          <Box>
            {!showOnScreen ? (
              <PDFContent
                document={
                  <LeaveBalancesReportDocument
                    data={data as LeaveBalancesResponse}
                    organization={authOrganization?.organization}
                    userName={authUser?.user?.name || 'ProsERP'}
                    filtersLabel={filtersLabel}
                    dictionary={dictionary}
                  />
                }
                fileName={`Leave Balances - ${appliedFilters.year}`}
              />
            ) : (
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>{dictionary.humanResources.reports.common.employeeNo}</TableCell>
                      <TableCell>{dictionary.humanResources.reports.common.name}</TableCell>
                      <TableCell>{dictionary.humanResources.reports.common.department}</TableCell>
                      <TableCell>{dictionary.humanResources.reports.common.leaveType}</TableCell>
                      <TableCell align='right'>{dictionary.humanResources.reports.leaveBalances.columns.allocated}</TableCell>
                      <TableCell align='right'>{dictionary.humanResources.reports.leaveBalances.columns.used}</TableCell>
                      <TableCell align='right'>{dictionary.humanResources.reports.leaveBalances.columns.remaining}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row, index) => (
                      <TableRow key={`${row.employee_id}-${row.leave_type}-${index}`}>
                        <TableCell>{row.employee_number}</TableCell>
                        <TableCell>{row.employee_name}</TableCell>
                        <TableCell>{row.department || '-'}</TableCell>
                        <TableCell>{row.leave_type || '-'}</TableCell>
                        <TableCell align='right'>{fmt(row.allocated_days)}</TableCell>
                        <TableCell align='right'>{fmt(row.used_days)}</TableCell>
                        <TableCell align='right'>{fmt(row.remaining_days)}</TableCell>
                      </TableRow>
                    ))}
                    {totals && (
                      <TableRow>
                        <TableCell colSpan={4} sx={{ fontWeight: 700 }}>
                          {dictionary.humanResources.reports.common.total}
                        </TableCell>
                        <TableCell align='right' sx={{ fontWeight: 700 }}>
                          {fmt(totals.allocated_days)}
                        </TableCell>
                        <TableCell align='right' sx={{ fontWeight: 700 }}>
                          {fmt(totals.used_days)}
                        </TableCell>
                        <TableCell align='right' sx={{ fontWeight: 700 }}>
                          {fmt(totals.remaining_days)}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </DialogContent>
      {onClose && (
        <DialogActions>
          <Button sx={{ m: 1 }} size='small' variant='outlined' onClick={() => onClose()}>
            {dictionary.humanResources.reports.common.close}
          </Button>
        </DialogActions>
      )}
    </>
  );
}

export default function LeaveBalancesReport({ onClose }: { onClose?: () => void } = {}) {
  return (
    <EmployeesProvider>
      <DepartmentsProvider>
        <LeaveBalancesReportContent onClose={onClose} />
      </DepartmentsProvider>
    </EmployeesProvider>
  );
}
