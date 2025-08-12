import { AddOutlined } from '@mui/icons-material';
import { ButtonGroup, Tooltip, IconButton, useMediaQuery } from '@mui/material';
import React, { useState } from 'react';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import BomsForm from './form/BomsForm';

const BomsActionTail = () => {
  const { checkOrganizationPermission } = useJumboAuth();
  const [openDialog, setOpenDialog] = useState(false);
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  return (
    <React.Fragment>
      {checkOrganizationPermission(PERMISSIONS.BOM_CREATE) && (
        <ButtonGroup
          variant="outlined"
          size="small"
          disableElevation
          sx={{ '& .MuiButton-root': { px: 1 } }}
        >
          <Tooltip title="New Bill of Material">
            <IconButton onClick={() => setOpenDialog(true)}>
              <AddOutlined />
            </IconButton>
          </Tooltip>
        </ButtonGroup>
      )}

      <BomsForm 
        open={openDialog} 
        toggleOpen={setOpenDialog} 
      />
    </React.Fragment>
  );
};

export default BomsActionTail;