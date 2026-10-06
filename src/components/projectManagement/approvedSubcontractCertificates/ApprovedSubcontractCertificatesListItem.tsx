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
import CertificateItemAction from '@/components/projectManagement/projects/profile/subcontracts/tabs/certificatesTab/CertificateItemAction';
import CertificateApprovalsActionTail from '@/components/projectManagement/projects/profile/subcontracts/tabs/certificatesTab/CertificateApprovalsActionTail';
import { Certificate } from '@/components/projectManagement/projects/profile/subcontracts/tabs/certificatesTab/CertificateType';
import InvoiceLinkChip from '@/components/projectManagement/InvoiceLinkChip';
import ApprovalHistoryTable from '@/components/projectManagement/approvals/ApprovalHistoryTable';

interface ApprovedSubcontractCertificatesListItemProps {
  certificate: Certificate;
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

// Mirrors RequisitionsListItem's accordion pattern: a compact summary row that expands to show
// the full action set and complete approval history, instead of a dialog for each. Keeps this
// list and ApprovedProjectPaymentClaimsListItem visually identical.
const ApprovedSubcontractCertificatesListItem: React.FC<
  ApprovedSubcontractCertificatesListItemProps
> = ({ certificate }) => {
  const [expanded, setExpanded] = React.useState(false);

  const formattedAmount = React.useMemo(() => {
    if (!certificate.total_amount) return '—';

    return certificate.total_amount.toLocaleString('en-US', {
      style: 'currency',
      currency: certificate.currency?.code || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [certificate.total_amount, certificate.currency?.code]);

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
            <Tooltip title="Certificate Number">
              <Typography noWrap>{certificate.certificateNo || 'Draft / Pending'}</Typography>
            </Tooltip>
            <Tooltip title="Certificate Date">
              <Typography variant="caption" color="text.secondary" display="block">
                {certificate.certificate_date
                  ? readableDate(certificate.certificate_date)
                  : '—'}
              </Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }} sx={{ minWidth: 0 }}>
            <Tooltip title="Project">
              <Typography variant="body2" noWrap>
                {certificate.project?.name || '—'}
              </Typography>
            </Tooltip>
            {certificate.subcontractor?.name && (
              <Tooltip title={certificate.subcontractor.name}>
                <Chip
                  size="small"
                  label={certificate.subcontractor.name}
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
                {certificate.remarks || '—'}
              </Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 12, md: 3, lg: 3 }}>
            <Tooltip title="Certified Total Amount">
              <Typography noWrap>{formattedAmount}</Typography>
            </Tooltip>
            <Tooltip title="Status">
              {certificate.status === 'invoiced' ? (
                <span>
                  <InvoiceLinkChip
                    kind="supplier"
                    documentNo={certificate.supplier_invoice?.invoiceNo}
                    tooltip="Invoiced"
                  />
                </span>
              ) : (
                <Chip
                  size="small"
                  label={certificate.status_label || certificate.status || '—'}
                  color={STATUS_CHIP_COLOR[certificate.status || ''] || 'default'}
                />
              )}
            </Tooltip>
          </Grid>
        </Grid>
      </AccordionSummary>

      <AccordionDetails sx={{ backgroundColor: 'background.paper' }}>
        <Grid container spacing={1}>
          <Grid size={{ xs: 12 }} textAlign="end">
            <CertificateApprovalsActionTail certificate={certificate} />
            <CertificateItemAction certificate={certificate} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <ApprovalHistoryTable approvals={certificate.approvals} />
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default ApprovedSubcontractCertificatesListItem;
