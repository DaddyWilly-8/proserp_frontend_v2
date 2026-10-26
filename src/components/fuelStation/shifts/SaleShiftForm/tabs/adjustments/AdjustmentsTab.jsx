"use client";

import { 
  Typography,
  Box,
} from '@mui/material';
import Adjustments from './Adjustments';
import AdjustmentsRow from './AdjustmentsRow';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

function AdjustmentsTab({  
  cashierIndex, 
  localAdjustments, 
  setLocalAdjustments,
  cashierPumpProducts
}) {
  const dictionary = useDictionary();

  return (
    <Box>
        <Adjustments
          adjustments={localAdjustments}
          setAdjustments={setLocalAdjustments}
          cashierPumpProducts={cashierPumpProducts}
        />

        {localAdjustments.map((adjustment, index) => (
            <AdjustmentsRow
                key={index}
                adjustment={adjustment}
                index={index}
                adjustments={localAdjustments}
                setAdjustments={setLocalAdjustments}
                cashierPumpProducts={cashierPumpProducts}
            />
        ))}
      
      {localAdjustments.length === 0 && (
        <Typography color="textSecondary" textAlign="center" py={4}>
          {dictionary.forms.shifts.messages.noAdjustments}
        </Typography>
      )}
    </Box>
  );
}

export default AdjustmentsTab;