'use client';

import React from 'react';
import {
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  Box,
  useMediaQuery,
} from '@mui/material';
import { HighlightOff } from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import PDFContent from '@/components/pdf/PDFContent';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import projectsServices from '@/components/projectManagement/projects/project-services';
import ProjectStatusReportPDF from './ProjectStatusReportPDF';

interface ProjectStatusReportRow {
  id: number;
  projectNo?: string;
  name?: string;
  client?: string;
  category?: string;
  contract_value?: number;
  site_implementation_percentage?: number;
  time_elapsed_percentage?: number | null;
  progressive_revenue?: number;
  progressive_revenue_percentage?: number | null;
  billed_revenue?: number;
  billed_revenue_percentage?: number | null;
  unbilled_revenue?: number;
  unbilled_revenue_percentage?: number | null;
  received_payments?: number;
  received_payments_percentage?: number | null;
  certified_pending_payment?: number;
  certified_pending_payment_percentage?: number | null;
  outstanding_liabilities?: number;
  remarks?: string | null;
}

interface ProjectStatusReportProps {
  setOpenDialog: (open: boolean) => void;
}

const formatAmount = (value?: number | null) =>
  value == null ? '—' : value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatPercentage = (value?: number | null) => (value == null ? '—' : `${value.toFixed(2)}%`);

const AmountWithPercentage = ({ amount, percentage }: { amount?: number; percentage?: number | null }) => (
  <Box textAlign="right">
    <Typography variant="body2" noWrap>{formatAmount(amount)}</Typography>
    <Typography variant="caption" color="text.secondary" noWrap>{formatPercentage(percentage)}</Typography>
  </Box>
);

