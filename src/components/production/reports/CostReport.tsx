'use client';

import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import PDFContent from '@/components/pdf/PDFContent';
import { AuthOrganization } from '@/types/auth-types';
import { faFileExcel } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Add, Remove, VisibilityOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { FC, JSX, ReactNode, useState } from 'react';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import ProductionCostReportPdf from './ProductionCostReportPdf';
import productionReportsServices, {
  CostReportResponse,
} from './productionReportsServices';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const formatCurrency = (value: number | string): string =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatQuantity = (value: number | string): string =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatUnitCost = (value: number | string): string =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

interface SummaryCardProps {
  label: string;
  value: string | number;
  accentColor: string;
  valueColor?: string;
  tooltip: string;
}

function SummaryCard({
  label,
  value,
  accentColor,
  valueColor,
  tooltip,
}: SummaryCardProps): JSX.Element {
  return (
    <Tooltip title={tooltip} arrow>
      <Card variant='outlined' sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant='body2' color='text.secondary' gutterBottom>
            {label}
          </Typography>
          <Typography variant='h5' sx={{ color: valueColor || accentColor }}>
            {value}
          </Typography>
        </CardContent>
      </Card>
    </Tooltip>
  );
}

interface HelpTooltipTextProps {
  label: ReactNode;
  description: string;
}

function HelpTooltipText({
  label,
  description,
}: HelpTooltipTextProps): JSX.Element {
  return (
    <Tooltip title={description} arrow>
      <Box
        component='span'
        sx={{ display: 'inline-flex', alignItems: 'center' }}
      >
        {label}
      </Box>
    </Tooltip>
  );
}

const COST_PALETTE = ['#1976d2', '#ed6c02', '#2e7d32'];

interface CostPieTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
}

function CostPieTooltip({
  active,
  payload,
}: CostPieTooltipProps): JSX.Element | null {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <Paper elevation={3} sx={{ px: 2, py: 1 }}>
      <Typography variant='body2' fontWeight={700}>
        {name}
      </Typography>
      <Typography variant='body2'>{formatCurrency(value)}</Typography>
    </Paper>
  );
}

interface CostBreakdownChartProps {
  summary: any;
}

