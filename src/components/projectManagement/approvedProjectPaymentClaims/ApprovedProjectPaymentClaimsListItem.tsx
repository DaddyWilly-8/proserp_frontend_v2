'use client';

import React from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Chip,
  Grid,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import ProjectClaimItemAction from '@/components/projectManagement/projects/profile/claims/ProjectClaimItemAction';
import ProjectClaimApprovalsActionTail from '@/components/projectManagement/projects/profile/claims/ProjectClaimApprovalsActionTail';
import { ProjectClaim } from '@/components/projectManagement/projects/profile/claims/ProjectClaimType';
import InvoiceLinkChip from '@/components/projectManagement/InvoiceLinkChip';
import ApprovalHistoryTable from '@/components/projectManagement/approvals/ApprovalHistoryTable';

interface ApprovedProjectPaymentClaimsListItemProps {
  claim: ProjectClaim;
}

const STATUS_CHIP_COLOR: Record<
  string,
  'default' | 'warning' | 'info' | 'success' | 'error' | 'secondary'
> = {
  draft: 'warning',
  in_review: 'info',
  approved: 'success',
  rejected: 'error',
  invoiced: 'success',
  returned: 'secondary',
};

// Mirrors ApprovedSubcontractCertificatesListItem / RequisitionsListItem's accordion pattern: a
// compact summary row that expands to show the full action set and complete approval history,
// instead of a dialog for each.
const ApprovedProjectPaymentClaimsListItem: React.FC<
  ApprovedProjectPaymentClaimsListItemProps
> = ({ claim }) => {
  const [expanded, setExpanded] = React.useState(false);

  const formattedAmount = React.useMemo(() => {
    if (claim.total_amount == null) return '—';

    return claim.total_amount.toLocaleString('en-US', {
      style: 'currency',
      currency: claim.currency?.code || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [claim.total_amount, claim.currency?.code]);

  return (
    <Accordion
      expanded={expanded}
      onChange={() => setExpanded((prev) => !prev)}
      square
      disableGutters
      sx={{
        borderRadius: 2,
        borderTop: 2,
        borderColor: 'divider',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <AccordionSummary
        expandIcon={expanded ? <RemoveIcon /> : <AddIcon />}
        sx={{
          px: 2,
          flexDirection: 'row-reverse',
          '.MuiAccordionSummary-content': {
            alignItems: 'center',
            minWidth: 0,
            '&.Mui-expanded': { margin: '10px 0' },
          },
          '.MuiAccordionSummary-expandIconWrapper': {
            borderRadius: 1,
            border: 1,
            color: 'text.secondary',
            transform: 'none',
            mr: 1,
            '&.Mui-expanded': {
              transform: 'none',
              color: 'primary.main',
              borderColor: 'primary.main',
            },
            '& svg': { fontSize: '0.9rem' },
          },
        }}
      >
        <Grid container spacing={1} alignItems="center" width="100%" sx={{ minWidth: 0 }}>
          <Grid size={{ xs: 12, md: 2 }} sx={{ minWidth: 0 }}>
            <Tooltip title="Claim Number">
              <Typography noWrap>{claim.claimNo || 'Draft / Pending'}</Typography>
            </Tooltip>
            <Tooltip title="Claim Date">
              <Typography variant="caption" color="text.secondary" display="block">
                {claim.claim_date ? readableDate(claim.claim_date) : '—'}
              </Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }} sx={{ minWidth: 0 }}>
            <Tooltip title="Project">
              <Typography variant="body2" noWrap>
                {claim.project?.name || '—'}
              </Typography>
            </Tooltip>
            {claim.client?.name && (
              <Tooltip title={claim.client.name}>
                <Chip
                  size="small"
                  label={claim.client.name}
                  sx={{
                    mt: 0.5,
                    maxWidth: '100%',
                    minWidth: 0,
                    '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' },
                  }}
                />
              </Tooltip>
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 4, lg: 4 }} sx={{ minWidth: 0 }}>
            <Tooltip title="Remarks">
              <Typography variant="body2" fontSize={14} noWrap>
                {claim.remarks || '—'}
              </Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 12, md: 3, lg: 3 }}>
            <Tooltip title="Total Amount">
              <Typography noWrap>{formattedAmount}</Typography>
            </Tooltip>
            <Tooltip title="Status">
              {claim.status === 'invoiced' ? (
                <span>
                  <InvoiceLinkChip
                    kind="customer"
                    documentNo={claim.customer_invoice?.invoiceNo}
                    tooltip="Invoiced"
                  />
                </span>
              ) : (
                <Chip
                  size="small"
                  label={claim.status_label || claim.status || '—'}
                  color={STATUS_CHIP_COLOR[claim.status || ''] || 'default'}
                />
              )}
            </Tooltip>
          </Grid>
        </Grid>
      </AccordionSummary>

      <AccordionDetails sx={{ backgroundColor: 'background.paper' }}>
        <Grid container spacing={1}>
          <Grid size={{ xs: 12 }} textAlign="end">
            <ProjectClaimApprovalsActionTail claim={claim} />
            <ProjectClaimItemAction claim={claim} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <ApprovalHistoryTable approvals={claim.approvals} />
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default ApprovedProjectPaymentClaimsListItem;