// Replaces the Project Engineer's manual monthly "PROJECT REPORT STATUS" spreadsheet's PROJECTS
// sheet with a live equivalent - see ProjectStatusReportController::index() for where each
// figure comes from. Follows the same report-dialog shape as ApArAgingReport/DebtorCreditorReport
// (DialogTitle + FileExportGrid, DialogContent holding the table) so every report in the app
// looks and exports the same way.
const ProjectStatusReport: React.FC<ProjectStatusReportProps> = ({ setOpenDialog }) => {
  const { authOrganization, authUser } = useJumboAuth();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const [isExporting, setIsExporting] = React.useState(false);
  const [showOnScreen, setShowOnScreen] = React.useState(true);
  const [asAt, setAsAt] = React.useState(dayjs().toISOString());

  const { data, isFetching, isError, error } = useQuery({
    queryKey: ['projectStatusReport', asAt],
    queryFn: () => projectsServices.getProjectStatusReport({ as_at: asAt }),
  });

  const rows: ProjectStatusReportRow[] = data?.data || [];
  const totals = data?.totals || {};

  const handlExcelExport = async () => {
    setIsExporting(true);
    try {
      const blob = await projectsServices.exportProjectStatusReportToExcel({
        authOrganization,
        rows,
        totals,
        asAt,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Project Status Report ${readableDate(asAt, true)}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  document.title = 'Project Status Report';

  return (
    <>
      <DialogTitle textAlign="center">
        <Grid container>
          <Grid size={12} textAlign="center">
            <Typography variant="h3">Project Status Report</Typography>
            {belowLargeScreen && (
              <Tooltip title="Close">
                <IconButton
                  size="small"
                  sx={{ position: 'absolute', top: 10, right: 10 }}
                  onClick={() => setOpenDialog(false)}
                >
                  <HighlightOff color="primary" />
                </IconButton>
              </Tooltip>
            )}
          </Grid>
        </Grid>
        <Grid container columnSpacing={1} rowSpacing={1} alignItems="center" justifyContent="flex-end">
          <Grid size={{ xs: 12, md: 4, lg: 3 }}>
            <DateTimePicker
              label="As at"
              value={dayjs(asAt)}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
              onChange={(newValue) => setAsAt((newValue || dayjs()).toISOString())}
            />
          </Grid>
          <Grid>
            {rows.length > 0 && (
              <FileExportGrid
                exportExcel
                handlExcelExport={handlExcelExport}
                exportingExcel={isExporting}
                exportPdf
                handlePdf={() => setShowOnScreen((prev) => !prev)}
              />
            )}
          </Grid>
        </Grid>
      </DialogTitle>
      <DialogContent>
        {isFetching ? (
          <LinearProgress />
        ) : isError ? (
          <Typography color="error" textAlign="center" py={3}>
            {(error as any)?.response?.data?.message || 'Failed to load the Project Status Report.'}
          </Typography>
        ) : !showOnScreen ? (
          <PDFContent
            fileName={`Project Status Report ${readableDate(asAt, true)}`}
            document={
              <ProjectStatusReportPDF
                authOrganization={authOrganization}
                user={authUser?.user}
                rows={rows}
                totals={totals}
                asAt={asAt}
              />
            }
          />
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>S/N</TableCell>
                  <TableCell>Project</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Contract Value</TableCell>
                  <TableCell align="right">Site Impl. %</TableCell>
                  <TableCell align="right">Time Elapsed %</TableCell>
                  <TableCell align="right">Progressive Revenue</TableCell>
                  <TableCell align="right">Billed Revenue</TableCell>
                  <TableCell align="right">Unbilled Revenue (WIP)</TableCell>
                  <TableCell align="right">Received Payments</TableCell>
                  <TableCell align="right">Certified Pending Payment</TableCell>
                  <TableCell align="right">Outstanding Liabilities</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} noWrap>{row.name}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>{row.projectNo}</Typography>
                    </TableCell>
                    <TableCell>{row.client || '—'}</TableCell>
                    <TableCell>{row.category || '—'}</TableCell>
                    <TableCell align="right">{formatAmount(row.contract_value)}</TableCell>
                    <TableCell align="right">{formatPercentage(row.site_implementation_percentage)}</TableCell>
                    <TableCell align="right">{formatPercentage(row.time_elapsed_percentage)}</TableCell>
                    <TableCell>
                      <AmountWithPercentage amount={row.progressive_revenue} percentage={row.progressive_revenue_percentage} />
                    </TableCell>
                    <TableCell>
                      <AmountWithPercentage amount={row.billed_revenue} percentage={row.billed_revenue_percentage} />
                    </TableCell>
                    <TableCell>
                      <AmountWithPercentage amount={row.unbilled_revenue} percentage={row.unbilled_revenue_percentage} />
                    </TableCell>
                    <TableCell>
                      <AmountWithPercentage amount={row.received_payments} percentage={row.received_payments_percentage} />
                    </TableCell>
                    <TableCell>
                      <AmountWithPercentage amount={row.certified_pending_payment} percentage={row.certified_pending_payment_percentage} />
                    </TableCell>
                    <TableCell align="right">{formatAmount(row.outstanding_liabilities)}</TableCell>
                  </TableRow>
                ))}

                {!isFetching && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={13} align="center">
                      <Typography color="text.secondary" py={3}>No projects found.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              {rows.length > 0 && (
                <TableBody>
                  <TableRow sx={{ '& td': { fontWeight: 700, borderTop: 2, borderColor: 'divider' } }}>
                    <TableCell colSpan={4}>TOTAL</TableCell>
                    <TableCell align="right">{formatAmount(totals.contract_value)}</TableCell>
                    <TableCell />
                    <TableCell />
                    <TableCell align="right">{formatAmount(totals.progressive_revenue)}</TableCell>
                    <TableCell align="right">{formatAmount(totals.billed_revenue)}</TableCell>
                    <TableCell align="right">{formatAmount(totals.unbilled_revenue)}</TableCell>
                    <TableCell align="right">{formatAmount(totals.received_payments)}</TableCell>
                    <TableCell align="right">{formatAmount(totals.certified_pending_payment)}</TableCell>
                    <TableCell align="right">{formatAmount(totals.outstanding_liabilities)}</TableCell>
                  </TableRow>
                </TableBody>
              )}
            </Table>
          </TableContainer>
        )}
      </DialogContent>
    </>
  );
};

export default ProjectStatusReport;
