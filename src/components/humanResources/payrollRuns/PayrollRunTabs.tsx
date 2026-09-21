// components/humanResources/payrollRuns/PayrollRunTabs.tsx
'use client';

import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import {
  Alert,
  Box,
  Chip,
  Grid,
  Tooltip,
  Typography,
} from '@mui/material';
import { PayrollPeriodType } from '../payrollPeriods/PayrollPeriodType';
import PayrollApprovalItemAction from './PayrollApprovalItemAction';
import PayrollApprovalsActionTail from './PayrollApprovalsActionTail';
import { PayrollRunType } from './PayrollRunType';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

export const TabPanel = ({ children, value, index }: TabPanelProps) => (
  <div hidden={value !== index} role='tabpanel'>
    {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
  </div>
);

interface ApprovalsTabProps {
  payrollRun: PayrollRunType;
  selectedPayrollPeriod?: PayrollPeriodType | null;
}

export const ApprovalsTab = ({
  payrollRun,
  selectedPayrollPeriod,
}: ApprovalsTabProps) => {
  const approvals = payrollRun?.approvals || [];

  return (
    <Grid container spacing={2}>
      {approvals.length === 0 && (
        <Grid size={{ xs: 12 }} textAlign={'end'}>
          <PayrollApprovalsActionTail
            payrollRun={payrollRun}
            selectedPayrollPeriod={selectedPayrollPeriod}
          />
        </Grid>
      )}
      <Grid size={{ xs: 12 }}>
        <Grid container spacing={2}>
          {approvals.length > 0 ? (
            approvals.map((approval, index) => {
              const approvalStatus = (approval.status || '').toLowerCase();
              const chipColor =
                approvalStatus === 'rejected'
                  ? 'error'
                  : approvalStatus === 'on hold'
                    ? 'warning'
                    : approvalStatus === 'approved'
                      ? 'success'
                      : 'info';
              // The level's own title (e.g. "Checked", "Verified") — prefer
              // the historical approval_chain_level eager-loaded onto the
              // approval itself over a fresh lookup against the run's
              // *current* chain, which may have since been edited. Was
              // previously read as chainLevel?.name/level_name, fields that
              // don't exist on ApprovalChainLevel (only .label does), so it
              // silently rendered blank.
              const chainLevel = payrollRun?.approval_chain?.levels?.find(
                (level) =>
                  Number(level.id) ===
                  Number(
                    approval.chain_level_id || approval.approval_chain_level_id
                  )
              );
              // Combines the decision (e.g. "Approved") with the role that
              // held that chain level (e.g. "Finance Manager") — the label
              // alone is often the same generic word at every level ("Approved"
              // by HR, then "Approved" by Finance Manager, then Director), so
              // the role is what actually distinguishes which level this was.
              // Mirrors PayrollRunApproval::getStatusLabelAttribute() (backend
              // accessor, not sent over the API) built client-side instead.
              const levelLabel = [
                approval.label || approval.approval_chain_level?.label,
                approval.approval_chain_level?.role?.name || chainLevel?.role?.name,
              ]
                .filter(Boolean)
                .join(' by ');

              return (
                <Grid
                  key={approval.id || index}
                  size={{ xs: 12 }}
                  sx={{
                    cursor: 'pointer',
                    borderTop: index === 0 ? 0 : 1,
                    borderColor: 'divider',
                    '&:hover': { bgcolor: 'action.hover' },
                    padding: 1,
                  }}
                  container
                  spacing={2}
                  width={'100%'}
                  alignItems={'center'}
                >
                  <Grid size={{ xs: 12, md: 3, lg: 3 }}>
                    <Tooltip title={'Action Date'}>
                      <Typography variant='h6'>
                        {approval.approval_date
                          ? readableDate(approval.approval_date)
                          : '-'}
                      </Typography>
                    </Tooltip>
                  </Grid>

                  <Grid size={{ xs: 12, md: 3, lg: 3 }}>
                    <Tooltip title={'Done By'}>
                      <Typography variant='h6'>
                        {(approval as any).creator?.name || '-'}
                      </Typography>
                    </Tooltip>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4, lg: 4 }}>
                    <Tooltip title={approval.status || 'Pending'}>
                      <Chip
                        size='small'
                        label={levelLabel || approval.status || 'Pending'}
                        color={chipColor as any}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </Tooltip>
                    {approval.remarks && (
                      <Typography variant='caption' sx={{ ml: 1 }}>
                        {approval.remarks}
                      </Typography>
                    )}
                  </Grid>

                  <Grid size={{ xs: 12, md: 2, lg: 2 }} textAlign={'right'}>
                    <PayrollApprovalItemAction
                      payrollRun={payrollRun}
                      approval={approval}
                      approvals={approvals}
                    />
                  </Grid>
                </Grid>
              );
            })
          ) : (
            <Grid size={{ xs: 12 }}>
              <Alert variant='outlined' severity='info'>
                No Approvals Found
              </Alert>
            </Grid>
          )}
        </Grid>
      </Grid>
    </Grid>
  );
};
