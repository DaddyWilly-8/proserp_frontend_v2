'use client';

import { AdjustOutlined } from '@mui/icons-material';
import { alpha, Dialog, IconButton, Tooltip, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useState } from 'react';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface PayrollPeriodAdjustmentsActionProps {
  payrollPeriodId: number;
  year: number;
  month: number;
}

const PayrollPeriodAdjustmentsAction = ({
  payrollPeriodId,
  year,
  month,
}: PayrollPeriodAdjustmentsActionProps) => {
  const dictionary = useDictionary();
  const [openDialog, setOpenDialog] = useState(false);
  const theme = useTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  return (
    <>
      <Tooltip title={dictionary.tooltips.adHocAdjustments}>
        <IconButton
          onClick={() => setOpenDialog(true)}
          size="small"
          sx={{
            color: 'info.main',
            '&:hover': {
              bgcolor: alpha(theme.palette.info.main, 0.08),
            },
          }}
        >
          <AdjustOutlined fontSize="small" />
        </IconButton>
      </Tooltip>
    </>
  );
};

export default PayrollPeriodAdjustmentsAction;