import {
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import React from 'react';

// Renders whatever shape a troubleshooting script/action returns (besides
// `message`) without each script having to hand-build its own UI - a plain
// object becomes labeled rows, an array of objects becomes a table, an array
// of primitives becomes a chip list, and anything that doesn't fit one of
// those (a lone string/number, a deeply nested shape) falls back to
// readable text instead of a wall of raw JSON.

const toLabel = (key: string) =>
  key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const formatScalar = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return value.toLocaleString('en-US');
  return String(value);
};

function ArrayOfObjectsTable({ rows }: { rows: Record<string, unknown>[] }) {
  const columns = Array.from(
    rows.reduce((cols, row) => {
      Object.keys(row).forEach((k) => cols.add(k));
      return cols;
    }, new Set<string>())
  );

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 360 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col} sx={{ fontWeight: 'bold' }}>
                {toLabel(col)}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={index}>
              {columns.map((col) => {
                const cell = row[col];
                return (
                  <TableCell key={col}>
                    {isPlainObject(cell) || Array.isArray(cell)
                      ? JSON.stringify(cell)
                      : formatScalar(cell)}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function ValueDisplay({ label, value, depth }: { label: string; value: unknown; depth: number }) {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary">
          {toLabel(label)}: none
        </Typography>
      );
    }
    if (value.every((item) => isPlainObject(item))) {
      return (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            {toLabel(label)} ({value.length})
          </Typography>
          <ArrayOfObjectsTable rows={value as Record<string, unknown>[]} />
        </Box>
      );
    }
    return (
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          {toLabel(label)}
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {value.map((item, index) => (
            <Chip key={index} size="small" label={formatScalar(item)} />
          ))}
        </Stack>
      </Box>
    );
  }

  if (isPlainObject(value)) {
    return (
      <Box sx={{ pl: depth > 0 ? 2 : 0, borderLeft: depth > 0 ? '2px solid' : 'none', borderColor: 'divider' }}>
        <Typography variant="subtitle2" gutterBottom>
          {toLabel(label)}
        </Typography>
        <ReportDetails data={value} depth={depth + 1} />
      </Box>
    );
  }

  return (
    <Typography variant="body2">
      <Typography component="span" fontWeight="bold">
        {toLabel(label)}:
      </Typography>{' '}
      {formatScalar(value)}
    </Typography>
  );
}

function ReportDetails({ data, depth = 0 }: { data: Record<string, unknown>; depth?: number }) {
  const entries = Object.entries(data);

  return (
    <Stack spacing={1.5} divider={depth === 0 ? <Divider flexItem /> : undefined}>
      {entries.map(([key, value]) => (
        <ValueDisplay key={key} label={key} value={value} depth={depth} />
      ))}
    </Stack>
  );
}

export default ReportDetails;
