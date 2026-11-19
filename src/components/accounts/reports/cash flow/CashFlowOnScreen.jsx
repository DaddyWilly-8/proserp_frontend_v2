import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { KeyboardArrowDown, KeyboardArrowRight } from '@mui/icons-material';
import {
  Alert,
  Divider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useState } from 'react';

// Negative amounts in brackets, as cash flow statements are conventionally written
export const money = (amount) => {
  const value = Number(amount ?? 0);
  const text = Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return value < 0 ? `(${text})` : text;
};

const CashFlowOnScreen = ({ reportData, authOrganization }) => {
  const theme = useTheme();
  const [openRows, setOpenRows] = useState([]);

  if (!reportData) return null;

  const mainColor = authOrganization?.organization.settings?.main_color || '#2113AD';
  const contrastText = authOrganization?.organization.settings?.contrast_text || '#FFFFFF';
  const headerColor = theme.type === 'dark' ? '#29f096' : mainColor;

  const toggle = (key) =>
    setOpenRows((previous) =>
      previous.includes(key) ? previous.filter((id) => id !== key) : [...previous, key]
    );

  const negative = (amount) => (Number(amount) < 0 ? { color: 'error.main' } : {});

  const sectionRow = (title) => (
    <TableRow key={title}>
      <TableCell colSpan={2} sx={{ backgroundColor: mainColor, color: contrastText, fontWeight: 'bold' }}>
        {title}
      </TableCell>
    </TableRow>
  );

  const textRow = (key, label, amount, { bold = false, indent = 1, shaded = false } = {}) => (
    <TableRow key={key} sx={shaded ? { backgroundColor: theme.palette.action.hover } : undefined}>
      <TableCell sx={{ pl: indent * 3, fontWeight: bold ? 'bold' : 'normal' }}>{label}</TableCell>
      <TableCell align='right' sx={{ whiteSpace: 'nowrap', fontWeight: bold ? 'bold' : 'normal', ...negative(amount) }}>
        {money(amount)}
      </TableCell>
    </TableRow>
  );

  // A line expands to the ledgers behind it
  const lineRows = (prefix, lines) =>
    lines.flatMap((line, index) => {
      const key = `${prefix}-${index}`;
      const isOpen = openRows.includes(key);
      const hasLedgers = line.ledgers?.length > 0;
      return [
        <TableRow
          key={key}
          hover={hasLedgers}
          onClick={() => hasLedgers && toggle(key)}
          sx={{ cursor: hasLedgers ? 'pointer' : 'default' }}
        >
          <TableCell sx={{ pl: 3 }}>
            {hasLedgers && (isOpen ? <KeyboardArrowDown fontSize='small' /> : <KeyboardArrowRight fontSize='small' />)}
            <span style={{ marginLeft: hasLedgers ? 4 : 24 }}>{line.label}</span>
          </TableCell>
          <TableCell align='right' sx={{ whiteSpace: 'nowrap', ...negative(line.amount) }}>
            {money(line.amount)}
          </TableCell>
        </TableRow>,
        ...(isOpen
          ? line.ledgers.map((ledger) => (
              <TableRow key={`${key}-${ledger.id}`}>
                <TableCell sx={{ pl: 9, color: 'text.secondary' }}>{ledger.name}</TableCell>
                <TableCell align='right' sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                  {money(ledger.amount)}
                </TableCell>
              </TableRow>
            ))
          : []),
      ];
    });

  const { operating, investing, financing } = reportData;
  const cashOpen = openRows.includes('cash-accounts');

  return (
    <div>
      <Divider style={{ margin: '20px 0' }} />

      <Grid container spacing={1} sx={{ mb: 1 }}>
        <Grid size={12}>
          <Typography variant='subtitle1' style={{ color: headerColor }}>
            Printed On
          </Typography>
          <Typography variant='body2'>{readableDate(undefined, true)}</Typography>
        </Grid>
      </Grid>

      {Math.abs(reportData.check_difference) >= 0.05 && (
        <Alert severity='error' sx={{ mb: 1 }}>
          The three sections do not add up to the change in cash (difference {money(reportData.check_difference)}),
          which means the books themselves are out of balance for this period.
        </Alert>
      )}
      {reportData.warnings?.map((warning) => (
        <Alert key={warning} severity='warning' sx={{ mb: 1 }}>
          {warning}
        </Alert>
      ))}

      <TableContainer component={Paper}>
        <Table size='small'>
          <TableBody>
            {sectionRow('Cash flows from operating activities')}
            {textRow('net-profit', 'Net profit for the period', reportData.net_profit)}
            {operating.adjustments.length > 0 && textRow('adj-head', 'Adjustments for non-cash items', null, { bold: true })}
            {lineRows('adj', operating.adjustments)}
            {operating.working_capital.length > 0 && textRow('wc-head', 'Changes in working capital', null, { bold: true })}
            {lineRows('wc', operating.working_capital)}
            {textRow('op-total', 'Net cash from operating activities', operating.total, { bold: true, indent: 0, shaded: true })}

            {sectionRow('Cash flows from investing activities')}
            {lineRows('inv', investing.lines)}
            {textRow('inv-total', 'Net cash from investing activities', investing.total, { bold: true, indent: 0, shaded: true })}

            {sectionRow('Cash flows from financing activities')}
            {lineRows('fin', financing.lines)}
            {textRow('fin-total', 'Net cash from financing activities', financing.total, { bold: true, indent: 0, shaded: true })}

            {textRow('net-change', 'Net increase / (decrease) in cash', reportData.net_change, { bold: true, indent: 0, shaded: true })}
            {textRow('opening', 'Cash at beginning of period', reportData.opening_cash, { indent: 0 })}
            <TableRow
              hover
              onClick={() => toggle('cash-accounts')}
              sx={{ cursor: 'pointer', backgroundColor: theme.palette.action.hover }}
            >
              <TableCell sx={{ fontWeight: 'bold' }}>
                {cashOpen ? <KeyboardArrowDown fontSize='small' /> : <KeyboardArrowRight fontSize='small' />}
                <span style={{ marginLeft: 4 }}>Cash at end of period</span>
              </TableCell>
              <TableCell align='right' sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', ...negative(reportData.closing_cash) }}>
                {money(reportData.closing_cash)}
              </TableCell>
            </TableRow>
            {cashOpen &&
              reportData.cash_accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell sx={{ pl: 6, color: 'text.secondary' }}>{account.name}</TableCell>
                  <TableCell align='right' sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                    {money(account.closing)}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default CashFlowOnScreen;
