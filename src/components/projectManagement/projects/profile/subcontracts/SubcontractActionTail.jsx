'use client'
import React, { useState } from 'react';
import { AddOutlined } from '@mui/icons-material';
import { ButtonGroup, Tooltip, IconButton, Dialog, useMediaQuery} from '@mui/material';
import SubcontractForm from './SubcontractForm';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const SubcontractActionTail = () => {
  const dictionary = useDictionary();
  const { checkOrganizationPermission } = useJumboAuth();
  const [openDialog, setOpenDialog] = useState(false);
 
  //Screen handling constants
  const {theme} = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  return (
    <React.Fragment>
        <Dialog maxWidth="md" fullWidth fullScreen={belowLargeScreen} open={openDialog}>
            <SubcontractForm setOpenDialog={setOpenDialog} />
        </Dialog>

        <ButtonGroup variant="outlined" size="small" disableElevation sx={{ '& .MuiButton-root': { px: 1 } }}>
            {checkOrganizationPermission(PERMISSIONS.PROJECT_SUBCONTRACTS_CREATE) && (
                <Tooltip title={dictionary.tooltips.addSubcontract}>
                    <IconButton onClick={() => setOpenDialog(true)}>
                        <AddOutlined />
                    </IconButton>
                </Tooltip>
            )}
        </ButtonGroup>
    </React.Fragment>
  );
};

export default SubcontractActionTail;