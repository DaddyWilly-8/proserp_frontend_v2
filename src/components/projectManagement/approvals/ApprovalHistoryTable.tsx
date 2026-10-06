import React from 'react';
import {
  Box,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';

export interface ApprovalHistoryEntry {
  id?: number | string;
  status?: string;
  remarks?: string | null;
  approval_date?: string | null;
  is_final?: boolean;
  is_superseded?: boolean;
  approval_chain_level?: {
    label?: string;
    role?: { name?: string };
  };
  creator?: { name?: string };
}

interface ApprovalHistoryTableProps {
  approvals?: ApprovalHistoryEntry[];
}

const DECISION_CHIP_COLOR: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  approved: 'success',
  'on hold': 'warning',
  rejected: 'error',
  returned: 'info',
};

// Read-only decision-by-decision record for a claim/certificate's approval chain - who decided
// what, when, with what remarks. Shown wherever the full document is previewed, so a reviewer can
// see this before deciding whether to approve, hold, reject, or reverse their own prior decision
// (see CertificateApprovalsActionTail/ProjectClaimApprovalsActionTail's "Reverse My Approval").
const ApprovalHistoryTable: React.FC<ApprovalHistoryTableProps> = ({ approvals }) => {
  if (!approvals?.length) return null;

  return (
    <Box sx={{ mb: 8 }}>
      <Typography variant="h5" sx={{ mb: 4, textAlign: 'center' }}>
        Approval History
      </Typography>
      <TableContainer component={Paper} elevation={4}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Level</TableCell>
              <TableCell>Decision</TableCell>
              <TableCell>Remarks</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>By</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {approvals.map((approval, index) => {
              const status = String(approval.status || '').toLowerCase();
              return (
                <TableRow key={approval.id ?? index}>
                  <TableCell>
                    {approval.approval_chain_level?.role?.name ||
                      approval.approval_chain_level?.label ||
                      '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        approval.is_superseded
                          ? `${approval.status} (superseded)`
                          : approval.status || '-'
                      }
                      size="small"
                      color={DECISION_CHIP_COLOR[status] || 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{approval.remarks || '-'}</TableCell>
                  <TableCell>
                    {approval.approval_date ? readableDate(approval.approval_date, false) : '-'}
                  </TableCell>
                  <TableCell>{approval.creator?.name || '-'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ApprovalHistoryTable;
