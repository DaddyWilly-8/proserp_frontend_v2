'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import PDFContent from '@/components/pdf/PDFContent';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import { CloseOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
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
import { useState } from 'react';
import { useSnackbar } from 'notistack';
import DepartmentSelector from '../../departments/DepartmentSelector';
import { DepartmentsProvider } from '../../departments/DepartmentsProvider';
import EmployeeSelector from '../../employees/EmployeeSelector';
import { EmployeesProvider } from '../../employees/EmployeesProvider';
import { Employee } from '../../employees/EmployeesType';
import { Department } from '../../departments/DepartmentsType';
import humanResourcesServices from '../../humanResourcesServices';
import StaffLoanReportDocument from './StaffLoanReportDocument';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const buildStatusOptions = (dictionary: any) => [
  { label: dictionary.humanResources.reports.staffLoans.statusOptions.all, value: '' },
  { label: dictionary.humanResources.reports.staffLoans.statusOptions.in_review, value: 'in_review' },
  { label: dictionary.humanResources.reports.staffLoans.statusOptions.approved, value: 'approved' },
  { label: dictionary.humanResources.reports.staffLoans.statusOptions.rejected, value: 'rejected' },
  { label: dictionary.humanResources.reports.staffLoans.statusOptions.cancelled, value: 'cancelled' },
];

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  in_review: 'warning',
  approved: 'success',
  rejected: 'error',
  cancelled: 'default',
};

type StaffLoanRow = {
  loan_id: number;
  employee_id: number;
  employee_number: string;
  employee_name: string;
  department: string | null;
  status: string;
  status_label: string;
  requested_at: string | null;
  amount_approved: number;
  installment_amount: number;
  disbursed: boolean;
  amount_recovered: number;
  outstanding_balance: number;
  fully_recovered: boolean;
};

type StaffLoansResponse = {
  rows: StaffLoanRow[];
  totals: {
    amount_approved: number;
    amount_recovered: number;
    outstanding_balance: number;
    count: number;
  };
};

type AppliedFilters = {
  employeeId: number | null;
  departmentId: number | null;
  status: string;
  onlyOutstanding: boolean;
};