function CostBreakdownChart({ summary }: CostBreakdownChartProps): JSX.Element {
  const dictionary = useDictionary();
  const dict = dictionary.reports.productionReports;
  const theme = useTheme();
  const material = Number(summary?.total_material_cost || 0);
  const expense = Number(summary?.total_ledger_expense_cost || 0);
  const offset = Number(summary?.total_by_product_offset || 0);

  const data = [
    { name: dict.materials, value: material },
    { name: dict.ledgerExpenses, value: expense },
    { name: dict.byProductOffset, value: offset },
  ].filter((d) => d.value > 0);

  if (!data.length) {
    return (
      <Typography variant='body2' color='text.secondary' align='center'>
        {dict.noCostData}
      </Typography>
    );
  }

  return (
    <Box sx={{ width: '100%', height: 260 }}>
      <ResponsiveContainer width='100%' height='100%'>
        <PieChart>
          <Pie
            data={data}
            cx='50%'
            cy='50%'
            innerRadius='45%'
            outerRadius='70%'
            paddingAngle={3}
            dataKey='value'
            label={({ name, percent }: any) =>
              `${name} (${(percent * 100).toFixed(1)}%)`
            }
            labelLine
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={COST_PALETTE[index % COST_PALETTE.length]}
              />
            ))}
          </Pie>
          <RechartsTooltip content={<CostPieTooltip />} />
          <Legend
            formatter={(value) => (
              <Typography
                component='span'
                variant='caption'
                sx={{ color: theme.palette.text.primary }}
              >
                {value}
              </Typography>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
}

interface MaterialItemAccordionProps {
  item: any;
}

function MaterialItemAccordion({
  item,
}: MaterialItemAccordionProps): JSX.Element {
  const dictionary = useDictionary();
  const dict = dictionary.reports.productionReports;
  const [expanded, setExpanded] = useState<boolean>(false);
  return (
    <Accordion
      disableGutters
      variant='outlined'
      expanded={expanded}
      onChange={(_, v) => setExpanded(v)}
    >
      <AccordionSummary
        expandIcon={expanded ? <Remove /> : <Add />}
        sx={{
          px: 3,
          flexDirection: 'row-reverse',
          '.MuiAccordionSummary-content': {
            alignItems: 'center',
            '&.Mui-expanded': {
              margin: '12px 0',
            },
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
            '& svg': {
              fontSize: '1.25rem',
            },
          },
          '&:hover': {
            '.MuiTypography-root': {},
          },
        }}
      >
        <Grid container spacing={2} sx={{ width: '100%', pr: 1 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <HelpTooltipText
              label={<Typography>{item.product?.name}</Typography>}
              description={dict.help.materialProduct}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <HelpTooltipText
              label={<Typography>{item.measurement_unit?.symbol}</Typography>}
              description={dict.help.materialUnit}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <HelpTooltipText
              label={
                <Typography align='right'>
                  {formatQuantity(item.total_quantity)}
                </Typography>
              }
              description={dict.help.materialTotalQty}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <HelpTooltipText
              label={
                <Typography align='right'>
                  {formatUnitCost(item.average_unit_cost)}
                </Typography>
              }
              description={dict.help.materialAvgUnitCost}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <HelpTooltipText
              label={
                <Typography align='right'>
                  {formatCurrency(item.total_cost)}
                </Typography>
              }
              description={dict.help.materialTotalCost}
            />
          </Grid>
        </Grid>
      </AccordionSummary>
      <AccordionDetails>
        <TableContainer component={Paper} variant='outlined'>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>
                  <HelpTooltipText
                    label={dict.batch}
                    description={dict.help.materialBatch}
                  />
                </TableCell>
                <TableCell>
                  <HelpTooltipText
                    label={dict.date}
                    description={dict.help.materialBatchDate}
                  />
                </TableCell>
                <TableCell align='right'>
                  <HelpTooltipText
                    label={dict.qty}
                    description={dict.help.materialBatchQty}
                  />
                </TableCell>
                <TableCell align='right'>
                  <HelpTooltipText
                    label={dict.unitCost}
                    description={dict.help.materialBatchUnitCost}
                  />
                </TableCell>
                <TableCell align='right'>
                  <HelpTooltipText
                    label={dict.total}
                    description={dict.help.materialBatchTotal}
                  />
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(item.batches || []).map((batch: any) => (
                <TableRow key={`${item.product?.id}-${batch.batch_id}`}>
                  <TableCell>{batch.batchNo}</TableCell>
                  <TableCell>{readableDate(batch.end_date, true)}</TableCell>
                  <TableCell align='right'>
                    {formatQuantity(batch.quantity)}
                  </TableCell>
                  <TableCell align='right'>
                    {formatUnitCost(batch.unit_cost)}
                  </TableCell>
                  <TableCell align='right'>
                    {formatCurrency(batch.total_cost)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </AccordionDetails>
    </Accordion>
  );
}

interface LedgerItemAccordionProps {
  item: any;
}

function LedgerItemAccordion({ item }: LedgerItemAccordionProps): JSX.Element {
  const dictionary = useDictionary();
  const dict = dictionary.reports.productionReports;
  const [expanded, setExpanded] = useState<boolean>(false);
  const showExchangeRate = (item.batches || []).some(
    (batch: any) => Number(batch.exchange_rate || 1) !== 1
  );

  return (
    <Accordion
      disableGutters
      variant='outlined'
      expanded={expanded}
      onChange={(_, v) => setExpanded(v)}
    >
      <AccordionSummary
        expandIcon={expanded ? <Remove /> : <Add />}
        sx={{
          px: 3,
          flexDirection: 'row-reverse',
          '.MuiAccordionSummary-content': {
            alignItems: 'center',
            '&.Mui-expanded': {
              margin: '12px 0',
            },
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
            '& svg': {
              fontSize: '1.25rem',
            },
          },
          '&:hover': {
            '.MuiTypography-root': {},
          },
        }}
      >
        <Grid container spacing={2} sx={{ width: '100%', pr: 1 }}>
          <Grid size={{ xs: 12, md: 5 }}>
            <HelpTooltipText
              label={<Typography>{item.ledger?.name}</Typography>}
              description={dict.help.ledgerName}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <HelpTooltipText
              label={<Typography>{item.currency?.name}</Typography>}
              description={dict.help.ledgerCurrency}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 4 }}>
            <HelpTooltipText
              label={
                <Typography align='right'>
                  {formatCurrency(item.total_amount)}
                </Typography>
              }
              description={dict.help.ledgerTotal}
            />
          </Grid>
        </Grid>
      </AccordionSummary>
      <AccordionDetails>
        <TableContainer component={Paper} variant='outlined'>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>
                  <HelpTooltipText
                    label={dict.batch}
                    description={dict.help.ledgerBatch}
                  />
                </TableCell>
                <TableCell>
                  <HelpTooltipText
                    label={dict.date}
                    description={dict.help.ledgerDate}
                  />
                </TableCell>
                <TableCell align='right'>
                  <HelpTooltipText
                    label={dict.qty}
                    description={dict.help.ledgerQty}
                  />
                </TableCell>
                <TableCell align='right'>
                  <HelpTooltipText
                    label={dict.rate}
                    description={dict.help.ledgerRate}
                  />
                </TableCell>
                {showExchangeRate && (
                  <TableCell align='right'>
                    <HelpTooltipText
                      label={dict.exchangeRate}
                      description={dict.help.ledgerExchangeRate}
                    />
                  </TableCell>
                )}
                <TableCell align='right'>
                  <HelpTooltipText
                    label={dict.total}
                    description={dict.help.ledgerBatchTotal}
                  />
                </TableCell>
                <TableCell>
                  <HelpTooltipText
                    label={dict.remarks}
                    description={dict.help.ledgerRemarks}
                  />
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(item.batches || []).map((batch: any) => (
                <TableRow
                  key={`${item.ledger?.id}-${batch.batch_id}-${batch.remarks || ''}`}
                >
                  <TableCell>{batch.batchNo}</TableCell>
                  <TableCell>{readableDate(batch.end_date, true)}</TableCell>
                  <TableCell align='right'>
                    {formatQuantity(batch.quantity)}
                  </TableCell>
                  <TableCell align='right'>
                    {formatCurrency(batch.rate)}
                  </TableCell>
                  {showExchangeRate && (
                    <TableCell align='right'>
                      {formatUnitCost(batch.exchange_rate)}
                    </TableCell>
                  )}
                  <TableCell align='right'>
                    {formatCurrency(batch.total)}
                  </TableCell>
                  <TableCell>{batch.remarks}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </AccordionDetails>
    </Accordion>
  );
}

interface CostReportProps {
  report: CostReportResponse | null;
  isLoading: boolean;
  error: string;
  headerColor: string;
  comparisonOutputValue?: number;
}

interface CostReportDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  document: ReactNode;
  reportData?: any;
  authOrganization?: AuthOrganization | null;
  user?: any;
}

function CostReportDialog({
  open,
  setOpen,
  document,
  reportData,
  authOrganization,
  user,
}: CostReportDialogProps): JSX.Element {
  const dictionary = useDictionary();
  const dict = dictionary.reports.productionReports;
  const [isExporting, setIsExporting] = useState(false);

  const exportedData = {
    reportData: reportData,
    authOrganization: authOrganization,
    user: user,
  };

  const handlExcelExport = async (exportedData: any) => {
    setIsExporting(true);
    const { period } = reportData;
    const periodLabel = `${readableDate(period?.from, true)} – ${readableDate(period?.to, true)}`;
    try {
      const blob =
        await productionReportsServices.ExportProductionCostReportToExcel(
          exportedData
        );
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `production-cost-report_${periodLabel}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);

      // console.log('blob: ', blob);
    } catch (e) {
      console.log('error exporting: ', e);
    } finally {
      setIsExporting(false);
    }
  };
  return (
    <Dialog maxWidth='md' fullWidth open={open}>
      <DialogTitle>
        <Typography variant='body2'>{dict.productionCostReport}</Typography>
      </DialogTitle>
      <DialogContent>{document}</DialogContent>
      <DialogActions>
        <LoadingButton
          size='small'
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          loading={isExporting}
          onClick={() => handlExcelExport(exportedData)}
          color='success'
          variant='contained'
        >
          <FontAwesomeIcon icon={faFileExcel} color='green' /> Excel
        </LoadingButton>
        <Button size='small' variant='outlined' onClick={() => setOpen(false)}>
          {dict.close}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const CostReport: FC<CostReportProps> = ({
  report,
  isLoading,
  error,
  headerColor,
  comparisonOutputValue,
}): JSX.Element => {
  const dictionary = useDictionary();
  const dict = dictionary.reports.productionReports;
  const { authOrganization, authUser } = useJumboAuth();
  const user = authUser?.user;

  const [materialOpen, setMaterialOpen] = useState<boolean>(true);
  const [ledgerOpen, setLedgerOpen] = useState<boolean>(false);
  const [openCostPdf, setOpenCostPdf] = useState<boolean>(false);

  if (isLoading) {
    return (
      <Box sx={{ py: 6 }}>
        <Typography align='center'>{dict.loadingCostReport}</Typography>
      </Box>
    );
  }

  if (error) {
    return <></>;
  }

  if (!report) {
    return <></>;
  }

  if (!report?.summary?.total_batches) {
    return (
      <Alert severity='info'>{dict.noClosedBatches}</Alert>
    );
  }

  const difference =
    Number(comparisonOutputValue || 0) -
    Number(report.summary?.net_production_cost || 0);
  const matchesOutput = Math.abs(difference) < 0.01;

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent='space-between'
        alignItems={{ xs: 'end' }}
        spacing={2}
      >
        <Box></Box>
        <Stack direction='row' spacing={1}>
          <Tooltip title={dictionary.tooltips.previewCostReportPdf} arrow>
            <IconButton size='small' onClick={() => setOpenCostPdf(true)}>
              <VisibilityOutlined />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 3 }}>
          <SummaryCard
            label={dict.totalMaterialCost}
            value={formatCurrency(report.summary?.total_material_cost)}
            accentColor={headerColor}
            tooltip={dict.help.totalMaterialCost}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <SummaryCard
            label={dict.totalExpenseCost}
            value={formatCurrency(report.summary?.total_ledger_expense_cost)}
            accentColor={headerColor}
            tooltip={dict.help.totalExpenseCost}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <SummaryCard
            label={dict.byProductOffset}
            value={formatCurrency(report.summary?.total_by_product_offset)}
            accentColor={headerColor}
            valueColor='success.main'
            tooltip={dict.help.byProductOffset}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <SummaryCard
            label={dict.netProductionCost}
            value={formatCurrency(report.summary?.net_production_cost)}
            accentColor={headerColor}
            valueColor={headerColor}
            tooltip={dict.help.netProductionCost}
          />
        </Grid>
      </Grid>

      <Card variant='outlined'>
        <CardContent>
          <HelpTooltipText
            label={
              <Typography
                variant='subtitle1'
                sx={{ color: headerColor, mb: 2 }}
              >
                {dict.costBreakdown}
              </Typography>
            }
            description={dict.help.costBreakdown}
          />
          <CostBreakdownChart summary={report.summary} />
        </CardContent>
      </Card>

      <Accordion
        expanded={materialOpen}
        onChange={(_, v) => setMaterialOpen(v)}
      >
        <AccordionSummary
          expandIcon={materialOpen ? <Remove /> : <Add />}
          sx={{
            px: 3,
            flexDirection: 'row-reverse',
            '.MuiAccordionSummary-content': {
              alignItems: 'center',
              '&.Mui-expanded': {
                margin: '12px 0',
              },
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
              '& svg': {
                fontSize: '1.25rem',
              },
            },
            '&:hover': {
              '.MuiTypography-root': {},
            },
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ width: '100%', pr: 1 }}
            justifyContent='space-between'
          >
            <HelpTooltipText
              label={
                <Typography fontWeight={600}>{dict.materialConsumptions}</Typography>
              }
              description={dict.help.materialConsumptions}
            />
            <Tooltip
              title={dictionary.tooltips.numberOfMaterialProductsContributingCost}
              arrow
            >
              <Chip
                label={dict.productsCount.replace('{count}', String(report.material_consumptions?.length || 0))}
                size='small'
              />
            </Tooltip>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          {(report.material_consumptions || []).length ? (
            <Stack spacing={2}>
              {(report.material_consumptions || []).map((item, index) => (
                <MaterialItemAccordion
                  key={`${item.product?.id || index}-${index}`}
                  item={item}
                />
              ))}
            </Stack>
          ) : (
            <Alert severity='info'>
              {dict.noMaterialConsumptions}
            </Alert>
          )}
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={ledgerOpen} onChange={(_, v) => setLedgerOpen(v)}>
        <AccordionSummary
          expandIcon={ledgerOpen ? <Remove /> : <Add />}
          sx={{
            px: 3,
            flexDirection: 'row-reverse',
            '.MuiAccordionSummary-content': {
              alignItems: 'center',
              '&.Mui-expanded': {
                margin: '12px 0',
              },
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
              '& svg': {
                fontSize: '1.25rem',
              },
            },
            '&:hover': {
              '.MuiTypography-root': {},
            },
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ width: '100%', pr: 1 }}
            justifyContent='space-between'
          >
            <HelpTooltipText
              label={<Typography fontWeight={600}>{dict.ledgerExpenses}</Typography>}
              description={dict.help.ledgerExpenses}
            />
            <Tooltip
              title={dictionary.tooltips.numberOfLedgerAccountsContributingCost}
              arrow
            >
              <Chip
                label={dict.ledgersCount.replace('{count}', String(report.ledger_expenses?.length || 0))}
                size='small'
              />
            </Tooltip>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          {(report.ledger_expenses || []).length ? (
            <Stack spacing={2}>
              {(report.ledger_expenses || []).map((item, index) => (
                <LedgerItemAccordion
                  key={`${item.ledger?.id || index}-${index}`}
                  item={item}
                />
              ))}
            </Stack>
          ) : (
            <Alert severity='info'>
              {dict.noLedgerExpenses}
            </Alert>
          )}
        </AccordionDetails>
      </Accordion>

      <Card variant='outlined'>
        <CardContent>
          <HelpTooltipText
            label={
              <Typography
                variant='subtitle1'
                sx={{ color: headerColor, mb: 2 }}
              >
                {dict.byProductsOffset}
              </Typography>
            }
            description={dict.help.byProductsOffset}
          />
          {(report.by_products || []).length ? (
            <TableContainer component={Paper} variant='outlined'>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <HelpTooltipText
                        label={dict.product}
                        description={dict.help.byProductProduct}
                      />
                    </TableCell>
                    <TableCell>
                      <HelpTooltipText
                        label={dict.unit}
                        description={dict.help.byProductUnit}
                      />
                    </TableCell>
                    <TableCell align='right'>
                      <HelpTooltipText
                        label={dict.totalQty}
                        description={dict.help.byProductTotalQty}
                      />
                    </TableCell>
                    <TableCell align='right'>
                      <HelpTooltipText
                        label={dict.costReduction}
                        description={dict.help.byProductCostReduction}
                      />
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(report.by_products || []).map((item, index) => (
                    <TableRow key={`${item.product?.id || index}-${index}`}>
                      <TableCell>{item.product?.name}</TableCell>
                      <TableCell>{item.measurement_unit?.symbol}</TableCell>
                      <TableCell align='right'>
                        {formatQuantity(item.total_quantity)}
                      </TableCell>
                      <TableCell align='right'>
                        {formatCurrency(item.total_market_value)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity='info'>
              {dict.noByProductsOffset}
            </Alert>
          )}
        </CardContent>
      </Card>

      <CostReportDialog
        open={openCostPdf}
        setOpen={setOpenCostPdf}
        authOrganization={authOrganization}
        reportData={report}
        user={user}
        document={
          <PDFContent
            document={
              <ProductionCostReportPdf
                reportData={report}
                organization={authOrganization?.organization || undefined}
                user={user}
                dictionary={dictionary}
              />
            }
            fileName='production-cost-report'
          />
        }
      />
    </Stack>
  );
};

export default CostReport;
