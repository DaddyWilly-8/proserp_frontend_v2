'use client';

import React, { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  Grid,
  Divider,
  AccordionDetails,
  Typography,
  Tooltip,
  useTheme,
} from '@mui/material';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { AuthOrganization } from '@/types/auth-types';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface Transaction {
  transactionDate: string;
  voucherNo: string;
  reference: string;
  description: string;
  amount: number;
}

interface ReportItem {
  name: string;
  opening_balance: number;
  incoming_total: number;
  outgoing_total: number;
  closing_balance: number;
  incoming_transactions?: Record<string, Transaction>;
  outgoing_transactions?: Record<string, Transaction>;
}

interface CashierReportOnScreenProps {
  reportData: ReportItem[];
  authOrganization: AuthOrganization;
}

const CashierReportOnScreen: React.FC<CashierReportOnScreenProps> = ({
  reportData,
  authOrganization,
}) => {
  const dictionary = useDictionary();
  const t = dictionary.reports.accountsReports;
  const theme = useTheme();
  const [expanded, setExpanded] = useState<boolean[]>(Array(reportData.length).fill(false));
  const currencyCode = authOrganization.base_currency.code;

  const handleChange = (index: number) => {
    const newExpanded = [...expanded];
    newExpanded[index] = !newExpanded[index];
    setExpanded(newExpanded);
  };

  const currency = (value: number) =>
    value.toLocaleString('en-US', {
      style: 'currency',
      currency: currencyCode,
    });

  return (
    <>
      {reportData.map((item, index) => {
        const incomingTotal =
          item.incoming_transactions
            ? Object.values(item.incoming_transactions).reduce((s, t) => s + t.amount, 0)
            : 0;

        const outgoingTotal =
          item.outgoing_transactions
            ? Object.values(item.outgoing_transactions).reduce((s, t) => s + t.amount, 0)
            : 0;

        const closingColor =
          item.closing_balance > 0
            ? theme.palette.info.main
            : item.closing_balance < 0
            ? theme.palette.warning.main
            : theme.palette.text.secondary;

        return (
          <Accordion
            key={index}
            expanded={expanded[index]}
            onChange={() => handleChange(index)}
            sx={{ borderRadius: 2, border: 1, borderColor: 'divider', mb: 1 }}
          >
            <AccordionSummary
              expandIcon={expanded[index] ? <RemoveIcon /> : <AddIcon />}
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
                  '.MuiTypography-root': {
                  },
                },
              }}
            >
              <Grid container spacing={1} alignItems="center" width={'100%'}>
                <Grid 
                  size={12} 
                  textAlign="center"                   
                  sx={{
                    borderBottom: 2,
                    borderColor: 'divider'
                  }}
                >
                  <Tooltip title={dictionary.tooltips.cashAccountLedgerName}>
                    <Typography variant="h4" fontWeight={expanded[index] ? 600 : 400}>
                      {item.name}
                    </Typography>
                  </Tooltip>
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                  <Tooltip title={dictionary.tooltips.balanceAtTheBeginningOfThe}>
                    <Typography variant="body2" color="text.secondary">
                      {t.cashierReport.openingBalance}
                    </Typography>
                  </Tooltip>
                  <Tooltip title={currency(item.opening_balance)}>
                    <Typography>{currency(item.opening_balance)}</Typography>
                  </Tooltip>
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                  <Tooltip title={dictionary.tooltips.totalAmountReceivedDuringThePeriod}>
                    <Typography variant="body2" color="text.secondary">
                      {t.cashierReport.incomingTotal}
                    </Typography>
                  </Tooltip>
                  <Tooltip title={currency(item.incoming_total)}>
                    <Typography sx={{ color: theme.palette.success.main }} fontWeight={600}>
                      {currency(item.incoming_total)}
                    </Typography>
                  </Tooltip>
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                  <Tooltip title={dictionary.tooltips.totalAmountPaidOutDuringThe}>
                    <Typography variant="body2" color="text.secondary">
                      {t.cashierReport.outgoingTotal}
                    </Typography>
                  </Tooltip>
                  <Tooltip title={currency(item.outgoing_total)}>
                    <Typography sx={{ color: theme.palette.error.main }} fontWeight={600}>
                      {currency(item.outgoing_total)}
                    </Typography>
                  </Tooltip>
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                  <Tooltip title={dictionary.tooltips.finalBalanceAfterAllTransactions}>
                    <Typography variant="body2" color="text.secondary">
                      {t.cashierReport.closingBalance}
                    </Typography>
                  </Tooltip>
                  <Tooltip title={currency(item.closing_balance)}>
                    <Typography fontWeight={700} sx={{ color: closingColor }}>
                      {currency(item.closing_balance)}
                    </Typography>
                  </Tooltip>
                </Grid>
              </Grid>
            </AccordionSummary>

            <AccordionDetails>
              {/* INCOMING */}
              {item.incoming_transactions && (
                <>
                  <Tooltip title={dictionary.tooltips.allMoneyReceivedInThisPeriod}>
                    <Typography variant="h6" textAlign="center" mt={2}>
                      {t.cashierReport.incomingTransactions}
                    </Typography>
                  </Tooltip>

                  {Object.values(item.incoming_transactions).map((t, i) => (
                    <Grid
                      key={i}
                      container
                      spacing={1}
                      alignItems="center"
                      sx={{ borderTop: 1, borderColor: 'divider', py: 0.5 }}
                    >
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Tooltip title={dictionary.tooltips.transactionDate}>
                          <Typography>{readableDate(t.transactionDate)}</Typography>
                        </Tooltip>
                      </Grid>
                      <Grid size={{ xs: 6, md: 3 }} textAlign="center">
                        <Tooltip title={dictionary.tooltips.voucherReference}>
                          <Typography>{t.voucherNo} {t.reference}</Typography>
                        </Tooltip>
                      </Grid>
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Tooltip title={dictionary.tooltips.transactionDescription}>
                          <Typography>{t.description}</Typography>
                        </Tooltip>
                      </Grid>
                      <Grid size={{ xs: 6, md: 3 }} textAlign="end">
                        <Tooltip title={dictionary.tooltips.incomingAmount}>
                          <Typography sx={{ color: theme.palette.success.main }}>
                            {currency(t.amount)}
                          </Typography>
                        </Tooltip>
                      </Grid>
                    </Grid>
                  ))}

                  <Tooltip title={dictionary.tooltips.totalIncomingAmount}>
                    <Typography textAlign="end" mt={1} fontWeight={600}>
                      {t.common.total}: {currency(incomingTotal)}
                    </Typography>
                  </Tooltip>
                </>
              )}

              <Divider sx={{ my: 2 }} />

              {/* OUTGOING */}
              {item.outgoing_transactions && (
                <>
                  <Tooltip title={dictionary.tooltips.allMoneyPaidOutInThis}>
                    <Typography variant="h6" textAlign="center">
                      {t.cashierReport.outgoingTransactions}
                    </Typography>
                  </Tooltip>

                  {Object.values(item.outgoing_transactions).map((t, i) => (
                    <Grid
                      key={i}
                      container
                      spacing={1}
                      alignItems="center"
                      sx={{ borderTop: 1, borderColor: 'divider', py: 0.5 }}
                    >
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Tooltip title={dictionary.tooltips.transactionDate}>
                          <Typography>{readableDate(t.transactionDate)}</Typography>
                        </Tooltip>
                      </Grid>
                      <Grid size={{ xs: 6, md: 3 }} textAlign="center">
                        <Tooltip title={dictionary.tooltips.voucherReference}>
                          <Typography>{t.voucherNo} {t.reference}</Typography>
                        </Tooltip>
                      </Grid>
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Tooltip title={dictionary.tooltips.transactionDescription}>
                          <Typography>{t.description}</Typography>
                        </Tooltip>
                      </Grid>
                      <Grid size={{ xs: 6, md: 3 }} textAlign="end">
                        <Tooltip title={dictionary.tooltips.outgoingAmount}>
                          <Typography sx={{ color: theme.palette.error.main }}>
                            {currency(t.amount)}
                          </Typography>
                        </Tooltip>
                      </Grid>
                    </Grid>
                  ))}

                  <Tooltip title={dictionary.tooltips.totalOutgoingAmount}>
                    <Typography textAlign="end" mt={1} fontWeight={600}>
                      {t.common.total}: {currency(outgoingTotal)}
                    </Typography>
                  </Tooltip>
                </>
              )}
            </AccordionDetails>
          </Accordion>
        );
      })}
    </>
  );
};

export default CashierReportOnScreen;
