import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  useTheme,
} from '@mui/material';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { Organization } from '@/types/auth-types';

interface RevenueLedger {
  name?: string;
}

interface ProjectDeliverable {
  description?: string;
  contract_rate?: number;
  measurement_unit?: { symbol?: string };
}

interface ClaimItem {
  project_deliverable?: ProjectDeliverable;
  revenue_ledger?: RevenueLedger;
  measurement_unit?: { symbol?: string };
  certified_quantity?: number;
  previous_certified_quantity?: number;
  remarks?: string | null;
}

interface ComplementLedger {
  name?: string;
}

interface Adjustment {
  id?: string | number;
  description: string;
  type: 'addition' | 'deduction';
  amount: number | string;
  complement_ledger?: ComplementLedger;
}

interface Currency {
  code?: string;
}

interface Creator {
  name?: string;
}

interface Project {
  name?: string;
}

interface Claim {
  claimNo: string;
  claim_date: string;
  project?: Project;
  remarks?: string | null;
  currency?: Currency;
  creator?: Creator;
  amount?: number | string;
  vat_percentage?: number;
  claim_items: ClaimItem[];
  adjustments?: Adjustment[];
}

interface ClaimOnscreenProps {
  claim: Claim;
  organization: Organization;
}

const ClaimOnscreen: React.FC<ClaimOnscreenProps> = ({ claim, organization }) => {
  const theme = useTheme();

  const mainColor = organization.settings?.main_color || "#2113AD";
  const headerColor = theme.type === 'dark' ? '#29f096' : (organization.settings?.main_color || "#2113AD");
  const contrastText = organization.settings?.contrast_text || "#FFFFFF";
  const currencyCode = claim.currency?.code || 'TZS';

  // ==================== Summary Section ====================
  const grossAmount = Number(claim.amount) || 0;
  const vatPercentage = claim.vat_percentage || 0;
  const vatAmount = grossAmount * (vatPercentage / 100);

  const summaryItems = [
    {
      id: 'gross',
      particular: 'Gross Amount Certified',
      amount: grossAmount,
      complement_ledger: null,
      type: null as 'addition' | 'deduction' | null,
    },
    ...(vatPercentage > 0
      ? [{
          id: 'vat',
          particular: `VAT (${vatPercentage}%)`,
          amount: vatAmount,
          complement_ledger: null,
          type: null,
        }]
      : []),
    ...(claim.adjustments || []).map((adj) => ({
      id: adj.id ?? `adj-${Math.random()}`,
      particular: adj.description,
      complement_ledger: adj.complement_ledger ?? null,
      type: adj.type,
      amount: adj.type === 'deduction' ? -Number(adj.amount) : Number(adj.amount),
    })),
  ];

  const grandTotal = summaryItems.reduce((sum, item) => sum + Number(item.amount), 0);

  // ==================== Claim Derivations ====================
  const claimedItems = claim.claim_items.map((item, index) => {
    const previousQty = item.previous_certified_quantity || 0;
    const presentQty = item.certified_quantity || 0;
    const cumulativeQty = previousQty + presentQty;
    const rate = item.project_deliverable?.contract_rate || 0;

    return {
      sn: index + 1,
      description: item.project_deliverable?.description || '',
      unit: item.measurement_unit?.symbol || '',
      ledger: item.revenue_ledger?.name || '',
      remarks: item.remarks || '',
      previousQty,
      presentQty,
      cumulativeQty,
      unitRate: rate,
      previousAmount: previousQty * rate,
      presentAmount: presentQty * rate,
      cumulativeAmount: cumulativeQty * rate,
    };
  });

  const totals = claimedItems.reduce(
    (acc, item) => ({
      previousAmount: acc.previousAmount + item.previousAmount,
      presentAmount: acc.presentAmount + item.presentAmount,
      cumulativeAmount: acc.cumulativeAmount + item.cumulativeAmount,
    }),
    { previousAmount: 0, presentAmount: 0, cumulativeAmount: 0 }
  );

  const formatAmount = (amount: number) => {
    const formatted = Math.abs(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return amount < 0 ? `-${formatted}` : formatted;
  };

  return (
    <Box sx={{ bgcolor: 'background.paper' }}>
      {/* ==================== Header ==================== */}
      <Grid container spacing={3} sx={{ mb: 5, alignItems: 'center' }}>
        <Grid size={{ xs: 12, md: 8 }} textAlign="right">
          <Typography variant="h4" sx={{ color: headerColor }}>
            PAYMENT CLAIM
          </Typography>
          <Typography variant="h5" fontWeight="bold" sx={{ mt: 1 }}>
            {claim.claimNo}
          </Typography>
          {claim.project?.name && (
            <Typography variant="subtitle1" color="text.secondary">
              Project: {claim.project.name}
            </Typography>
          )}
        </Grid>
      </Grid>

      {/* ==================== Claim Info ==================== */}
      <Grid container spacing={4} sx={{ mb: 5 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Claim Date
          </Typography>
          <Typography variant="body1" fontWeight="medium">
            {readableDate(claim.claim_date, false)}
          </Typography>
        </Grid>

        {claim.remarks && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Remarks
            </Typography>
            <Typography variant="body1">{claim.remarks}</Typography>
          </Grid>
        )}
      </Grid>

      {/* ==================== Summary Table (Right Aligned) ==================== */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h6" sx={{ color: contrastText, textAlign: 'center' }}>
          Summary
        </Typography>

        <TableContainer component={Paper} elevation={3}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: mainColor }}>
                <TableCell sx={{ border: `1px solid ${contrastText}`, color: contrastText, fontWeight: 'bold' }}>S/N</TableCell>
                <TableCell sx={{ border: `1px solid ${contrastText}`, color: contrastText, fontWeight: 'bold' }}>Particulars</TableCell>
                <TableCell align="right" sx={{ border: `1px solid ${contrastText}`, color: contrastText, fontWeight: 'bold' }}>
                  Amount ({currencyCode})
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {summaryItems.map((item, index) => (
                <TableRow key={item.id} sx={{ bgcolor: index % 2 === 1 ? theme.palette.action.hover : 'inherit' }}>
                  <TableCell sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}>{index + 1}.</TableCell>
                  <TableCell sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}>
                    <Box>
                      <Typography variant="body2">{item.particular}</Typography>
                      {item.complement_ledger?.name && (
                        <Typography variant="caption" color="text.secondary">
                          ({item.complement_ledger.name})
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}>
                    <Typography sx={{ color: item.type === 'deduction' ? 'error.main' : 'inherit', fontWeight: 'medium' }}>
                      {formatAmount(Number(item.amount))}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}

              <TableRow sx={{ backgroundColor: mainColor }}>
                <TableCell colSpan={2} align="center" sx={{ border: `1px solid ${contrastText}`, color: contrastText, fontWeight: 'bold' }}>
                  Grand Total ({currencyCode})
                </TableCell>
                <TableCell align="right" sx={{ border: `1px solid ${contrastText}`, color: contrastText, fontWeight: 'bold' }}>
                  {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* ==================== Claim Derivations Table ==================== */}
      <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
        Claim Derivations
      </Typography>

      <TableContainer component={Paper} elevation={3} sx={{ mb: 6, overflowX: 'auto' }}>
        <Table size="small" sx={{ borderCollapse: 'collapse' }}>
          <TableHead>
            {/* Group Header Row */}
            <TableRow sx={{ backgroundColor: mainColor }}>
              <TableCell
                colSpan={3}
                sx={{
                  border: `1px solid ${contrastText}`,
                  color: contrastText,
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}
              />
              <TableCell
                colSpan={3}
                align="center"
                sx={{
                  border: `1px solid ${contrastText}`,
                  color: contrastText,
                  fontWeight: 'bold',
                }}
              >
                Price Schedule
              </TableCell>
              <TableCell
                colSpan={3}
                align="center"
                sx={{
                  border: `1px solid ${contrastText}`,
                  color: contrastText,
                  fontWeight: 'bold',
                }}
              >
                Quantity
              </TableCell>
              <TableCell
                colSpan={3}
                align="center"
                sx={{
                  border: `1px solid ${contrastText}`,
                  color: contrastText,
                  fontWeight: 'bold',
                }}
              >
                Amount ({currencyCode})
              </TableCell>
            </TableRow>

            <TableRow sx={{ backgroundColor: mainColor + 'dd' }}>
              {[
                'S/N',
                'Description',
                'Unit',
                'Qty',
                'Rate',
                'Amount',
                'Previous',
                'Present',
                'Cumulative',
                'Previous',
                'Present',
                'Cumulative',
              ].map((header, idx) => (
                <TableCell
                  key={header}
                  align={idx >= 3 ? 'right' : idx === 2 ? 'center' : 'left'}
                  sx={{
                    border: `1px solid ${contrastText}`,
                    color: contrastText,
                    fontWeight: 'bold',
                    fontSize: '0.875rem',
                  }}
                >
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {claimedItems.map((item, index) => (
              <TableRow
                key={item.sn}
                sx={{
                  bgcolor: index % 2 === 1 ? theme.palette.action.hover : 'inherit',
                }}
              >
                <TableCell sx={{ border: '1px solid rgba(224, 224, 224, 1)', py: 1 }}>
                  {item.sn}.
                </TableCell>
                <TableCell sx={{ border: '1px solid rgba(224, 224, 224, 1)', py: 1 }}>
                  <Box>
                    <Typography variant="body2">{item.description}</Typography>
                    {item.ledger && (
                      <Typography variant="caption" color="text.secondary">
                        ({item.ledger})
                      </Typography>
                    )}
                    {item.remarks && (
                      <Typography variant="caption" color="text.secondary">
                        ({item.remarks})
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell align="center" sx={{ border: '1px solid rgba(224, 224, 224, 1)', py: 1 }}>
                  {item.unit}
                </TableCell>
                <TableCell align="right" sx={{ border: '1px solid rgba(224, 224, 224, 1)', py: 1 }}>
                  {item.presentQty.toLocaleString()}
                </TableCell>
                <TableCell align="right" sx={{ border: '1px solid rgba(224, 224, 224, 1)', py: 1 }}>
                  {item.unitRate.toLocaleString()}
                </TableCell>
                <TableCell align="right" sx={{ border: '1px solid rgba(224, 224, 224, 1)', py: 1 }}>
                  {item.presentAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell align="right" sx={{ border: '1px solid rgba(224, 224, 224, 1)', py: 1 }}>
                  {item.previousQty.toLocaleString()}
                </TableCell>
                <TableCell align="right" sx={{ border: '1px solid rgba(224, 224, 224, 1)', py: 1 }}>
                  {item.presentQty.toLocaleString()}
                </TableCell>
                <TableCell align="right" sx={{ border: '1px solid rgba(224, 224, 224, 1)', py: 1 }}>
                  {item.cumulativeQty.toLocaleString()}
                </TableCell>
                <TableCell align="right" sx={{ border: '1px solid rgba(224, 224, 224, 1)', py: 1 }}>
                  {item.previousAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell align="right" sx={{ border: '1px solid rgba(224, 224, 224, 1)', py: 1 }}>
                  {item.presentAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell align="right" sx={{ border: '1px solid rgba(224, 224, 224, 1)', py: 1 }}>
                  {item.cumulativeAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            ))}

            {/* Grand Total Row */}
            <TableRow sx={{ backgroundColor: mainColor }}>
              <TableCell
                colSpan={9}
                align="right"
                sx={{
                  border: `1px solid ${contrastText}`,
                  color: contrastText,
                  fontWeight: 'bold',
                  py: 1.5,
                }}
              >
                GRAND TOTAL ({currencyCode})
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  border: `1px solid ${contrastText}`,
                  color: contrastText,
                  fontWeight: 'bold',
                  py: 1.5,
                }}
              >
                {totals.previousAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  border: `1px solid ${contrastText}`,
                  color: contrastText,
                  fontWeight: 'bold',
                  py: 1.5,
                }}
              >
                {totals.presentAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  border: `1px solid ${contrastText}`,
                  color: contrastText,
                  fontWeight: 'bold',
                  py: 1.5,
                }}
              >
                {totals.cumulativeAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* ==================== Signature ==================== */}
      <Box sx={{ mt: 10, display: 'flex', justifyContent: 'flex-end' }}>
        <Box sx={{ width: 300, textAlign: 'center' }}>
          <Typography variant="subtitle1" sx={{ color: headerColor }}>
            Prepared By:
          </Typography>
          <Typography variant="body1" fontWeight="medium">
            {claim.creator?.name}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default ClaimOnscreen;