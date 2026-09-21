'use client';

import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import { VisibilityOutlined } from '@mui/icons-material';
import {
  Card,
  Chip,
  Divider,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography,
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
  // The run's full (processed) payslips — used only for the run-wide totals
  // strip and to refetch this list when payments change something; the list
  // itself is server-paginated.
  allPayslips: any[];
}

const Field = ({
  label,
  children,
  color,
  bold,
}: {
  label: string;
  children: React.ReactNode;
  color?: string;
  bold?: boolean;
}) => (
  <div>
    <Typography variant='caption' color='text.secondary' display='block' noWrap>
      {label}
    </Typography>
    <Typography
      noWrap
      variant='body2'
      sx={{ color, fontWeight: bold ? 600 : undefined }}
    >
      {children}
    </Typography>
  </div>
);

const PayslipsListItem = ({
  payslip: rawPayslip,
  runStatus,
  isPosted,
  onViewPayslip,
}: {
  payslip: any;
  runStatus: string;
  isPosted: boolean;
  onViewPayslip: (payslip: any) => void;
}) => {
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
  const rowStatusLabel = isRowPaid
    ? 'Paid'
    : isRowPartiallyPaid
      ? 'Partially Paid'
      : ['partially_paid', 'paid'].includes(runStatusRaw)
        ? 'Unpaid'
        : (runStatus || 'Approved')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <>
      <Divider />
      <Grid
        mt={1}
        mb={1}
        sx={{ '&:hover': { bgcolor: 'action.hover' } }}
        paddingLeft={2}
        paddingRight={2}
        spacing={1}
        alignItems='center'
        container
      >
        <Grid size={{ xs: 12, md: 2.5 }}>
          <Typography
            variant='h5'
            fontSize={14}
            lineHeight={1.25}
            mb={0}
            noWrap
            onClick={() => {
              if (hasEmployeeRead && employee?.id && !employee?.deleted_at) {
                router.push(
                  `/${lang}/humanResources/employees/${employee.id}`
                );
              }
            }}
            sx={
              hasEmployeeRead && !employee?.deleted_at
                ? {
                    cursor: 'pointer',
                    '&:hover': {
                      color: 'primary.main',
                      textDecoration: 'underline',
                    },
                  }
                : undefined
            }
          >
            {getEmployeeName(employee)}
          </Typography>
          <Stack direction='row' spacing={1} alignItems='center'>
            <Typography variant='body2' color='text.secondary' noWrap>
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
        </Grid>

        <Grid size={{ xs: 6, md: 1.2 }}>
          <Field label='Basic'>{formatMoney(payslip.basic_salary || 0)}</Field>
        </Grid>
        <Grid size={{ xs: 6, md: 1.1 }}>
          <Field label='Allowances'>
            {formatMoney(payslip.total_allowances || 0)}
          </Field>
        </Grid>
        <Grid size={{ xs: 6, md: 1.3 }}>
          <Field label='Gross'>{formatMoney(payslip.gross_salary || 0)}</Field>
        </Grid>
        <Grid size={{ xs: 6, md: 1.2 }}>
          <Field label='Deductions'>
            {formatMoney(payslip.total_deductions || 0)}
          </Field>
        </Grid>
        <Grid size={{ xs: 6, md: 1 }}>
          <Field label='PAYE' color='error.main'>
            {formatMoney(payslip.paye || 0)}
          </Field>
        </Grid>
        <Grid size={{ xs: 6, md: 1.4 }}>
          <Field label='Net Pay' color='success.main' bold>
            {formatMoney(payslip.net_salary || 0)}
          </Field>
        </Grid>

        <Grid size={{ xs: 8, md: 1.3 }}>
          <Tooltip title='Payment Status'>
            <Chip
              label={rowStatusLabel}
              size='small'
              color={
                isRowPaid
                  ? 'success'
                  : isRowPartiallyPaid
                    ? 'warning'
                    : isPosted
                      ? 'primary'
                      : 'info'
              }
            />
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 4, md: 1 }} textAlign='end'>
          <Tooltip title='View Payslip'>
            <IconButton
              size='small'
              color='primary'
              onClick={() => onViewPayslip(payslip)}
            >
              <VisibilityOutlined fontSize='small' />
            </IconButton>
          </Tooltip>
        </Grid>
      </Grid>
    </>
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
    (payslip: any) => (
      <PayslipsListItem
        payslip={payslip}
        runStatus={runStatus}
        isPosted={isPosted}
        onViewPayslip={onViewPayslip}
      />
    ),
    [runStatus, isPosted, onViewPayslip]
  );

  return (
    <>
      {allPayslips.length > 0 && (
        <Stack
          direction='row'
          spacing={3}
          mb={2}
          flexWrap='wrap'
          useFlexGap
          alignItems='center'
        >
          <Typography variant='caption' color='text.secondary'>
            Run totals · {allPayslips.length} payslip
            {allPayslips.length === 1 ? '' : 's'}
          </Typography>
          <Field label='Basic'>{formatMoney(sum(allPayslips, 'basic_salary'))}</Field>
          <Field label='Allowances'>
            {formatMoney(sum(allPayslips, 'total_allowances'))}
          </Field>
          <Field label='Gross'>{formatMoney(sum(allPayslips, 'gross_salary'))}</Field>
          <Field label='Deductions'>
            {formatMoney(sum(allPayslips, 'total_deductions'))}
          </Field>
          <Field label='PAYE' color='error.main'>
            {formatMoney(sum(allPayslips, 'paye'))}
          </Field>
          <Field label='Net Pay' color='success.main' bold>
            {formatMoney(sum(allPayslips, 'net_salary'))}
          </Field>
        </Stack>
      )}
      <JumboRqList
        ref={listRef}
        wrapperComponent={Card}
        service={humanResourcesServices.getPayrollRunPayslips}
        primaryKey='id'
        queryOptions={queryOptionsWithVersion}
        itemsPerPage={10}
        itemsPerPageOptions={[10, 20, 50]}
        renderItem={renderItem}
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
    </>
  );
};

export default PayslipsList;
