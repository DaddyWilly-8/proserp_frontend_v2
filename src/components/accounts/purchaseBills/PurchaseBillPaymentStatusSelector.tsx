'use client';

import { Box, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import React from 'react';

function PurchaseBillPaymentStatusSelector({
  onChange,
  value,
}: {
  onChange: (status: string) => void;
  value?: string;
}) {
  const handleChange = (event: SelectChangeEvent) => {
    onChange(event.target.value);
  };

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth size='small'>
        <InputLabel id='purchase-bills-payment-status'>Payment Status</InputLabel>
        <Select
          labelId='purchase-bills-payment-status-filter-label'
          id='purchase-bills-payment-status-filter-select'
          value={value || 'All'}
          label='Payment Status'
          onChange={handleChange}
        >
          <MenuItem value='All'>All</MenuItem>
          <MenuItem value='paid'>Paid</MenuItem>
          <MenuItem value='partial'>Partially Paid</MenuItem>
          <MenuItem value='unpaid'>Unpaid</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}

export default PurchaseBillPaymentStatusSelector;
