"use client";

import { 
  Typography,
  Box,
} from '@mui/material';
import FuelVouchers from './FuelVouchers';
import FuelVouchersItemRow from './FuelVouchersItemRow';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

function FuelVouchersTab({ 
  localFuelVouchers, 
  setLocalFuelVouchers,
  cashierPumpProducts,
  watch
}) {
    const dictionary = useDictionary();
    const productPrices = watch(`product_prices`) || [];
    const safeFuelVouchers = Array.isArray(localFuelVouchers) ? localFuelVouchers : [];

    return (
      <Box>
          <FuelVouchers
            productPrices={productPrices}
            fuelVouchers={safeFuelVouchers}
            setFuelVouchers={setLocalFuelVouchers}
            cashierPumpProducts={cashierPumpProducts}
          />

          {safeFuelVouchers.map((fuelVoucher, index) => (
            <FuelVouchersItemRow
              key={index}
              fuelVoucher={fuelVoucher}
              index={index}
              productPrices={productPrices}
              fuelVouchers={safeFuelVouchers}
              setFuelVouchers={setLocalFuelVouchers}
              cashierPumpProducts={cashierPumpProducts}
            />
          ))}
        
        {safeFuelVouchers.length === 0 && (
          <Typography color="textSecondary" textAlign="center" py={4}>
            {dictionary.forms.shifts.messages.noFuelVouchers}
          </Typography>
        )}
      </Box>
    );
}

export default FuelVouchersTab;