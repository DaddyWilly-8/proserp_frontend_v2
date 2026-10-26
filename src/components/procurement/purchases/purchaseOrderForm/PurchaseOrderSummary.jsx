import { Divider, Grid, Switch, Typography } from '@mui/material';
import React from 'react'
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

function PurchaseOrderSummary({isApprovedPurchase, totalAmount, vatableAmount, additionalCostsAmount = 0, checked, setChecked}) {

  const dictionary = useDictionary();
  return (
    <Grid container columnSpacing={1}>
      <Grid size={12}>
        <Typography align='center' variant='h3'>{dictionary.forms.purchases.orderForm.summary.title}</Typography>
        <Divider/>
      </Grid>
      <Grid size={5}>
        <Typography align='left' variant='body2'>{dictionary.forms.purchases.orderForm.summary.itemsTotal}</Typography>
      </Grid>
      <Grid size={7}>
        <Typography align='right' variant='h5'>{totalAmount?.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Typography>
      </Grid>
      {!!additionalCostsAmount && (
        <>
          <Grid size={5}>
            <Typography align='left' variant='body2'>{dictionary.forms.purchases.orderForm.summary.additionalCosts}</Typography>
          </Grid>
          <Grid size={7}>
            <Typography align='right' variant='h5'>{additionalCostsAmount?.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Typography>
          </Grid>
        </>
      )}
      <Grid size={5}>
        <Typography align='left' variant='body2'>
          {dictionary.forms.purchases.orderForm.summary.vat}
        </Typography>
      </Grid>
      <Grid size={7} display={'flex'} alignItems={'center'} justifyContent={'end'}>
        <Typography align='right' variant='h5'>{vatableAmount?.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Typography>
      </Grid>
      <Grid size={5} >
        <Typography align='left' variant='body2' noWrap>{dictionary.forms.purchases.orderForm.summary.grandTotal}</Typography>
      </Grid>
      <Grid size={7} display={'flex'} alignItems={'end'} justifyContent={'end'}>
        <Typography align='right' variant='h5'>{(totalAmount + vatableAmount + additionalCostsAmount)?.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Typography>
      </Grid>
      {!isApprovedPurchase &&
        <>
          <Grid size={12}>
            <Divider/>
          </Grid>
          <Grid size={7} marginTop={1} marginBottom={2}>
            <Typography align='left' variant='body2'>
              {dictionary.forms.purchases.orderForm.summary.suggestRecentPrice}
            </Typography>
          </Grid>
          <Grid size={5} display={'flex'} alignItems={'end'} justifyContent={'end'} marginTop={1} marginBottom={2}>
            <Switch
              checked={checked}
              size='small'
              onChange={(e) => setChecked(e.target.checked)}
              inputProps={{ 'aria-label': 'controlled' }}
            />
          </Grid>
        </>
      }
    </Grid>
  )
}

export default PurchaseOrderSummary