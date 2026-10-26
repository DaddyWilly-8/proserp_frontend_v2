'use client';

import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import {
  CheckCircle,
  HourglassEmpty,
  HighlightOff,
  PauseCircleOutline,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

// Inlined rather than shared — see the identical note in LoanRequestPreview.tsx.
const getDecision = (
  approval: { status?: string; status_label?: string } | undefined
): 'approved' | 'rejected' | 'on hold' | 'unknown' => {
  const status = String(approval?.status || '').toLowerCase();
  const label = String(approval?.status_label || '').toLowerCase();

  if (status === 'rejected' || label === 'rejected') return 'rejected';
  if (status === 'on hold' || label === 'on hold') return 'on hold';
  if (status === 'approved' || label === 'approved') return 'approved';

  return 'unknown';
};

// A deliberately minimal, structural shape — both LeaveRequestType (HR side)
// and the employee self-service side already carry all of this from the
// backend, but this preview only demands the fields it actually reads,
// mirroring LoanRequestPreviewData.
export interface LeaveRequestPreviewData {
  employee_id: number;
  employee?: { first_name?: string; last_name?: string } | null;
  leave_type?: { name?: string } | null;
  leave_type_id?: number;
  start_date: string;
  end_date: string;
  days_requested: number;
  days_granted?: number | null;
  reason?: string | null;
  status: string;
  status_label?: string;
  reviewed_at?: string | null;
  review_remarks?: string | null;
  approval_chain?: {
    levels?: {
      id: number;
      position_index?: number;
      label?: string | null;
      role?: { name?: string } | null;
    }[];
  } | null;
  approvals?: {
    id?: number;
    chain_level_id?: number | null;
    approval_chain_level_id?: number | null;
    label?: string | null;
    status?: string;
    status_label?: string;
    is_final?: boolean;
    days_approved?: number | null;
    remarks?: string | null;
    approval_date?: string | null;
    creator?: { name?: string } | null;
  }[];
}

const STATUS_COLOR: Record<string, any> = {
  in_review: 'warning',
  approved: 'success',
  rejected: 'error',
  cancelled: 'default',
};

const DECISION_COLOR: Record<string, any> = {
  approved: 'success',
  rejected: 'error',
  'on hold': 'warning',
  unknown: 'default',
};

const DecisionIcon = ({ decision }: { decision: string }) => {
  const sx = { fontSize: 26 };
  if (decision === 'approved') return <CheckCircle color='success' sx={sx} />;
  if (decision === 'rejected') return <HighlightOff color='error' sx={sx} />;
  if (decision === 'on hold')
    return <PauseCircleOutline color='warning' sx={sx} />;
  return <HourglassEmpty color='disabled' sx={sx} />;
};

interface LeaveRequestPreviewProps {
  leaveRequest: LeaveRequestPreviewData;
  /** Overrides the auto-derived "First Last" / "Employee #id" header — used
   * on the employee self-service side, where showing your own name back to
   * you reads oddly. */
  title?: string;
}

/**
 * Read-only preview of a leave request: dates/days/reason up top, then the
 * full approval chain as a timeline (one row per level, in order, showing
 * who decided it, when, and any remarks — including levels not yet reached).
 * Mirrors LoanRequestPreview.tsx; shared between the HR-side
 * LeaveRequestsListItem and the employee self-service
 * MyHrLeaveRequestsListItem since both receive the same
 * approval_chain/approvals shape from the backend.
 */
const LeaveRequestPreview = ({ leaveRequest, title }: LeaveRequestPreviewProps) => {
  const dictionary = useDictionary();
  const employeeName =
    title ??
    (leaveRequest.employee
      ? `${leaveRequest.employee.first_name} ${leaveRequest.employee.last_name}`
      : dictionary.humanResources.leaveRequests.preview.employeeFallback.replace(
          '{id}',
          String(leaveRequest.employee_id)
        ));

  const statusColor = STATUS_COLOR[leaveRequest.status] || 'default';
  const statusLabel =
    leaveRequest.status_label ||
    dictionary.humanResources.leaveRequests.status[leaveRequest.status] ||
    leaveRequest.status ||
    dictionary.humanResources.leaveRequests.status.pending;

  const levels = [...(leaveRequest.approval_chain?.levels || [])].sort(
    (a, b) => Number(a.position_index || 0) - Number(b.position_index || 0)
  );
  const approvals = [...(leaveRequest.approvals || [])].sort(
    (a, b) =>
      new Date(a.approval_date || 0).getTime() -
      new Date(b.approval_date || 0).getTime()
  );
  const isFullyDecided =
    approvals.some((a) => a.is_final) ||
    ['approved', 'rejected', 'cancelled'].includes(leaveRequest.status);
  const nextLevel =
    !isFullyDecided && levels.length > approvals.length
      ? levels[approvals.length]
      : undefined;

  const daysLabel =
    leaveRequest.days_granted != null
      ? dictionary.humanResources.leaveRequests.preview.daysGranted
          .replace('{granted}', String(leaveRequest.days_granted))
          .replace('{requested}', String(leaveRequest.days_requested))
      : dictionary.humanResources.leaveRequests.dayCountMany.replace(
          '{n}',
          String(leaveRequest.days_requested)
        );

  return (
    <Box>
      <Grid container spacing={1} alignItems='center' mb={2}>
        <Grid size={{ xs: 12, sm: 8 }}>
          <Typography variant='h5'>{employeeName}</Typography>
          <Typography variant='body2' color='text.secondary'>
            {leaveRequest.leave_type?.name || dictionary.humanResources.leaveRequests.list.typeFallback.replace(
                '{id}',
                String(leaveRequest.leave_type_id)
              )}
            {leaveRequest.reason ? ` · ${leaveRequest.reason}` : ''}
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }} textAlign={{ sm: 'right' }}>
          <Chip
            label={statusLabel}
            color={statusColor}
            variant='outlined'
            sx={{ textTransform: 'capitalize' }}
          />
        </Grid>
      </Grid>

      <Card variant='outlined' sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant='caption' color='text.secondary' display='block'>
                {dictionary.humanResources.leaveRequests.preview.startDate}
              </Typography>
              <Typography variant='h6' fontWeight={500}>
                {dayjs(leaveRequest.start_date).format('YYYY-MM-DD')}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant='caption' color='text.secondary' display='block'>
                {dictionary.humanResources.leaveRequests.preview.endDate}
              </Typography>
              <Typography variant='h6' fontWeight={500}>
                {dayjs(leaveRequest.end_date).format('YYYY-MM-DD')}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant='caption' color='text.secondary' display='block'>
                {dictionary.humanResources.leaveRequests.preview.days}
              </Typography>
              <Typography variant='h6' fontWeight={500}>
                {daysLabel}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Typography variant='subtitle1' fontWeight={600} mb={1.5}>
        {dictionary.humanResources.leaveRequests.preview.approvalStages}
      </Typography>

      {approvals.length === 0 && !nextLevel ? (
        <Alert severity='info' variant='outlined'>
          {leaveRequest.reviewed_at ? (
            <>
              {dictionary.humanResources.leaveRequests.preview.decidedDirectly.replace(
                '{date}',
                readableDate(leaveRequest.reviewed_at, false)
              )}
              {leaveRequest.review_remarks
                ? ` — "${leaveRequest.review_remarks}"`
                : ''}
            </>
          ) : (
            dictionary.humanResources.leaveRequests.preview.noChain
          )}
        </Alert>
      ) : (
        <Stack spacing={0}>
          {approvals.map((approval, index) => {
            const decision = getDecision(approval);
            const actionLabel =
              decision === 'approved'
                ? approval.label || dictionary.humanResources.leaveRequests.preview.approved
                : decision === 'rejected'
                  ? dictionary.humanResources.leaveRequests.preview.rejected
                  : decision === 'on hold'
                    ? dictionary.humanResources.leaveRequests.preview.putOnHold
                    : dictionary.humanResources.leaveRequests.preview.decisionRecorded;
            const isLast = !nextLevel && index === approvals.length - 1;

            return (
              <Stack key={approval.id ?? index} direction='row' spacing={1.5}>
                <Stack alignItems='center' sx={{ pt: 0.25 }}>
                  <DecisionIcon decision={decision} />
                  {!isLast && (
                    <Box
                      sx={{
                        width: 2,
                        flexGrow: 1,
                        minHeight: 32,
                        bgcolor: 'divider',
                        my: 0.5,
                      }}
                    />
                  )}
                </Stack>
                <Box sx={{ pb: isLast ? 0 : 2.5, flex: 1 }}>
                  <Stack
                    direction='row'
                    spacing={1}
                    alignItems='center'
                    flexWrap='wrap'
                  >
                    <Typography variant='subtitle2'>
                      {dictionary.humanResources.leaveRequests.preview.actionBy
                        .replace('{action}', actionLabel)
                        .replace(
                          '{name}',
                          approval.creator?.name || dictionary.humanResources.leaveRequests.preview.unknownReviewer
                        )}
                    </Typography>
                    <Chip
                      size='small'
                      label={
                        dictionary.humanResources.leaveRequests.status[
                          (approval.status || 'pending').toLowerCase()
                        ] ?? approval.status
                      }
                      color={DECISION_COLOR[decision] || 'default'}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </Stack>

                  <Typography variant='body2' color='text.secondary'>
                    {approval.approval_date
                      ? readableDate(approval.approval_date, false)
                      : ''}
                  </Typography>
                  {approval.days_approved != null && (
                    <Typography variant='body2' mt={0.5}>
                      {dictionary.humanResources.leaveRequests.preview.approvedDays.replace(
                        '{n}',
                        String(approval.days_approved)
                      )}
                    </Typography>
                  )}
                  {approval.remarks && (
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      mt={0.5}
                    >
                      &ldquo;{approval.remarks}&rdquo;
                    </Typography>
                  )}
                </Box>
              </Stack>
            );
          })}

          {nextLevel && (
            <Stack direction='row' spacing={1.5}>
              <Stack alignItems='center' sx={{ pt: 0.25 }}>
                <DecisionIcon decision='unknown' />
              </Stack>
              <Box sx={{ flex: 1 }}>
                <Stack direction='row' spacing={1} alignItems='center'>
                  <Typography variant='subtitle2'>
                    {dictionary.humanResources.leaveRequests.preview.waitingFor.replace(
                      '{role}',
                      nextLevel.role?.name || dictionary.humanResources.leaveRequests.preview.nextReviewer
                    )}
                  </Typography>
                  <Chip
                    size='small'
                    label={dictionary.humanResources.leaveRequests.preview.pending}
                    color='default'
                    sx={{ textTransform: 'capitalize' }}
                  />
                </Stack>
                <Typography variant='body2' color='text.secondary'>
                  {dictionary.humanResources.leaveRequests.preview.notReached}
                </Typography>
              </Box>
            </Stack>
          )}
        </Stack>
      )}
    </Box>
  );
};

export default LeaveRequestPreview;
