'use client'

import React from 'react';
import { Grid, Typography } from '@mui/material';

export interface LineColumn<T> {
  label: string;
  /** Width out of 12 on a phone and on a wide screen. */
  xs: number;
  md: number;
  /** Numbers are right-aligned on a wide screen, where the columns line up under the heading. */
  right?: boolean;
  muted?: boolean;
  render: (row: T, index: number) => React.ReactNode;
}

interface LineTableProps<T> {
  columns: LineColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => React.Key;
  /** Buttons at the end of each row. */
  actions?: (row: T, index: number) => React.ReactNode;
  rowSx?: (row: T) => object;
  /** Something full-width under a row, such as the reason a line was refused. */
  rowFooter?: (row: T) => React.ReactNode;
  py?: number;
}

/**
 * The lines of a record. On a wide screen it is a table under a heading row; on a phone the heading row goes
 * and each value carries its own label, so a row reads as a small card instead of a squeezed table.
 */
function LineTable<T>({ columns, rows, rowKey, actions, rowSx, rowFooter, py = 0.5 }: LineTableProps<T>) {
  const used = columns.reduce((sum, column) => sum + column.md, 0);
  const actionsMd = actions ? Math.max(1, 12 - used) : 0;

  return (
    <>
      <Grid container columnSpacing={1} sx={{ display: { xs: 'none', md: 'flex' }, px: 1, pb: 0.5, borderBottom: 1, borderColor: 'divider' }}>
        {columns.map((column) => (
          <Grid key={column.label} size={{ md: column.md }} textAlign={column.right ? 'right' : undefined}>
            <Typography variant='caption' color='text.secondary'>{column.label}</Typography>
          </Grid>
        ))}
      </Grid>
      {rows.map((row, index) => (
        <Grid
          container
          key={rowKey(row, index)}
          alignItems='center'
          columnSpacing={1}
          rowSpacing={0.5}
          sx={{ px: 1, py, borderBottom: 1, borderColor: 'divider', ...(rowSx?.(row) ?? {}) }}
        >
          {columns.map((column) => (
            <Grid key={column.label} size={{ xs: column.xs, md: column.md }} sx={{ textAlign: { xs: 'left', md: column.right ? 'right' : 'left' }, minWidth: 0 }}>
              <Typography variant='caption' color='text.secondary' sx={{ display: { xs: 'block', md: 'none' } }}>{column.label}</Typography>
              <Typography component='div' color={column.muted ? 'text.secondary' : undefined} sx={{ overflowWrap: 'anywhere' }}>{column.render(row, index)}</Typography>
            </Grid>
          ))}
          {actions && (
            <Grid size={{ xs: 12, md: actionsMd }} sx={{ textAlign: { xs: 'right', md: 'right' } }}>{actions(row, index)}</Grid>
          )}
          {rowFooter?.(row)}
        </Grid>
      ))}
    </>
  );
}

export default LineTable;
