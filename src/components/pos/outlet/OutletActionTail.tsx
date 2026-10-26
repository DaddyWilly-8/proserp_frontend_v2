'use client'
import { AddOutlined } from '@mui/icons-material';
import {
  ButtonGroup,
  Dialog,
  IconButton,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import React, { useState } from 'react';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions'; 
import OutletFormDialog from './OutletFormDialog';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const OutletActionTail = () => {
  const dictionary = useDictionary();
  const [openDialog, setOpenDialog] = useState(false);
  const { theme } = useJumboTheme();
  const { checkOrganizationPermission } = useJumboAuth();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

 return (
    <React.Fragment>
      <Dialog maxWidth="md" fullScreen={belowLargeScreen} open={openDialog}>
        <OutletFormDialog setOpenDialog={setOpenDialog} />
      </Dialog>
      <ButtonGroup variant="outlined" size="small" disableElevation sx={{ '& .MuiButton-root': { px: 1 } }}>
        {(
          <Tooltip title={dictionary.tooltips.newOutlet}>
            <IconButton onClick={() => setOpenDialog(true)}>
              <AddOutlined />
            </IconButton>
          </Tooltip>
        )}
      </ButtonGroup>
    </React.Fragment>
  );
};

export default OutletActionTail;
