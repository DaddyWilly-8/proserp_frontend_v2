'use client'
import { AddOutlined } from '@mui/icons-material'
import { ButtonGroup, Tooltip,IconButton, Dialog, useMediaQuery } from '@mui/material'
import React, { useState } from 'react'
import BillOfMaterialForm from './form/BillOfMaterialForm'
import { useJumboAuth } from '@/app/providers/JumboAuthProvider'
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks'
import { PERMISSIONS } from '@/utilities/constants/permissions'
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const BillOfMaterialActionTail = () => {
    const dictionary = useDictionary();
    const {checkOrganizationPermission} = useJumboAuth();
    const [openDialog, setOpenDialog] = useState(false);

    //Screen handling constants
    const {theme} = useJumboTheme();
    const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

    return (
        <React.Fragment>
            <Dialog  maxWidth='md' fullWidth fullScreen={belowLargeScreen} open={openDialog}>
                <BillOfMaterialForm toggleOpen={setOpenDialog} />
            </Dialog>
            <ButtonGroup variant="outlined" size="small" disableElevation sx={{ '& .MuiButton-root': { px: 1 } }}>
                {
                    (
                    <Tooltip title={dictionary.tooltips.newBillOfMaterial}>
                        <IconButton onClick={() => setOpenDialog(true)}>
                            <AddOutlined/>
                        </IconButton>
                    </Tooltip>
                    )
                }
            </ButtonGroup>
        </React.Fragment>
    )
}

export default BillOfMaterialActionTail