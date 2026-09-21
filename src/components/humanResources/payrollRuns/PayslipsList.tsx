'use client';

import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import { VisibilityOutlined } from '@mui/icons-material';
import {
  Box,
  Card,
  Chip,
  Divider,
  IconButton,
  Stack,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useRef, useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import { formatMoney, getEmployeeName, processPayslips } from './payrollUtils';

interface PayslipsListProps {
  payrollRunId: number;
  runStatus: string;
  isPosted: boolean;
  onViewPayslip: (payslip: any) => void;
  // The run's full (processed) payslips — only used to notice when payments
  // change something so the (server-paginated) list can refetch.
  allPayslips: any[];
}

// Mirrors the payments table: outlined Paper, small size, bold header.
// Rendered as the list's container so the rows JumboList emits land in the
// <TableBody>; the list runs with disableTransition so they stay valid <tr>s.
const PayslipsTable = ({ children }: { children?: React.ReactNode }) => (
  <TableContainer
    component={Paper}
    variant='outlined'
    sx={{ mx: 2, my: 2, width: 'auto' }}
  >
    <Table size='small'>
      <TableHead>
        <TableRow>
          <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
          {['Basic', 'Allowances', 'Gross', 'Deductions', 'PAYE', 'Net Pay'].map(
            (label) => (
              <TableCell key={label} align='right' sx={{ fontWeight: 700 }}>
                {label}
              </TableCell>
            )
          )}
          <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
          <TableCell align='center' sx={{ fontWeight: 700 }}>
            Actions
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>{children}</TableBody>
    </Table>
  </TableContainer>
);

const usePayslipRow = (rawPayslip: any, runStatus: string, isPosted: boolean) => {
  const router = useRouter();
  const lang = useLanguage();
  const { checkOrganizationPermission } = useJumboAuth();
  const hasEmployeeRead = checkOrganizationPermission(
    PERMISSIONS.EMPLOYEES_READ
  );

  // Same net/gross/allowance/deduction calculations the payslip dialog and
  // salary sheets use, so a row can never disagree with the slip it opens.
  const payslip = useMemo(() => processPayslips([rawPayslip])[0], [rawPayslip]);

  const employee = payslip.employee || payslip;
  const netSalary = payslip.net_salary || 0;
  const paidAmount = payslip.paid_amount ?? 0;
  const balanceRemaining =
    payslip.balance_remaining ?? Math.max(0, netSalary - paidAmount);
  const isRowPaid = netSalary > 0 && balanceRemaining <= 0.01;
  const isRowPartiallyPaid = !isRowPaid && paidAmount > 0;
  // "partially_paid"/"paid" describe the RUN in aggregate — an untouched
  // employee on a run where others have been paid is not themselves
  // "Partially Paid," so that label is only trustworthy as a per-row
  // fallback when it isn't one of those two.
  const runStatusRaw = (runStatus || '').toLowerCase();
  const statusLabel = isRowPaid
    ? 'Paid'
    : isRowPartiallyPaid
      ? 'Partially Paid'
      : ['partially_paid', 'paid'].includes(runStatusRaw)
        ? 'Unpaid'
        : (runStatus || 'Approved')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());
  const statusColor = isRowPaid
    ? 'success'
    : isRowPartiallyPaid
      ? 'warning'
      : isPosted
        ? 'primary'
        : 'info';

  const canOpenEmployee = hasEmployeeRead && !!employee?.id && !employee?.deleted_at;
  const openEmployee = () => {
    if (canOpenEmployee) {
      router.push(`/${lang}/humanResources/employees/${employee.id}`);
    }
  };

  return {
    payslip,
    employee,
    statusLabel,
    statusColor: statusColor as 'success' | 'warning' | 'primary' | 'info',
    canOpenEmployee,
    openEmployee,
  };
};

const EmployeeIdentity = ({
  employee,
  canOpen,
  onOpen,
}: {
  employee: any;
  canOpen: boolean;
  onOpen: () => void;
}) => (
  <>
    <Typography
      variant='body2'
      fontWeight={600}
      noWrap
      onClick={onOpen}
      sx={
        canOpen
          ? {
              cursor: 'pointer',
              '&:hover': { color: 'primary.main', textDecoration: 'underline' },
            }
          : undefined
      }
    >
      {getEmployeeName(employee)}
    </Typography>
    <Stack direction='row' spacing={1} alignItems='center'>
      <Typography variant='caption' color='text.secondary' noWrap>
        {employee?.employee_number}
      </Typography>
      {employee?.deleted_at && (
        <Chip
          size='small'
          label='Employee removed'
          color='warning'
          variant='outlined'
          sx={{ height: 18, fontSize: 11 }}
        />
      )}
    </Stack>
  </>
);

