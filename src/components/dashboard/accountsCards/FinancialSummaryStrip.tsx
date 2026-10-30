'use client';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { ArrowDownward, ArrowUpward, Remove } from '@mui/icons-material';
import { Box, Skeleton, Tooltip, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import financialReportsServices from '../../accounts/reports/financial-reports-services';
import { useDashboardSettings } from '../Dashboard';

interface SummaryMetric {
  value: number;
  previous: number;
}

interface FinancialSummary {
  currency_code: string;
  period: { previous_from: string; previous_to: string };
  income_statement: {
    revenue: SummaryMetric;
    expenses: SummaryMetric;
    net_profit: SummaryMetric;
  };
  balance_sheet: {
    assets: SummaryMetric;
    liabilities: SummaryMetric;
    equity: SummaryMetric;
    cash: SummaryMetric;
    receivables: SummaryMetric;
    payables: SummaryMetric;
    inventory: SummaryMetric;
  };
}

interface StatConfig {
  label: string;
  metric: SummaryMetric;
  // Whether a rise versus the previous period is good news (revenue) or bad
  // news (expenses, liabilities). Drives the colour of the delta only.
  higherIsBetter: boolean;
  // Colour the figure itself red when negative (profit, equity).
  signColoured: boolean;
}

// Strip text is 10% smaller than the theme's stock sizes.
const SCALE = 0.9;
const scaled = (size: string | number | undefined, fallback: string) =>
  typeof size === 'number'
    ? `${size * SCALE}px`
    : `calc(${size ?? fallback} * ${SCALE})`;

const compact = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 2,
});

// Full figure while it fits (up to hundreds of millions), shortened from a billion.
const legendAmount = (value: number) =>
  Math.abs(value) >= 1e9
    ? compact.format(value)
    : value.toLocaleString('en-US', { maximumFractionDigits: 0 });

// Both trend cards render a strip; sharing the query key means one request.
export function useFinancialSummary() {
  const {
    chartFilters: { from, to, cost_center_ids },
  } = useDashboardSettings();

  return useQuery<FinancialSummary>({
    queryKey: ['financialSummary', from, to, cost_center_ids],
    queryFn: () =>
      financialReportsServices.dashboardSummary({ from, to, cost_center_ids }),
  });
}

