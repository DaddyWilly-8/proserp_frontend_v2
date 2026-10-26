'use client'
import { AddOutlined } from '@mui/icons-material'
import { Dialog, IconButton, Tooltip, useMediaQuery } from '@mui/material'
import React from 'react'
import StockAdjustmentDialogForm from './StockAdjustmentDialogForm';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

function StockAdjustmentsActionTail() {
    const dictionary = useDictionary();
    const {checkOrganizationPermission} = useJumboAuth();
    const [openDialog, setOpenDialog] = React.useState(false);
    
    //Screen handling constants
    const {theme} = useJumboTheme();
    const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  return (
    <React.Fragment>
        {checkOrganizationPermission(PERMISSIONS.STOCK_ADJUSTMENTS_CREATE) &&
            <Tooltip title={dictionary.tooltips.newStockAdjustment}>
                <IconButton onClick={() => setOpenDialog(true)}>
                    <AddOutlined/>
                </IconButton>
            </Tooltip>
        }
        <Dialog fullWidth fullScreen={belowLargeScreen} open={openDialog} scroll={belowLargeScreen ? 'body' : 'paper'} maxWidth='md'>
            <StockAdjustmentDialogForm toggleOpen={setOpenDialog} />
        </Dialog>
    </React.Fragment>
  )
}

export default StockAdjustmentsActionTail