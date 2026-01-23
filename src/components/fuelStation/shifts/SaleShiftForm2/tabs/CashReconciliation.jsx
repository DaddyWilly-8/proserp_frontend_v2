"use client";
import React, { useMemo, useCallback } from 'react';
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  IconButton,
  TextField,
  Tooltip,
  Typography,
  Autocomplete,
} from '@mui/material';
import { AddOutlined, DisabledByDefault } from '@mui/icons-material';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { useLedgerSelect } from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import { useFormContext, useWatch } from 'react-hook-form';

function CashReconciliation({
  cashierIndex,
  localFuelVouchers = [],
  localAdjustments = [],
  localPumpReadings = [],
}) {
  const {
    setValue,
    setCheckShiftBalanced,
    products,
    fuel_pumps,
    shiftLedgers,
    errors,
  } = useFormContext();

  const { ungroupedLedgerOptions } = useLedgerSelect();

  const productPrices = useWatch({
    name: 'product_prices',
  }) || [];

  const otherLedgers = useWatch({
    name: `cashiers.${cashierIndex}.other_ledgers`,
  }) || [];

  const mainLedgerId = useWatch({
    name: `cashiers.${cashierIndex}.main_ledger_id`,
  });

  // ──────────────────────────────────────────────────────────────
  // Fuel Voucher Totals per product
  // ──────────────────────────────────────────────────────────────
  const fuelVoucherTotals = useMemo(() => {
    if (!localFuelVouchers?.length || !productPrices?.length) return {};

    const totals = {};
    localFuelVouchers.forEach((voucher) => {
      const productId = voucher?.product_id;
      if (!productId) return;
      const qty = voucher?.quantity || 0;
      const price = productPrices.find(p => p?.product_id === productId)?.price || 0;
      totals[productId] = (totals[productId] || 0) + qty * price;
    });
    return totals;
  }, [localFuelVouchers, productPrices]);

  // ──────────────────────────────────────────────────────────────
  // Product sales totals (pump readings + adjustments)
  // ──────────────────────────────────────────────────────────────
  const productTotals = useMemo(() => {
    const totals = {};

    // Pump sales
    fuel_pumps?.forEach((pump) => {
      const productId = pump?.product_id;
      if (!productId) return;
      const reading = localPumpReadings.find(r => r?.fuel_pump_id === pump.id);
      const sold = ((reading?.closing || 0) - (reading?.opening || 0)) || 0;
      totals[productId] = (totals[productId] || 0) + sold;
    });

    // Adjustments
    localAdjustments?.forEach((adj) => {
      const productId = adj?.product_id;
      if (!productId) return;
      const qty = adj?.quantity || 0;
      if (adj.operator === '-') {
        totals[productId] = (totals[productId] || 0) + qty;     // add to sold (reduce cash)
      } else if (adj.operator === '+') {
        totals[productId] = (totals[productId] || 0) - qty;     // subtract from sold (increase cash)
      }
    });

    return totals;
  }, [fuel_pumps, localPumpReadings, localAdjustments]);

  // ──────────────────────────────────────────────────────────────
  // Grand totals & derived values
  // ──────────────────────────────────────────────────────────────
  const { grandFuelVoucherTotal, grandProductsTotal, cashRemaining } = useMemo(() => {
    const voucherTotal = Object.values(fuelVoucherTotals).reduce((sum, v) => sum + (v || 0), 0);

    const productsTotal = products?.reduce((sum, product) => {
      const qty = productTotals[product.id] || 0;
      const price = productPrices.find(p => p?.product_id === product.id)?.price || 0;
      return sum + qty * price;
    }, 0) || 0;

    return {
      grandFuelVoucherTotal: voucherTotal,
      grandProductsTotal: productsTotal,
      cashRemaining: productsTotal - voucherTotal,
    };
  }, [fuelVoucherTotals, productTotals, products, productPrices]);

  const totalOtherLedgersAmount = useMemo(() => {
    return otherLedgers?.reduce((sum, ledger) => sum + sanitizedNumber(ledger?.amount || 0), 0) || 0;
  }, [otherLedgers]);

  // Derived main ledger amount (what should be there)
  const calculatedMainLedgerAmount = cashRemaining - totalOtherLedgersAmount;

  // Balance check
  const isBalanced = Math.abs(cashRemaining - (calculatedMainLedgerAmount + totalOtherLedgersAmount)) < 0.01;

  // Update balance status only when meaningful values change
  React.useEffect(() => {
    setCheckShiftBalanced(isBalanced && cashRemaining >= 0);
  }, [isBalanced, cashRemaining, setCheckShiftBalanced]);

  // ──────────────────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────────────────
  const getProductPrice = useCallback(
    (productId) => productPrices.find(p => p?.product_id === productId)?.price || 0,
    [productPrices]
  );

  const availableLedgers = useMemo(() => {
    return shiftLedgers?.filter(
      (ledger) => !otherLedgers.some((other) => other?.id === ledger.id)
    ) || [];
  }, [shiftLedgers, otherLedgers]);

  const cashReconciliationAppend = () => {
    const newLedgers = [...otherLedgers, { id: '', amount: '' }];
    setValue(`cashiers.${cashierIndex}.other_ledgers`, newLedgers, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const cashReconciliationRemove = (idx) => {
    const newLedgers = otherLedgers.filter((_, i) => i !== idx);
    setValue(`cashiers.${cashierIndex}.other_ledgers`, newLedgers, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const updateOtherLedger = (idx, field, value) => {
    const newLedgers = [...otherLedgers];
    newLedgers[idx] = {
      ...newLedgers[idx],
      [field]: field === 'amount' ? sanitizedNumber(value) : value,
    };
    setValue(`cashiers.${cashierIndex}.other_ledgers`, newLedgers, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  return (
    <Grid container columnSpacing={2} rowSpacing={2}>
      {/* Total Products Amount */}
      <Grid size={{ xs: 12, md: 6, lg: 6 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" align="center" fontWeight="bold" gutterBottom>
              Total Products Amount
            </Typography>
            <Divider />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product Name</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products?.map((product) => {
                    const qty = productTotals[product.id] || 0;
                    const price = getProductPrice(product.id);
                    const amount = qty * price;
                    return (
                      <TableRow key={product.id}>
                        <TableCell>{product.name}</TableCell>
                        <TableCell align="right">{qty.toLocaleString()}</TableCell>
                        <TableCell align="right">{price.toLocaleString()}</TableCell>
                        <TableCell align="right">{amount.toLocaleString()}</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow>
                    <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                      Grand Total:
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      {grandProductsTotal.toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Fuel Vouchers */}
      <Grid size={{ xs: 12, md: 6, lg: 6 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" align="center" fontWeight="bold" gutterBottom>
              Fuel Vouchers
            </Typography>
            <Divider />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product Name</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products?.map((product) => {
                    const qty = localFuelVouchers.reduce(
                      (sum, v) => (v?.product_id === product.id ? sum + (v.quantity || 0) : sum),
                      0
                    );
                    const price = getProductPrice(product.id);
                    const amount = qty * price;
                    return (
                      <TableRow key={product.id}>
                        <TableCell>{product.name}</TableCell>
                        <TableCell align="right">{qty.toLocaleString()}</TableCell>
                        <TableCell align="right">{price.toLocaleString()}</TableCell>
                        <TableCell align="right">{amount.toLocaleString()}</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow>
                    <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                      Grand Total:
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      {grandFuelVoucherTotal.toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Final Summary */}
      <Grid size={{ xs: 12, md: 12, lg: 6 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" align="center" fontWeight="bold" gutterBottom>
              Final Summary
            </Typography>
            <Divider />
            <TableContainer>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>Total Amount</TableCell>
                    <TableCell align="right">{grandProductsTotal.toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Fuel Vouchers total</TableCell>
                    <TableCell align="right">{grandFuelVoucherTotal.toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Cash Remaining</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: cashRemaining < 0 ? 'error.main' : 'success.main' }}>
                      {cashRemaining.toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Cash Distribution */}
      <Grid size={{ xs: 12, md: 12, lg: 12 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" align="center" fontWeight="bold" gutterBottom>
              Cash Distribution
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              {/* Main Ledger */}
              <Grid size={{ xs: 12, md: 7 }}>
                <Autocomplete
                  size="small"
                  options={availableLedgers}
                  getOptionLabel={(opt) => opt.name}
                  value={mainLedgerId ? ungroupedLedgerOptions?.find(l => l.id === mainLedgerId) : null}
                  onChange={(_, newValue) => {
                    const id = newValue?.id ?? null;
                    setValue(`cashiers.${cashierIndex}.main_ledger_id`, id, { shouldValidate: true });
                    setValue(`cashiers.${cashierIndex}.main_ledger`, { id }, { shouldValidate: true });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Main Ledger"
                      error={!!errors?.cashiers?.[cashierIndex]?.main_ledger_id}
                      helperText={errors?.cashiers?.[cashierIndex]?.main_ledger_id?.message}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 5 }}>
                <TextField
                  size="small"
                  fullWidth
                  label="Calculated Amount"
                  value={calculatedMainLedgerAmount.toLocaleString()}
                  InputProps={{
                    readOnly: true,
                    inputComponent: CommaSeparatedField,
                  }}
                  sx={{
                    '& .MuiInputBase-input': {
                      fontWeight: 'bold',
                      color: calculatedMainLedgerAmount < 0 ? 'error.main' : 'success.main',
                    },
                  }}
                />
              </Grid>

              {/* Other Ledgers */}
              {otherLedgers.map((ledger, idx) => (
                <React.Fragment key={idx}>
                  <Grid size={{ xs: 12, md: 7 }}>
                    <Autocomplete
                      size="small"
                      options={availableLedgers.filter(l => l.id !== mainLedgerId)}
                      getOptionLabel={(opt) => opt.name}
                      value={ledger?.id ? ungroupedLedgerOptions?.find(l => l.id === ledger.id) : null}
                      onChange={(_, newValue) => {
                        updateOtherLedger(idx, 'id', newValue?.id ?? null);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Other Ledger"
                          error={!!errors?.cashiers?.[cashierIndex]?.other_ledgers?.[idx]?.id}
                          helperText={errors?.cashiers?.[cashierIndex]?.other_ledgers?.[idx]?.id?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 10, md: 4.5 }}>
                    <TextField
                      size="small"
                      fullWidth
                      label="Amount"
                      value={ledger?.amount ?? ''}
                      error={!!errors?.cashiers?.[cashierIndex]?.other_ledgers?.[idx]?.amount}
                      helperText={errors?.cashiers?.[cashierIndex]?.other_ledgers?.[idx]?.amount?.message}
                      InputProps={{ inputComponent: CommaSeparatedField }}
                      onChange={(e) => updateOtherLedger(idx, 'amount', e.target.value)}
                    />
                  </Grid>

                  <Grid size={{ xs: 2, md: 0.5 }} sx={{ alignItems: 'center', textAlign: 'end' }}>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => cashReconciliationRemove(idx)}
                    >
                      <DisabledByDefault fontSize="small" />
                    </IconButton>
                  </Grid>
                </React.Fragment>
              ))}

              <Grid size={12} sx={{ textAlign: 'right', mt: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddOutlined />}
                  onClick={cashReconciliationAppend}
                  disabled={availableLedgers.length === 0}
                >
                  Add Other Ledger
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default CashReconciliation;