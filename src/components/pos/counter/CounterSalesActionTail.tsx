'use client'
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { AddOutlined } from '@mui/icons-material'
import { Dialog, IconButton, Tooltip, useMediaQuery } from '@mui/material'
import React, { lazy } from 'react'
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const SaleDialogForm = lazy(() => import('./saleForm/SaleDialogForm'));

function CounterSalesActionTail() {
    const dictionary = useDictionary();
    const [openDialog, setOpenDialog] = React.useState(false);

    //Screen handling constants
    const {theme} = useJumboTheme();
    const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  return (
    <React.Fragment>
        <Tooltip title={dictionary.tooltips.newSale}>
            <IconButton onClick={() => setOpenDialog(true)}>
                <AddOutlined/>
            </IconButton>
        </Tooltip>
        <Dialog fullWidth open={openDialog} fullScreen={belowLargeScreen} maxWidth='lg' scroll={belowLargeScreen ? 'body' : 'paper'}>
            <SaleDialogForm toggleOpen={setOpenDialog}/>
        </Dialog>
    </React.Fragment>
  )
}

export default CounterSalesActionTail