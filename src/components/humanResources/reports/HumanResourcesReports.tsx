'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import JumboCardQuick from '@jumbo/components/JumboCardQuick/JumboCardQuick';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { AssessmentOutlined, BeachAccessOutlined, CompareArrowsOutlined, EventRepeatOutlined, RequestQuoteOutlined } from '@mui/icons-material';
import { Button, Dialog, DialogActions, Grid, Typography, useMediaQuery } from '@mui/material';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import PayrollComparisonDashboard from '../payrollPeriods/PayrollComparison/PayrollComparisonDashboard';
import PayrollSalaryComponentsDashboard from '../payrollPeriods/PayrollSalaryComponents/PayrollSalaryComponentsDashboard';
import LeaveBalancesReport from './leaveBalances/LeaveBalancesReport';
import LeaveRenewalsReport from './leaveRenewals/LeaveRenewalsReport';
import StaffLoanReport from './staffLoans/StaffLoanReport';
import PageLoadingSkeleton from '@/shared/ProgressIndicators/PageLoadingSkeleton';

type ReportCardItem = {
  key: string;
  title: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  // Sidebar only gates the "Reports" link itself off *any* HR permission —
  // nothing further down used to check which one, so a Leave-only user could
  // still open Staff Loans or Salary Components Summary. Each card now
  // requires the same permission its equivalent Quick Reports dashboard card
  // already does.
  permission: string;
};

const buildReportCards = (): ReportCardItem[] => [
  {
    key: 'salary-components-summary',
    title: 'Salary Components Summary',
    icon: <AssessmentOutlined sx={{ fontSize: '40px' }} />,
    component: <PayrollSalaryComponentsDashboard />,
    permission: PERMISSIONS.PAYROLL_READ,
  },
  {
    key: 'payroll-comparison',
    title: 'Payroll Comparison',
    icon: <CompareArrowsOutlined sx={{ fontSize: '40px' }} />,
    component: <PayrollComparisonDashboard />,
    permission: PERMISSIONS.PAYROLL_READ,
  },
  {
    key: 'leave-balances',
    title: 'Leave Balances',
    icon: <BeachAccessOutlined sx={{ fontSize: '40px' }} />,
    component: <LeaveBalancesReport />,
    permission: PERMISSIONS.LEAVE_ALLOCATIONS_READ,
  },
  {
    key: 'leave-renewals',
    title: 'Leave Renewals',
    icon: <EventRepeatOutlined sx={{ fontSize: '40px' }} />,
    component: <LeaveRenewalsReport />,
    permission: PERMISSIONS.LEAVE_ALLOCATIONS_READ,
  },
  {
    key: 'staff-loans',
    title: 'Staff Loans',
    icon: <RequestQuoteOutlined sx={{ fontSize: '40px' }} />,
    component: <StaffLoanReport />,
    permission: PERMISSIONS.LOANS_READ,
  },
];

export default function HumanResourcesReports() {
  const searchParams = useSearchParams();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const { checkOrganizationPermission } = useJumboAuth();

  const reportCards = useMemo(
    () =>
      buildReportCards().filter((item) =>
        checkOrganizationPermission(item.permission)
      ),
    [checkOrganizationPermission]
  );

  const [mounted, setMounted] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [report, setReport] = useState<React.ReactNode>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const reportParam = searchParams.get('report');
    if (!reportParam) return;

    const matchedReport = reportCards.find((item) => item.key === reportParam);
    if (!matchedReport) return;

    setReport(matchedReport.component);
    setOpenDialog(true);
  }, [mounted, searchParams, reportCards]);

  if (!mounted) return <PageLoadingSkeleton />;

  return (
    <React.Fragment>
      <Dialog
        scroll={belowLargeScreen ? 'body' : 'paper'}
        fullWidth
        maxWidth='lg'
        fullScreen={belowLargeScreen && openDialog}
        open={openDialog}
      >
        {report}
        <DialogActions>
          <Button
            sx={{ m: 1 }}
            size='small'
            variant='outlined'
            onClick={() => {
              setOpenDialog(false);
              setReport(null);
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Typography variant='h4' mb={2}>
        Human Resources Reports
      </Typography>

      <JumboCardQuick sx={{ height: '100%' }}>
        {reportCards.length === 0 ? (
          <Typography color='text.secondary' textAlign='center' p={2}>
            You don&apos;t have permission to view any HR reports yet.
          </Typography>
        ) : (
        <Grid container textAlign='center' columnSpacing={2} rowSpacing={2}>
          {reportCards.map((item) => (
            <Grid
              key={item.key}
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
              size={{ xs: 6, md: 3, lg: 2 }}
              p={1}
              textAlign='center'
              onClick={() => {
                setReport(item.component);
                setOpenDialog(true);
              }}
            >
              {item.icon}
              <Typography>{item.title}</Typography>
            </Grid>
          ))}
        </Grid>
        )}
      </JumboCardQuick>
    </React.Fragment>
  );
}
