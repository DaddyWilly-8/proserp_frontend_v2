import React from 'react';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import {
  Dialog,
  Typography,
  Box,
  Grid,
  Skeleton,
  Paper,
  Divider,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import requisitionsServices from '@/components/processApproval/requisitionsServices';
import { Currency } from '@/components/masters/Currencies/CurrencyType';

interface LedgerBudgetCheckDetailsProps {
  ledgerId: number;
  costCenterId: number;
  open: boolean;
  onClose: () => void;
  currency?: Currency;
  ledgerName?: string;
}

const fetchLedgerBudgetCheck = async (
  ledgerId: number,
  costCenterId: number
) => {
  return requisitionsServices.expenseBudgetCheck({
    ledger_id: ledgerId,
    cost_center_id: costCenterId,
  });
};

/* ---------------- Reusable stat item ---------------- */
const StatItem = ({
  label,
  value,
  currency,
}: {
  label: string;
  value?: number;
  currency?: string;
}) => (
  <Box>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="h6">
    {currency ? ` ${currency}` : ''} {''}
      {value?.toLocaleString?.() ?? 0}
    </Typography>
  </Box>
);

/* ---------------- Section wrapper (same as product) ---------------- */
const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <Paper variant="outlined" sx={{ p: 2 }}>
    <Typography variant="subtitle1" mb={1}>
      {title}
    </Typography>
    <Divider sx={{ mb: 2 }} />
    <Grid container spacing={2}>
      {children}
    </Grid>
  </Paper>
);

const LedgerBudgetCheckDetails: React.FC<
  LedgerBudgetCheckDetailsProps
> = ({ ledgerName, ledgerId, costCenterId, open, onClose, currency }) => {
  const dictionary = useDictionary();
  const { data, isFetching } = useQuery({
    queryKey: ['ledgerBudgetCheck', { ledgerId, costCenterId }],
    queryFn: () => fetchLedgerBudgetCheck(ledgerId, costCenterId),
    enabled: open && !!ledgerId && !!costCenterId,
  });

  const currencyCode = currency?.code;

  return (
    <Dialog open={open} maxWidth="sm" fullWidth onClose={onClose}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box mb={3}>
          <Typography variant="h4" textAlign={'center'} fontWeight={700}>
            {dictionary.forms.requisitions.budgetCheck.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign={'center'}>
            {ledgerName}
          </Typography>
        </Box>

        {isFetching ? (
          <Skeleton variant="rectangular" width="100%" height={220} />
        ) : data ? (
          <Grid container spacing={3}>
            {/* ================= Budget Allocation ================= */}
            <Grid size={{ xs: 12 }}>
              <Section title={dictionary.forms.requisitions.budgetCheck.budgetAllocation}>
                <Grid size={{ xs: 6 }}>
                  <StatItem
                    label={dictionary.forms.requisitions.budgetCheck.budgetedAmount}
                    value={data.budgeted}
                    currency={currencyCode}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <StatItem
                    label={dictionary.forms.requisitions.budgetCheck.spentAmount}
                    value={data.spent}
                    currency={currencyCode}
                  />
                </Grid>
              </Section>
            </Grid>

            {/* ================= Request & Approval ================= */}
            <Grid size={{ xs: 12 }}>
              <Section title={dictionary.forms.requisitions.budgetCheck.requestAndApproval}>
                <Grid size={{ xs: 6 }}>
                  <StatItem
                    label={dictionary.forms.requisitions.budgetCheck.requestedAmount}
                    value={data.requested_amount}
                    currency={currencyCode}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <StatItem
                    label={dictionary.forms.requisitions.budgetCheck.approvedAmount}
                    value={data.approved_amount}
                    currency={currencyCode}
                  />
                </Grid>
              </Section>
            </Grid>

            {/* ================= Remaining / Utilization ================= */}
            <Grid size={{ xs: 12 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1"  mb={1}>
                  {dictionary.forms.requisitions.budgetCheck.remainingBalance}
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Typography
                  variant="h5"
                  color={
                    data.remaining < 0
                      ? 'error.main'
                      : 'success.main'
                  }
                  fontWeight={700}
                >
                  {data.remaining?.toLocaleString?.() ?? '-'}{currencyCode ? ` ${currencyCode}` : ''}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        ) : (
          <Typography color="text.secondary">
            {dictionary.forms.requisitions.budgetCheck.noBudgetData}
          </Typography>
        )}
      </Box>
    </Dialog>
  );
};

export default LedgerBudgetCheckDetails;