function Stat({
  stat,
  currency,
  comparisonLabel,
  inline = false,
}: {
  stat: StatConfig;
  currency: string;
  comparisonLabel: string;
  // One line (label, figure, change) for use as a chart legend.
  inline?: boolean;
}) {
  const { theme } = useJumboTheme();
  const { value, previous } = stat.metric;

  const change = value - previous;
  const percent =
    Math.abs(previous) > 0.005 ? (change / Math.abs(previous)) * 100 : null;
  const isFlat = Math.abs(change) < 0.005;
  const isGood = stat.higherIsBetter ? change > 0 : change < 0;
  const deltaColour = isFlat
    ? theme.palette.text.secondary
    : isGood
      ? theme.palette.success.main
      : theme.palette.error.main;
  const DeltaIcon = isFlat ? Remove : change > 0 ? ArrowUpward : ArrowDownward;

  if (inline) {
    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'baseline',
          justifyContent: 'center',
          gap: 0.75,
          minWidth: 0,
        }}
      >
        <Tooltip
          title={`${currency} ${value.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
        >
          <Typography
            noWrap
            sx={{
              fontWeight: 700,
              fontSize: scaled(theme.typography.h5.fontSize, '1.25rem'),
              color:
                stat.signColoured && value < 0
                  ? theme.palette.error.main
                  : 'inherit',
            }}
          >
            {legendAmount(value)}
          </Typography>
        </Tooltip>
        <Tooltip title={comparisonLabel}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.25,
              color: deltaColour,
            }}
          >
            <DeltaIcon sx={{ fontSize: 11 }} />
            <Typography
              variant='caption'
              sx={{
                fontWeight: 600,
                fontSize: scaled(theme.typography.caption.fontSize, '0.75rem'),
              }}
            >
              {percent === null
                ? compact.format(Math.abs(change))
                : `${Math.abs(percent).toFixed(1)}%`}
            </Typography>
          </Box>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Box sx={{ minWidth: 0, flex: 1, textAlign: 'center' }}>
      <Typography
        variant='caption'
        color='text.secondary'
        component='div'
        noWrap
        sx={{
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          fontWeight: 600,
          fontSize: scaled(theme.typography.caption.fontSize, '0.75rem'),
        }}
      >
        {stat.label}
      </Typography>
      <Tooltip
        title={`${currency} ${value.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`}
      >
        <Typography
          variant='h3'
          noWrap
          sx={{
            mb: 0,
            fontWeight: 700,
            fontSize: scaled(theme.typography.h3.fontSize, '1.5rem'),
            color:
              stat.signColoured && value < 0
                ? theme.palette.error.main
                : 'inherit',
          }}
        >
          {compact.format(value)}
        </Typography>
      </Tooltip>
      <Tooltip title={comparisonLabel}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.25,
            color: deltaColour,
          }}
        >
          <DeltaIcon sx={{ fontSize: 11 }} />
          <Typography
            variant='caption'
            sx={{
              fontWeight: 600,
              fontSize: scaled(theme.typography.caption.fontSize, '0.75rem'),
            }}
          >
            {percent === null
              ? compact.format(Math.abs(change))
              : `${Math.abs(percent).toFixed(1)}%`}
          </Typography>
        </Box>
      </Tooltip>
    </Box>
  );
}

// A bare figure + change for a chart legend whose number isn't one of the
// summary's own metrics (e.g. operating expenses only, not total expenses).
export function FigureLegend({
  value,
  previous,
  higherIsBetter = true,
}: {
  value: number;
  previous: number;
  higherIsBetter?: boolean;
}) {
  const cards = useDictionary().dashboardCards;
  const { data: summary } = useFinancialSummary();
  if (!summary) return <Skeleton variant='rounded' height={28} />;

  const previousStart = dayjs(summary.period.previous_from);
  const previousEnd = dayjs(summary.period.previous_to).subtract(1, 'second');
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Stat
        inline
        stat={{ label: '', metric: { value, previous }, higherIsBetter, signColoured: false }}
        currency={summary.currency_code}
        comparisonLabel={`${cards.vsPreviousPeriod}: ${previousStart.format('D MMM YYYY')} – ${previousEnd.format('D MMM YYYY')}`}
      />
    </Box>
  );
}

export type SummaryKind =
  | 'incomeStatement'
  | 'revenue'
  | 'expenses'
  | 'balanceSheet'
  | 'receivablesPayables'
  | 'inventory';

function FinancialSummaryStrip({
  kind,
  inline = false,
}: {
  kind: SummaryKind;
  inline?: boolean;
}) {
  const cards = useDictionary().dashboardCards;
  const { data: summary, isLoading, isError } = useFinancialSummary();

  if (isError) return null;

  if (isLoading || !summary) {
    return (
      <Skeleton variant='rounded' height={inline ? 28 : 52} sx={{ mb: inline ? 0 : 1 }} />
    );
  }

  const { income_statement: pl, balance_sheet: bs, period } = summary;

  // previous_to is the exclusive end of the previous window (= this period's
  // start), so the last day it actually covers is a moment earlier.
  const previousStart = dayjs(period.previous_from);
  const previousEnd = dayjs(period.previous_to).subtract(1, 'second');
  const comparisonLabel =
    kind === 'incomeStatement' || kind === 'revenue' || kind === 'expenses'
      ? `${cards.vsPreviousPeriod}: ${previousStart.format('D MMM YYYY')} – ${previousEnd.format('D MMM YYYY')}`
      : `${cards.vsBalanceAsAt} ${previousEnd.format('D MMM YYYY')}`;
  const stat = (
    label: string,
    metric: SummaryMetric,
    higherIsBetter = true,
    signColoured = false
  ): StatConfig => ({ label, metric, higherIsBetter, signColoured });

  const statsByKind: Record<SummaryKind, StatConfig[]> = {
    incomeStatement: [
      stat(cards.revenue, pl.revenue),
      stat(cards.expenses, pl.expenses, false),
      stat(cards.netProfit, pl.net_profit, true, true),
    ],
    revenue: [stat(cards.revenue, pl.revenue)],
    expenses: [stat(cards.expenses, pl.expenses, false)],
    balanceSheet: [
      stat(cards.totalAssets, bs.assets),
      stat(cards.totalLiabilities, bs.liabilities, false),
      stat(cards.equity, bs.equity, true, true),
      stat(cards.cashAndBank, bs.cash, true, true),
    ],
    receivablesPayables: [
      stat(cards.totalReceivable, bs.receivables),
      stat(cards.totalPayable, bs.payables, false),
    ],
    inventory: [stat(cards.inventoryValue, bs.inventory)],
  };
  const stats = statsByKind[kind];
  return (
    <Box
      sx={
        inline
          ? { display: 'flex', justifyContent: 'center', gap: 2 }
          : {
              display: 'flex',
              gap: 1,
              mb: 1,
              pb: 1,
              borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
            }
      }
    >
      {stats.map((item) => (
        <Stat
          key={item.label}
          stat={item}
          currency={summary.currency_code}
          comparisonLabel={comparisonLabel}
          inline={inline}
        />
      ))}
    </Box>
  );
}

export default FinancialSummaryStrip;
