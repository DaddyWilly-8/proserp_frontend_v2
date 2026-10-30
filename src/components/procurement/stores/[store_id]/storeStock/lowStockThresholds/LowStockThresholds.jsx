'use client'

import { AddAlertOutlined } from '@mui/icons-material'
import { Dialog, DialogTitle, IconButton, Tooltip, useMediaQuery } from '@mui/material'
import React, { useState } from 'react'
import LowStockThresholdDialogContent from './LowStockThresholdDialogContent';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

function LowStockThresholds() {
  const dictionary = useDictionary();
  const [openDialog, setOpenDialog] = useState(false);

  //Screen handling constants
  const {theme} = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  return (
    <React.Fragment>
      <Tooltip title={dictionary.tooltips.setLowStockThresholds}>
        <IconButton onClick={() => setOpenDialog(true)}>
          <AddAlertOutlined color='warning'/>
        </IconButton>
      </Tooltip>
      <Dialog fullWidth fullScreen={belowLargeScreen} open={openDialog} scroll={'paper'} maxWidth='lg'>
        <DialogTitle textAlign='center'>Low Stock Thresholds</DialogTitle>
        <LowStockThresholdDialogContent setOpenDialog={setOpenDialog}/>
      </Dialog>
    </React.Fragment>
  )
}

export default LowStockThresholds