const fmt = (value: number) =>
  Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function StaffLoanReportContent({ onClose }: { onClose?: () => void }) {
  const dictionary = useDictionary();
  const statusOptions = buildStatusOptions(dictionary);
  const { enqueueSnackbar } = useSnackbar();
  const { authOrganization, authUser } = useJumboAuth() as any;

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [onlyOutstanding, setOnlyOutstanding] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showOnScreen, setShowOnScreen] = useState(true);

  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({
    employeeId: null,
    departmentId: null,
    status: '',
    onlyOutstanding: false,
  });

  const { data, isFetching, isError, error } = useQuery<StaffLoansResponse>({
    queryKey: [
      'staff-loans-report',
      appliedFilters.employeeId,
      appliedFilters.departmentId,
      appliedFilters.status,
      appliedFilters.onlyOutstanding,
    ],
    queryFn: () =>
      humanResourcesServices.getStaffLoansReport({
        employee_id: appliedFilters.employeeId ?? undefined,
        department_id: appliedFilters.departmentId ?? undefined,
        status: appliedFilters.status || undefined,
        only_outstanding: appliedFilters.onlyOutstanding || undefined,
      }),
    staleTime: 30_000,
  });

  const handleFilter = () => {
    setAppliedFilters({
      employeeId: selectedEmployee?.id ?? null,
      departmentId: selectedDepartment?.id ?? null,
      status: selectedStatus,
      onlyOutstanding,
    });
  };

  const handleExcelExport = async () => {
    setIsExporting(true);
    try {
      const blob = await humanResourcesServices.exportStaffLoansReport({
        employee_id: appliedFilters.employeeId ?? undefined,
        department_id: appliedFilters.departmentId ?? undefined,
        status: appliedFilters.status || undefined,
        only_outstanding: appliedFilters.onlyOutstanding || undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Staff Loans Report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data?.message || dictionary.humanResources.reports.staffLoans.messages.exportError, { variant: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  const rows = data?.rows || [];
  const totals = data?.totals;

  const filtersLabel = [
    selectedEmployee ? `${dictionary.humanResources.reports.common.employee}: ${selectedEmployee.first_name} ${selectedEmployee.last_name}` : null,
    selectedDepartment ? `${dictionary.humanResources.reports.common.department}: ${selectedDepartment.name}` : null,
    selectedStatus ? `${dictionary.humanResources.reports.common.status}: ${statusOptions.find((o) => o.value === selectedStatus)?.label ?? ''}` : null,
    onlyOutstanding ? dictionary.humanResources.reports.staffLoans.onlyOutstanding : null,
  ]
    .filter(Boolean)
    .join(', ') || dictionary.humanResources.reports.staffLoans.allLoans;

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
            <Typography variant='h3'>{dictionary.humanResources.reports.staffLoans.title}</Typography>
            <Typography variant='body2' color='text.secondary'>
              {dictionary.humanResources.reports.staffLoans.subtitle}
            </Typography>
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
              label={dictionary.humanResources.reports.common.status}
              size='small'
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
              fullWidth
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }} sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={onlyOutstanding}
                  onChange={(event) => setOnlyOutstanding(event.target.checked)}
                />
              }
              label={dictionary.humanResources.reports.staffLoans.onlyOutstanding}
            />
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
            {(error as Error)?.message || dictionary.humanResources.reports.staffLoans.messages.loadError}
          </Alert>
        )}

        {!isFetching && rows.length === 0 && !isError && (
          <Alert severity='info'>{dictionary.humanResources.reports.staffLoans.messages.noRecords}</Alert>
        )}

        {rows.length > 0 && (
          <Box>
            {!showOnScreen ? (
              <PDFContent
                document={
                  <StaffLoanReportDocument
                    data={data as StaffLoansResponse}
                    organization={authOrganization?.organization}
                    userName={authUser?.user?.name || 'ProsERP'}
                    filtersLabel={filtersLabel}
                    dictionary={dictionary}
                  />
                }
                fileName='Staff Loans Report'
              />
            ) : (
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>{dictionary.humanResources.reports.common.employeeNo}</TableCell>
                      <TableCell>{dictionary.humanResources.reports.common.name}</TableCell>
                      <TableCell>{dictionary.humanResources.reports.common.department}</TableCell>
                      <TableCell>{dictionary.humanResources.reports.common.status}</TableCell>
                      <TableCell>{dictionary.humanResources.reports.staffLoans.columns.requested}</TableCell>
                      <TableCell align='right'>{dictionary.humanResources.reports.staffLoans.columns.amountApproved}</TableCell>
                      <TableCell align='right'>{dictionary.humanResources.reports.staffLoans.columns.installment}</TableCell>
                      <TableCell align='center'>{dictionary.humanResources.reports.staffLoans.columns.disbursed}</TableCell>
                      <TableCell align='right'>{dictionary.humanResources.reports.staffLoans.columns.recovered}</TableCell>
                      <TableCell align='right'>{dictionary.humanResources.reports.staffLoans.columns.outstanding}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.loan_id}>
                        <TableCell>{row.employee_number}</TableCell>
                        <TableCell>{row.employee_name}</TableCell>
                        <TableCell>{row.department || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            size='small'
                            label={row.status_label}
                            color={statusColors[row.status] || 'default'}
                          />
                          {row.fully_recovered && (
                            <Chip size='small' label={dictionary.humanResources.reports.staffLoans.fullyRecovered} color='success' variant='outlined' sx={{ ml: 0.5 }} />
                          )}
                        </TableCell>
                        <TableCell>{row.requested_at || '-'}</TableCell>
                        <TableCell align='right'>{fmt(row.amount_approved)}</TableCell>
                        <TableCell align='right'>{fmt(row.installment_amount)}</TableCell>
                        <TableCell align='center'>{row.disbursed ? dictionary.humanResources.reports.common.yes : dictionary.humanResources.reports.common.no}</TableCell>
                        <TableCell align='right'>{fmt(row.amount_recovered)}</TableCell>
                        <TableCell align='right'>{fmt(row.outstanding_balance)}</TableCell>
                      </TableRow>
                    ))}
                    {totals && (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ fontWeight: 700 }}>
                          {dictionary.humanResources.reports.common.totalWithCount.replace('{count}', String(totals.count))}
                        </TableCell>
                        <TableCell align='right' sx={{ fontWeight: 700 }}>
                          {fmt(totals.amount_approved)}
                        </TableCell>
                        <TableCell />
                        <TableCell />
                        <TableCell align='right' sx={{ fontWeight: 700 }}>
                          {fmt(totals.amount_recovered)}
                        </TableCell>
                        <TableCell align='right' sx={{ fontWeight: 700 }}>
                          {fmt(totals.outstanding_balance)}
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

export default function StaffLoanReport({ onClose }: { onClose?: () => void } = {}) {
  return (
    <EmployeesProvider>
      <DepartmentsProvider>
        <StaffLoanReportContent onClose={onClose} />
      </DepartmentsProvider>
    </EmployeesProvider>
  );
}
