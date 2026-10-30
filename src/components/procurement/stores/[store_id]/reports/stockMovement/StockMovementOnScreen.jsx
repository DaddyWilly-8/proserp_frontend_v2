'use client';

import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useTheme,
} from '@mui/material';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { MODULES } from '@/utilities/constants/modules';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const StockMovementOnScreen = ({
  movementsData,
  authOrganization,
  organizationHasSubscribed,
  checkOrganizationPermission,
  emptyKeys = new Set(),
  withDetails = false,
}) => {
  const theme = useTheme();
  const dictionary = useDictionary();
  const dict = dictionary.reports.storeReports.stockMovementReport;
  const mainColor = authOrganization.organization.settings?.main_color || "#2113AD";
  const headerColor = theme.type === 'dark' ? '#29f096' : (authOrganization.organization.settings?.main_color || "#2113AD");
  const contrastText = authOrganization.organization.settings?.contrast_text || "#FFFFFF";

  if (!movementsData) return null;

  const formatNumber = (value) => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatQuantity = (value) => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4
    });
  };

  const renderHeader = () => (
    checkOrganizationPermission([PERMISSIONS.ACCOUNTS_REPORTS, PERMISSIONS.STORE_VALUES]) && (
      <Box sx={{ mb: 3 }}>
        <Box 
          sx={{ 
            p: 2, 
            backgroundColor: theme.palette.background.default,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1
          }}
        >
          <Typography variant="subtitle2" sx={{ color: headerColor }} gutterBottom>
            {dict.estimatedClosingStockValue}
          </Typography>
          <Typography variant="h6" fontWeight="bold" fontFamily="monospace">
            {movementsData.movements.reduce((total, movement) => {
              const closingBalance = (
                parseFloat(movement.opening_balance) +
                parseFloat(movement.quantity_received) +
                parseFloat(movement.quantity_produced) -
                parseFloat(movement.quantity_sold) -
                parseFloat(movement.quantity_consumed) -
                parseFloat(movement.quantity_transferred_out) +
                parseFloat(movement.quantity_transferred_in) +
                parseFloat(movement.stock_gain) -
                parseFloat(movement.stock_loss)
              );
              return total + (movement.latest_rate * closingBalance);
            }, 0).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </Typography>
        </Box>
      </Box>
    )
  );

  const showValues = checkOrganizationPermission([
    PERMISSIONS.ACCOUNTS_REPORTS,
    PERMISSIONS.STORE_VALUES,
  ]);
  const num = (value) => parseFloat(value || 0);
  const closingOf = (movement) =>
    Math.round(
      (num(movement.opening_balance) +
        num(movement.quantity_received) +
        num(movement.quantity_produced) -
        num(movement.quantity_sold) -
        num(movement.quantity_consumed) -
        num(movement.quantity_transferred_out) +
        num(movement.quantity_transferred_in) +
        num(movement.stock_gain) -
        num(movement.stock_loss)) *
        10000
    ) / 10000;

  // Quantity columns in display order. With details every one of them also
  // shows its amount at the latest rate.
  const quantityColumns = [
    { key: 'opening', label: dict.opening, get: (m) => num(m.opening_balance) },
    { key: 'purchaseReceived', label: dict.purchased, get: (m) => num(m.quantity_received) },
    ...(organizationHasSubscribed(MODULES.MANUFACTURING_AND_PROCESSING)
      ? [{ key: 'produced', label: dict.produced, get: (m) => num(m.quantity_produced) }]
      : []),
    { key: 'transferIn', label: dict.transIn, get: (m) => num(m.quantity_transferred_in) },
    { key: 'transferOut', label: dict.transOut, get: (m) => num(m.quantity_transferred_out) },
    { key: 'stockGain', label: dict.gain, get: (m) => num(m.stock_gain) },
    { key: 'stockLoss', label: dict.loss, get: (m) => num(m.stock_loss) },
    { key: 'consumed', label: dict.consumed, get: (m) => num(m.quantity_consumed) },
    { key: 'sold', label: dict.sold, get: (m) => num(m.quantity_sold) },
    { key: 'closing', label: dict.closing, get: closingOf },
  ].filter((column) => !emptyKeys.has(column.key));

  const detailed = withDetails && showValues;
  const movements = movementsData.movements;
  const mono = { fontFamily: 'monospace' };

  const renderTable = () => (
    <TableContainer 
      component={Paper}
      sx={{
        maxHeight: '70vh',
        overflow: 'auto', 
        boxShadow: theme.shadows[3],
        borderRadius: 1,
        '& .MuiTableRow-root:hover': {
          backgroundColor: theme.palette.action.hover,
        },
        '& .MuiTableCell-root': {
          border: `1px solid ${theme.palette.divider}`,
        },
        '& .MuiTableHead-root .MuiTableCell-root': {
          borderColor: 'rgba(255,255,255,0.35)',
          backgroundColor: mainColor,
          color: contrastText,
          fontSize: '0.875rem',
          fontWeight: 'bold',
        },
      }}
    >
      <Table stickyHeader aria-label="stock-movement-table">
        <TableHead>
          <TableRow>
            <TableCell rowSpan={detailed ? 2 : 1}>{dict.sn}</TableCell>
            <TableCell rowSpan={detailed ? 2 : 1}>{dict.product}</TableCell>
            <TableCell rowSpan={detailed ? 2 : 1}>{dict.unit}</TableCell>
            {detailed && (
              <TableCell rowSpan={2} align="right">{dict.rate}</TableCell>
            )}
            {quantityColumns.map((column) => (
              <TableCell
                key={column.key}
                align={detailed ? 'center' : 'right'}
                colSpan={detailed ? 2 : 1}
              >
                {column.label}
              </TableCell>
            ))}
            {showValues && !detailed && (
              <>
                <TableCell align="right">{dict.rate}</TableCell>
                <TableCell align="right">{dict.value}</TableCell>
              </>
            )}
          </TableRow>
          {detailed && (
            <TableRow>
              {quantityColumns.map((column) => (
                <React.Fragment key={column.key}>
                  <TableCell align="right" sx={{ top: 37 }}>{dict.quantity}</TableCell>
                  <TableCell align="right" sx={{ top: 37 }}>{dict.amount}</TableCell>
                </React.Fragment>
              ))}
            </TableRow>
          )}
        </TableHead>
        <TableBody>
          {movements.map((movement, index) => {
            const rate = num(movement.latest_rate);
            return (
              <TableRow
                key={index}
                sx={{
                  backgroundColor: theme.palette.background.paper,
                  '&:nth-of-type(even)': {
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              >
                <TableCell>{index + 1}</TableCell>
                <TableCell>{movement.name}</TableCell>
                <TableCell>{movement.unit_symbol}</TableCell>
                {detailed && (
                  <TableCell align="right" sx={mono}>{formatNumber(rate)}</TableCell>
                )}
                {quantityColumns.map((column) => {
                  const quantity = column.get(movement);
                  return (
                    <React.Fragment key={column.key}>
                      <TableCell align="right" sx={mono}>
                        {formatQuantity(quantity)}
                      </TableCell>
                      {detailed && (
                        <TableCell align="right" sx={mono}>
                          {formatNumber(rate * quantity)}
                        </TableCell>
                      )}
                    </React.Fragment>
                  );
                })}
                {showValues && !detailed && (
                  <>
                    <TableCell align="right" sx={mono}>{formatNumber(rate)}</TableCell>
                    <TableCell align="right" sx={mono}>
                      {formatNumber(rate * closingOf(movement))}
                    </TableCell>
                  </>
                )}
              </TableRow>
            );
          })}

          {detailed && movements.length > 0 && (
            <TableRow sx={{ '& .MuiTableCell-root': { fontWeight: 'bold' } }}>
              <TableCell colSpan={4}>{dict.total}</TableCell>
              {quantityColumns.map((column) => (
                <React.Fragment key={column.key}>
                  <TableCell />
                  <TableCell align="right" sx={mono}>
                    {formatNumber(
                      movements.reduce(
                        (total, movement) =>
                          total + num(movement.latest_rate) * column.get(movement),
                        0
                      )
                    )}
                  </TableCell>
                </React.Fragment>
              ))}
            </TableRow>
          )}

          {/* Empty State */}
          {movements.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={3 + quantityColumns.length * (detailed ? 2 : 1) + (showValues ? (detailed ? 1 : 2) : 0)}
                sx={{ textAlign: 'center', py: 4 }}
              >
                <Typography variant="body1" color="text.secondary">
                  {dict.noData}
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box sx={{ padding: 2 }}>
      {renderHeader()}
      {renderTable()}
    </Box>
  );
};

export default StockMovementOnScreen;