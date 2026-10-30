'use client'
import { AddOutlined } from "@mui/icons-material";
import { ButtonGroup, Dialog, IconButton, Tooltip, useMediaQuery } from "@mui/material";
import React, { useState } from "react";
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboTheme } from "@jumbo/components/JumboTheme/hooks";
import ProjectClaimsForm from "./form/ProjectClaimsForm";
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const ProjectClaimsActionTail = () => {
  const dictionary = useDictionary();
  const { checkOrganizationPermission } = useJumboAuth();
  const { theme } = useJumboTheme();
  const [openDialog, setOpenDialog] = useState(false);
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const canCreateClaim = checkOrganizationPermission(PERMISSIONS.PROJECT_CLAIMS_CREATE);
  
  return (
    <React.Fragment>
      {canCreateClaim && (
        <Dialog maxWidth="lg" fullWidth fullScreen={belowLargeScreen} open={openDialog}>
          <ProjectClaimsForm setOpenDialog={setOpenDialog}/>
        </Dialog>
      )}

      {canCreateClaim && (
        <ButtonGroup variant="outlined" size="small" disableElevation sx={{ '& .MuiButton-root': { px: 1 } }}>
          <Tooltip title={dictionary.tooltips.addPaymentClaim}>
            <IconButton onClick={() => setOpenDialog(true)}>
              <AddOutlined />
            </IconButton>
          </Tooltip>
        </ButtonGroup>
      )}
    </React.Fragment>
  );
};

export default ProjectClaimsActionTail;