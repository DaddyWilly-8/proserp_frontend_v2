import React, { useState } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField, Grid, Typography, Divider } from '@mui/material';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const DiscountCalculatorDialog = ({ open, onClose, onSubmit, productPrice }) => {
  const dictionary = useDictionary();
  const [discountQuantity, setDiscountQuantity] = useState('');
  const [discountRate, setDiscountRate] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [netAmount, setNetAmount] = useState('');

  const parseInputValue = (rawValue) => {
    if (rawValue === '' || rawValue === null || rawValue === undefined) return '';
    const sanitizedValue = sanitizedNumber(rawValue);
    return Number.isFinite(Number(sanitizedValue)) ? sanitizedValue : '';
  };

  React.useEffect(() => {
    const quantityValue = Number(discountQuantity) || 0;
    const discountRateValue = Number(discountRate) || 0;
    const grossAmount = sanitizedNumber(quantityValue * (productPrice || 0));
    const calculatedDiscountAmount = sanitizedNumber(quantityValue * discountRateValue);
    const calculatedNetAmount = sanitizedNumber(Math.max(grossAmount - calculatedDiscountAmount, 0));

    if (quantityValue > 0) {
      setDiscountAmount(calculatedDiscountAmount);
      setNetAmount(calculatedNetAmount);
    } else {
      setDiscountAmount('');
      setNetAmount('');
    }
  }, [discountQuantity, discountRate, productPrice]);

  const handleSubmit = () => {
    if (netAmount && Number(discountQuantity) > 0) {
      onSubmit({
        discountQuantity: Number(discountQuantity),
        discountRate: Number(discountRate) || 0,
        discountAmount: Number(discountAmount) || 0,
        netAmount: Number(netAmount),
      });
      onClose();
      setDiscountQuantity('');
      setDiscountRate('');
      setDiscountAmount('');
      setNetAmount('');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>{dictionary.forms.shifts.labels.discountCalculator}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Unit Price: {(Number(productPrice) || 0).toLocaleString()} TZS per L
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2} paddingTop={1}>
          <Grid size={12}>
            <TextField
              label={dictionary.forms.shifts.labels.quantity}
              fullWidth
              size='small'
              value={discountQuantity}
              placeholder={dictionary.forms.shifts.labels.enterLiters}
              InputProps={{
                inputComponent: CommaSeparatedField,
              }}
              onChange={e => setDiscountQuantity(parseInputValue(e.target.value))}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              label={dictionary.forms.shifts.labels.discountRate}
              fullWidth
              size='small'
              value={discountRate}
              placeholder={dictionary.forms.shifts.labels.discountPerLiter}
              InputProps={{
                inputComponent: CommaSeparatedField,
              }}
              onChange={e => setDiscountRate(parseInputValue(e.target.value))}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              label={dictionary.forms.shifts.labels.discountAmountTzs}
              fullWidth
              size='small'
              value={discountAmount ? Number(discountAmount).toLocaleString() : ''}
              InputProps={{
                readOnly: true,
                inputComponent: CommaSeparatedField,
              }}
              sx={{ '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: 'inherit' } }}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              label={dictionary.forms.shifts.labels.amountSoldTzs}
              fullWidth
              size='small'
              value={netAmount ? Number(netAmount).toLocaleString() : ''}
              InputProps={{
                readOnly: true,
                inputComponent: CommaSeparatedField,
              }}
              sx={{ '& .MuiInputBase-root': { fontWeight: 600 } }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color='inherit'>{dictionary.forms.shifts.buttons.cancel}</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!netAmount || !discountQuantity}>{dictionary.forms.shifts.buttons.apply}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DiscountCalculatorDialog;
