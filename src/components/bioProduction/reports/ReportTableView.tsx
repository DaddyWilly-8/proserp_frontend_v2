'use client'

import React from 'react';
import { Box, Card, Link as MuiLink, Divider, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Link from 'next/link';
import { formatValue } from './formatValue';
import { ReportColumn, ReportTable } from './reportTypes';

interface Props {
  table: ReportTable;
  /** Column headings in the user's language; the server's wording is the fallback. */
  labelOf: (column: ReportColumn) => string;
  totalLabel: string;
  emptyText: string;
  /** Where a cell leads, when it names something with a page of its own (a batch); none for totals. */
  linkOf?: (row: Record<string, any>, column: ReportColumn) => string | null;
}

const Cell = ({ href, children }: { href: string | null | undefined; children: React.ReactNode }) =>
  href ? <MuiLink component={Link} href={href} underline='hover' color='primary' sx={{ fontWeight: 600 }}>{children}</MuiLink> : <>{children}</>;

/**
 * The report as a table on a wide screen, with its first column kept in view while the rest scrolls, and as
 * one card per row on a narrow one, so a report with a dozen columns reads on a phone without sideways scrolling.
 */
const ReportTableView = ({ table, labelOf, totalLabel, emptyText, linkOf }: Props) => {
  const theme = useTheme();
  const narrow = useMediaQuery(theme.breakpoints.down('md'));
  const [first, ...rest] = table.columns;

  if (table.rows.length === 0) {
    return <Typography color='text.secondary' sx={{ py: 3, textAlign: 'center' }}>{emptyText}</Typography>;
  }

  if (narrow) {
    const cards = [...table.rows, ...(table.totals ? [{ ...table.totals, label: totalLabel, bold: true, isTotal: true }] : [])];

    return (
      <Stack spacing={1.25}>
        {cards.map((row, index) => (
          <Card key={index} variant='outlined' sx={{ p: 1.5, bgcolor: row.isTotal ? 'action.hover' : undefined }}>
            <Typography variant='subtitle2' fontWeight={700} noWrap sx={{ mb: 0.75 }}><Cell href={row.isTotal ? null : linkOf?.(row, first)}>{formatValue(row[first.key] ?? row.label ?? row.batch, 'text') || totalLabel}</Cell></Typography>
            <Divider sx={{ mb: 0.75 }} />
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', columnGap: 2, rowGap: 0.75 }}>
              {rest.filter((column) => row[column.key] !== undefined && row[column.key] !== '').map((column) => {
                // A long piece of text (the feeds of a stage, a note) takes the card's full width and wraps instead of being cut short.
                const long = column.type === 'text' && String(row[column.key] ?? '').length > 22;

                return (
                  <Box key={column.key} sx={{ minWidth: 0, ...(long ? { gridColumn: '1 / -1' } : {}) }}>
                    <Typography variant='caption' color='text.secondary' display='block' noWrap>{labelOf(column)}</Typography>
                    <Typography variant='body2' noWrap={!long}><Cell href={row.isTotal ? null : linkOf?.(row, column)}>{formatValue(row[column.key], column.type)}</Cell></Typography>
                  </Box>
                );
              })}
            </Box>
          </Card>
        ))}
      </Stack>
    );
  }

  return (
    <TableContainer sx={{ maxHeight: '60vh' }}>
      <Table size='small' stickyHeader>
        <TableHead>
          <TableRow>
            {table.columns.map((column, index) => (
              <TableCell key={column.key} align={column.type === 'text' ? 'left' : 'right'}
                sx={index === 0 ? { position: 'sticky', left: 0, zIndex: 3, bgcolor: 'background.paper', whiteSpace: 'nowrap' } : { whiteSpace: 'nowrap' }}>
                {labelOf(column)}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {table.rows.map((row, rowIndex) => (
            <TableRow key={rowIndex} hover>
              {table.columns.map((column, index) => (
                <TableCell key={column.key} align={column.type === 'text' ? 'left' : 'right'}
                  sx={{ whiteSpace: 'pre', fontWeight: row.bold ? 700 : 400, ...(index === 0 ? { position: 'sticky', left: 0, bgcolor: 'background.paper', zIndex: 1 } : {}) }}>
                  <Cell href={linkOf?.(row, column)}>{formatValue(row[column.key], column.type)}</Cell>
                </TableCell>
              ))}
            </TableRow>
          ))}
          {table.totals && (
            <TableRow sx={{ '& td': { fontWeight: 700, bgcolor: 'action.hover', borderTop: 2, borderColor: 'divider', position: 'sticky', bottom: 0 } }}>
              {table.columns.map((column, index) => (
                <TableCell key={column.key} align={column.type === 'text' ? 'left' : 'right'} sx={{ whiteSpace: 'nowrap', ...(index === 0 ? { left: 0, zIndex: 2 } : {}) }}>
                  {index === 0 ? totalLabel : formatValue(table.totals![column.key], column.type)}
                </TableCell>
              ))}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ReportTableView;
