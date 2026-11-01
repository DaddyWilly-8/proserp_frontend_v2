'use client'

import React from 'react';
import { Box, Divider, Stack, Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TableRow, Typography, useMediaQuery, useTheme } from '@mui/material';

export interface ResponsiveColumn<T> {
  label: string;
  render: (row: T, index: number) => React.ReactNode;
  align?: 'right';
  /** On a card: the row's title. Defaults to the first column. */
  primary?: boolean;
  /** On a card: the figure shown large under the title. Defaults to the last right-aligned column. */
  headline?: boolean;
}

interface ResponsiveTableProps<T> {
  columns: ResponsiveColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => React.Key;
  /** Totals aligned to the columns (null for none); the first filled cell is the label, such as "Total". */
  footer?: (React.ReactNode | null)[];
  empty?: string;
}

/**
 * A table on a wide screen. Below `md` each row becomes a card, as the payslips of a payroll run do: the
 * title and any buttons across the top, the headline figure large, and the rest as labelled pairs.
 * A column with no label holds a row's buttons.
 */
function ResponsiveTable<T>({ columns, rows, rowKey, footer, empty }: ResponsiveTableProps<T>) {
  const theme = useTheme();
  const wide = useMediaQuery(theme.breakpoints.up('md'));

  if (!rows.length) {
    return <Typography color='text.secondary' p={2}>{empty}</Typography>;
  }

  const labelled = columns.map((column, index) => ({ column, index })).filter(({ column }) => column.label !== '');
  const primary = labelled.find(({ column }) => column.primary) ?? labelled[0];
  const headline = labelled.find(({ column }) => column.headline) ?? [...labelled].reverse().find(({ column, index }) => column.align === 'right' && index !== primary?.index);
  const actions = columns.filter((column) => column.label === '');
  const rest = labelled.filter(({ index }) => index !== primary?.index && index !== headline?.index);

  if (wide) {
    return (
      <TableContainer>
        <Table size='small'>
          <TableHead>
            <TableRow>
              {columns.map((column, index) => (
                <TableCell key={index} align={column.align}>{column.label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, rowIndex) => (
              <TableRow key={rowKey(row, rowIndex)} hover>
                {columns.map((column, index) => (
                  <TableCell key={index} align={column.align}>{column.render(row, rowIndex)}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
          {footer && (
            <TableFooter>
              <TableRow>
                {columns.map((column, index) => (
                  <TableCell key={index} align={column.align} sx={{ fontWeight: 700 }}>{footer[index]}</TableCell>
                ))}
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </TableContainer>
    );
  }

  const card = { border: 1, borderColor: 'divider', borderLeft: 4, borderLeftColor: 'primary.main', borderRadius: 2, p: 2, mx: 2, my: 1.5, bgcolor: 'background.paper' };
  const pair = (label: string, value: React.ReactNode) => (
    <Box key={label} sx={{ minWidth: 0 }}>
      <Typography variant='caption' color='text.secondary' display='block'>{label}</Typography>
      <Typography component='div' variant='body2' fontWeight={500} sx={{ overflowWrap: 'anywhere' }}>{value}</Typography>
    </Box>
  );
  const grid = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.5 };

  return (
    <>
      {rows.map((row, rowIndex) => (
        <Box key={rowKey(row, rowIndex)} sx={card}>
          <Stack direction='row' justifyContent='space-between' alignItems='flex-start' spacing={1}>
            <Typography component='div' variant='h5' fontSize={14} mb={0} sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>{primary?.column.render(row, rowIndex)}</Typography>
            {actions.length > 0 && <Box sx={{ flexShrink: 0 }}>{actions.map((column, index) => <React.Fragment key={index}>{column.render(row, rowIndex)}</React.Fragment>)}</Box>}
          </Stack>
          {headline && (
            <Box mt={1}>
              <Typography variant='caption' color='text.secondary' display='block'>{headline.column.label}</Typography>
              <Typography component='div' variant='h5' mb={0} sx={{ overflowWrap: 'anywhere' }}>{headline.column.render(row, rowIndex)}</Typography>
            </Box>
          )}
          {rest.length > 0 && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Box sx={grid}>{rest.map(({ column }) => pair(column.label, column.render(row, rowIndex)))}</Box>
            </>
          )}
        </Box>
      ))}
      {footer && (
        <Box sx={{ ...card, borderLeftColor: 'text.secondary', bgcolor: 'action.hover' }}>
          <Typography variant='h5' fontSize={14} mb={footer.length > 1 ? 1 : 0}>{footer.find((cell) => cell != null)}</Typography>
          <Box sx={grid}>
            {columns.map((column, index) => (footer[index] != null && index !== footer.findIndex((cell) => cell != null) ? pair(column.label, <b>{footer[index]}</b>) : null))}
          </Box>
        </Box>
      )}
    </>
  );
}

export default ResponsiveTable;
