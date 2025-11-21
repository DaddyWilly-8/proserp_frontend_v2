import { Checkbox, Divider, Grid, Switch, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { UseVFD } from '@/components/vfd/UseVFD';

function ProductsSaleSummary() {
  const [totalAmount, setTotalAmount] = useState(0);
  const [vatableAmount, setVatableAmount] = useState(0);

  const {
    items,
    sale,
    checkedForSuggestPrice,
    setCheckedForSuggestPrice,
    vat_percentage,
    organization,
    checkedForInstantSale,
    setCheckedForInstantSale,
    setValue,
    watch
  } = useFormContext();

  const majorInfoOnly = watch('major_info_only');
  const currencyCode = watch('currency')?.code || "TZS";

  // Use old VFD hook
  const { displayTotal, connected } = UseVFD();

  // Calculate total and vatable amounts
  useEffect(() => {
    let total = 0;
    let vatable = 0;

    items.forEach((item, index) => {
      total += item.rate * item.quantity;

      // Update form values
      setValue(`items.${index}.product_id`, item?.product?.id ?? item.product_id);
      setValue(`items.${index}.quantity`, item.quantity);
      setValue(`items.${index}.rate`, item.rate);
      setValue(`items.${index}.store_id`, item.store_id);

      // VAT calculation
      if (item.product?.vat_exempted !== 1) {
        vatable += item.rate * item.quantity;
      }
    });

    setTotalAmount(total);
    setVatableAmount(vatable);
  }, [items, setValue]);

  const vatAmount = (vatableAmount * vat_percentage) / 100;
  const grandTotal = totalAmount + vatAmount;

  // Update VFD display when grand total changes
  useEffect(() => {
    if (connected && displayTotal) {
      displayTotal(grandTotal, currencyCode);
    }
  }, [grandTotal, currencyCode, connected, displayTotal]);

  // Reset VFD on unmount
  useEffect(() => {
    return () => {
      if (displayTotal) displayTotal(0, currencyCode);
    };
  }, [displayTotal, currencyCode]);

  return (
    <Grid container columnSpacing={1}>
      <Grid item xs={12}>
        <Typography align="center" variant="h3">Summary</Typography>
        <Divider />
      </Grid>

      {/* Total */}
      <Grid item xs={6}>
        <Typography align="left" variant="body2">Total:</Typography>
      </Grid>
      <Grid item xs={6}>
        <Typography align="right" variant="h5">
          {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Typography>
      </Grid>

      {/* VAT */}
      {watch('vat_registered') && (
        <>
          <Grid item xs={6}>
            <Typography align="left" variant="body2">
              VAT:
              <Checkbox
                size="small"
                disabled={majorInfoOnly}
                checked={!!vat_percentage}
                onChange={e => {
                  const checked = e.target.checked;
                  setValue('vat_percentage', checked ? organization.settings.vat_percentage : 0, {
                    shouldDirty: true,
                    shouldValidate: true
                  });
                }}
              />
            </Typography>
          </Grid>
          <Grid item xs={6} display="flex" alignItems="center" justifyContent="end">
            <Typography align="right" variant="h5">
              {vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography align="left" variant="body2">Grand Total ({currencyCode}):</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography align="right" variant="h5">
              {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </Grid>
        </>
      )}

      {/* Instant Sale & Suggest Price */}
      {watch('stakeholder_id') !== null && !majorInfoOnly && (
        <>
          <Grid item xs={12}><Divider /></Grid>

          <Grid item xs={7} marginTop={2} marginBottom={2}>
            <Typography align="left" variant="body2">Instant Sale:</Typography>
          </Grid>
          <Grid item xs={5} display="flex" alignItems="end" justifyContent="end" marginTop={1} marginBottom={2}>
            <Switch
              checked={checkedForInstantSale}
              size="small"
              disabled={!!sale && !sale?.is_instant_sale}
              onChange={e => {
                setCheckedForInstantSale(e.target.checked);
                setValue('instant_sale', e.target.checked, { shouldDirty: true, shouldValidate: true });
              }}
            />
          </Grid>

          <Grid item xs={12}><Divider /></Grid>

          <Grid item xs={7} marginTop={1} marginBottom={2}>
            <Typography align="left" variant="body2">Suggest Recent Price:</Typography>
          </Grid>
          <Grid item xs={5} display="flex" alignItems="end" justifyContent="end" marginTop={1} marginBottom={2}>
            <Switch
              checked={checkedForSuggestPrice}
              size="small"
              onChange={e => setCheckedForSuggestPrice(e.target.checked)}
            />
          </Grid>
        </>
      )}
    </Grid>
  );
}

export default ProductsSaleSummary;