const PayslipTableRow = (props: {
  payslip: any;
  runStatus: string;
  isPosted: boolean;
  onViewPayslip: (payslip: any) => void;
}) => {
  const { payslip, employee, statusLabel, statusColor, canOpenEmployee, openEmployee } =
    usePayslipRow(props.payslip, props.runStatus, props.isPosted);

  return (
    <TableRow hover>
      <TableCell>
        <EmployeeIdentity
          employee={employee}
          canOpen={canOpenEmployee}
          onOpen={openEmployee}
        />
      </TableCell>
      <TableCell align='right'>{formatMoney(payslip.basic_salary || 0)}</TableCell>
      <TableCell align='right'>{formatMoney(payslip.total_allowances || 0)}</TableCell>
      <TableCell align='right'>{formatMoney(payslip.gross_salary || 0)}</TableCell>
      <TableCell align='right'>{formatMoney(payslip.total_deductions || 0)}</TableCell>
      <TableCell align='right' sx={{ color: 'error.main' }}>
        {formatMoney(payslip.paye || 0)}
      </TableCell>
      <TableCell align='right' sx={{ color: 'success.main', fontWeight: 600 }}>
        {formatMoney(payslip.net_salary || 0)}
      </TableCell>
      <TableCell>
        <Chip label={statusLabel} size='small' color={statusColor} />
      </TableCell>
      <TableCell align='center'>
        <Tooltip title='View Payslip'>
          <IconButton
            size='small'
            color='primary'
            onClick={() => props.onViewPayslip(payslip)}
          >
            <VisibilityOutlined fontSize='small' />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
};

const CardAmount = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) => (
  <Box>
    <Typography variant='caption' color='text.secondary' display='block'>
      {label}
    </Typography>
    <Typography variant='body2' fontWeight={500} sx={{ color }}>
      {formatMoney(value || 0)}
    </Typography>
  </Box>
);

const PayslipCard = (props: {
  payslip: any;
  runStatus: string;
  isPosted: boolean;
  onViewPayslip: (payslip: any) => void;
}) => {
  const { payslip, employee, statusLabel, statusColor, canOpenEmployee, openEmployee } =
    usePayslipRow(props.payslip, props.runStatus, props.isPosted);

  return (
    <Box
      sx={{
        border: 1,
        borderColor: 'divider',
        borderLeft: 4,
        borderLeftColor: `${statusColor}.main`,
        borderRadius: 2,
        p: 2,
        mx: 2,
        my: 1.5,
        bgcolor: 'background.paper',
      }}
    >
      <Stack
        direction='row'
        justifyContent='space-between'
        alignItems='flex-start'
        spacing={1}
      >
        <Box sx={{ minWidth: 0 }}>
          <EmployeeIdentity
            employee={employee}
            canOpen={canOpenEmployee}
            onOpen={openEmployee}
          />
        </Box>
        <Chip label={statusLabel} size='small' color={statusColor} />
      </Stack>

      <Box mt={1.5} mb={1.5}>
        <Typography variant='caption' color='text.secondary' display='block'>
          Net Pay
        </Typography>
        <Typography variant='h5' color='success.main' mb={0}>
          {formatMoney(payslip.net_salary || 0)}
        </Typography>
      </Box>

      <Divider />

      <Box
        mt={1.5}
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 1.5,
        }}
      >
        <CardAmount label='Basic' value={payslip.basic_salary} />
        <CardAmount label='Allowances' value={payslip.total_allowances} />
        <CardAmount label='Gross' value={payslip.gross_salary} />
        <CardAmount label='Deductions' value={payslip.total_deductions} />
        <CardAmount label='PAYE' value={payslip.paye} color='error.main' />
      </Box>

      <Stack direction='row' justifyContent='flex-end' mt={1}>
        <Tooltip title='View Payslip'>
          <IconButton
            size='small'
            color='primary'
            onClick={() => props.onViewPayslip(payslip)}
          >
            <VisibilityOutlined fontSize='small' />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
};

const sum = (rows: any[], key: string) =>
  rows.reduce((total, row) => total + (Number(row[key]) || 0), 0);

const PayslipsList = ({
  payrollRunId,
  runStatus,
  isPosted,
  onViewPayslip,
  allPayslips,
}: PayslipsListProps) => {
  const listRef = useRef<any>(null);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  // Pay/reverse actions refetch the run's details (they all invalidate
  // 'payrollRunDetails'), which changes this fingerprint — folding it into
  // the list's params re-keys the query so the rows' paid/unpaid state follows
  // along without every payment dialog having to know about this list.
  const dataVersion = `${runStatus}:${allPayslips.length}:${sum(allPayslips, 'paid_amount')}`;

  const [queryOptions, setQueryOptions] = useState({
    queryKey: 'payrollRunPayslips',
    queryParams: {
      payroll_run_id: payrollRunId,
      keyword: '',
    },
    countKey: 'total',
    dataKey: 'data',
  });

  const queryOptionsWithVersion = useMemo(
    () => ({
      ...queryOptions,
      queryParams: { ...queryOptions.queryParams, _v: dataVersion },
    }),
    [queryOptions, dataVersion]
  );

  const handleSearch = useCallback((keyword: string) => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: { ...state.queryParams, keyword },
    }));
  }, []);

  const renderItem = useCallback(
    (payslip: any) => {
      const Row = isDesktop ? PayslipTableRow : PayslipCard;
      return (
        <Row
          payslip={payslip}
          runStatus={runStatus}
          isPosted={isPosted}
          onViewPayslip={onViewPayslip}
        />
      );
    },
    [isDesktop, runStatus, isPosted, onViewPayslip]
  );

  return (
    <JumboRqList
      ref={listRef}
      wrapperComponent={Card}
      service={humanResourcesServices.getPayrollRunPayslips}
      primaryKey='id'
      queryOptions={queryOptionsWithVersion}
      itemsPerPage={10}
      itemsPerPageOptions={[10, 20, 50]}
      renderItem={renderItem}
      component={isDesktop ? PayslipsTable : undefined}
      disableTransition
      componentElement='div'
      wrapperSx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
      toolbar={
        <JumboListToolbar
          hideItemsPerPage={true}
          actionTail={
            <Stack direction='row' justifyContent='end'>
              <JumboSearch
                onChange={handleSearch}
                value={queryOptions.queryParams.keyword}
              />
            </Stack>
          }
        />
      }
    />
  );
};

export default PayslipsList;
