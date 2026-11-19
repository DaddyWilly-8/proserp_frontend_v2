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
  TableHead,
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

// One column per period, plus a Total column when there is more than one
const CashFlowOnScreen = ({ reportData, authOrganization }) => {
  const theme = useTheme();
  const [openRows, setOpenRows] = useState([]);

  if (!reportData) return null;

  const mainColor = authOrganization?.organization.settings?.main_color || '#2113AD';
  const contrastText = authOrganization?.organization.settings?.contrast_text || '#FFFFFF';
  const headerColor = theme.type === 'dark' ? '#29f096' : mainColor;

  const periods = reportData.periods;
  const hasTotal = periods.length > 1;
  const columnCount = 1 + periods.length + (hasTotal ? 1 : 0);

  const toggle = (key) =>
    setOpenRows((previous) =>
      previous.includes(key) ? previous.filter((id) => id !== key) : [...previous, key]
    );

  // The description stays in view while the figures scroll sideways
  const stickyCell = (background) => ({
    position: 'sticky',
    left: 0,
    zIndex: 1,
    backgroundColor: background,
    minWidth: { xs: 180, md: 280 },
    maxWidth: { xs: 180, md: 'none' },
  });

  const amountCells = (values, total, { bold = false, muted = false, background } = {}) =>
    [...values, ...(hasTotal ? [total] : [])].map((amount, index) => (
      <TableCell
        key={index}
        align='right'
        sx={{
          whiteSpace: 'nowrap',
          fontWeight: bold || (hasTotal && index === values.length) ? 'bold' : 'normal',
          color: muted ? 'text.secondary' : Number(amount) < 0 ? 'error.main' : undefined,
          backgroundColor: background,
          borderLeft: hasTotal && index === values.length ? `1px solid ${theme.palette.divider}` : undefined,
        }}
      >
        {amount === null || amount === '' ? '' : money(amount)}
      </TableCell>
    ));

  const sectionRow = (title) => (
    <TableRow key={title}>
      <TableCell
        colSpan={columnCount}
        sx={{ backgroundColor: mainColor, color: contrastText, fontWeight: 'bold', position: 'sticky', left: 0 }}
      >
        {title}
      </TableCell>
    </TableRow>
  );

  const labelRow = (key, label, columns, { bold = false, indent = 1, shaded = false } = {}) => {
    // solid colours, so figures scrolling under the pinned description never show through
    const background = shaded ? theme.palette.background.default : theme.palette.background.paper;
    return (
      <TableRow key={key} sx={shaded ? { backgroundColor: background } : undefined}>
        <TableCell sx={{ ...stickyCell(background), pl: indent * 3, fontWeight: bold ? 'bold' : 'normal' }}>
          {label}
        </TableCell>
        {columns
          ? amountCells(columns.values, columns.total, { bold, background: shaded ? background : undefined })
          : Array.from({ length: columnCount - 1 }, (_, i) => <TableCell key={i} />)}
      </TableRow>
    );
  };

  // A line expands to the ledgers behind it
  const lineRows = (prefix, lines) =>
    lines.flatMap((line) => {
      const key = `${prefix}-${line.key}`;
      const isOpen = openRows.includes(key);
      const hasLedgers = line.ledgers?.length > 0;
      const background = theme.palette.background.paper;
      return [
        <TableRow
          key={key}
          hover={hasLedgers}
          onClick={() => hasLedgers && toggle(key)}
          sx={{ cursor: hasLedgers ? 'pointer' : 'default' }}
        >
          <TableCell sx={{ ...stickyCell(background), pl: 3 }}>
            {hasLedgers && (isOpen ? <KeyboardArrowDown fontSize='small' /> : <KeyboardArrowRight fontSize='small' />)}
            <span style={{ marginLeft: hasLedgers ? 4 : 24 }}>{line.label}</span>
          </TableCell>
          {amountCells(line.values, line.total)}
        </TableRow>,
        ...(isOpen
          ? line.ledgers.map((ledger) => (
              <TableRow key={`${key}-${ledger.id}`}>
                <TableCell sx={{ ...stickyCell(background), pl: 9, color: 'text.secondary' }}>{ledger.name}</TableCell>
                {amountCells(ledger.values, ledger.total, { muted: true })}
              </TableRow>
            ))
          : []),
      ];
    });

  const { operating, investing, financing } = reportData;
  const cashOpen = openRows.includes('cash-accounts');
  const paper = theme.palette.background.paper;

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
          The sections do not add up to the change in cash (difference {money(reportData.check_difference)}),
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
          {hasTotal && (
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...stickyCell(paper), fontWeight: 'bold' }} />
                {periods.map((period) => (
                  <TableCell key={period.label} align='right' sx={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                    {period.label}
                  </TableCell>
                ))}
                <TableCell
                  align='right'
                  sx={{ whiteSpace: 'nowrap', fontWeight: 'bold', borderLeft: `1px solid ${theme.palette.divider}` }}
                >
                  Total
                </TableCell>
              </TableRow>
            </TableHead>
          )}
          <TableBody>
            {sectionRow('Cash flows from operating activities')}
            {labelRow('net-profit', 'Net profit for the period', reportData.net_profit)}
            {operating.adjustments.length > 0 && labelRow('adj-head', 'Adjustments for non-cash items', null, { bold: true })}
            {lineRows('adj', operating.adjustments)}
            {operating.working_capital.length > 0 && labelRow('wc-head', 'Changes in working capital', null, { bold: true })}
            {lineRows('wc', operating.working_capital)}
            {labelRow('op-total', 'Net cash from operating activities', operating.total, { bold: true, indent: 0, shaded: true })}

            {sectionRow('Cash flows from investing activities')}
            {lineRows('inv', investing.lines)}
            {labelRow('inv-total', 'Net cash from investing activities', investing.total, { bold: true, indent: 0, shaded: true })}

            {sectionRow('Cash flows from financing activities')}
            {lineRows('fin', financing.lines)}
            {labelRow('fin-total', 'Net cash from financing activities', financing.total, { bold: true, indent: 0, shaded: true })}

            {labelRow('net-change', 'Net increase / (decrease) in cash', reportData.net_change, { bold: true, indent: 0, shaded: true })}
            {labelRow('opening', 'Cash at beginning of period', reportData.opening_cash, { indent: 0 })}
            <TableRow hover onClick={() => toggle('cash-accounts')} sx={{ cursor: 'pointer', backgroundColor: theme.palette.background.default }}>
              <TableCell sx={{ ...stickyCell(theme.palette.background.default), fontWeight: 'bold' }}>
                {cashOpen ? <KeyboardArrowDown fontSize='small' /> : <KeyboardArrowRight fontSize='small' />}
                <span style={{ marginLeft: 4 }}>Cash at end of period</span>
              </TableCell>
              {amountCells(reportData.closing_cash.values, reportData.closing_cash.total, { bold: true, background: theme.palette.background.default })}
            </TableRow>
            {cashOpen &&
              reportData.cash_accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell sx={{ ...stickyCell(paper), pl: 6, color: 'text.secondary' }}>{account.name}</TableCell>
                  {amountCells(account.values, account.total, { muted: true })}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default CashFlowOnScreen;
