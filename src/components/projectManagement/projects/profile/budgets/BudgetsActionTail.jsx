'use client'
import { AddOutlined } from "@mui/icons-material";
import { ButtonGroup, Dialog, IconButton, Tooltip, useMediaQuery } from "@mui/material";
import React, { useState } from "react";
import BudgetsForm from "./BudgetsForm";
import { useJumboTheme } from "@jumbo/components/JumboTheme/hooks";
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const BudgetsActionTail = ({ isProjectBudget=true }) => {
  const dictionary = useDictionary();
  const { theme } = useJumboTheme();
  const [openDialog, setOpenDialog] = useState(false)
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const { checkOrganizationPermission } = useJumboAuth();

  if (!checkOrganizationPermission(PERMISSIONS.BUDGETS_CREATE)) {
    return null;
  }

    return (
      <React.Fragment>
        <Dialog maxWidth="lg" fullWidth scroll={belowLargeScreen ? 'body' : 'paper'} fullScreen={belowLargeScreen} open={openDialog}>
          <BudgetsForm setOpenDialog={setOpenDialog} isProjectBudget={isProjectBudget} />
        </Dialog>
  
        <ButtonGroup variant="outlined" size="small" disableElevation sx={{ '& .MuiButton-root': { px: 1 } }}>
          <Tooltip title={isProjectBudget ? dictionary.projectManagement.budgets.addProjectBudget : dictionary.projectManagement.budgets.addBudget}>
            <IconButton onClick={() => setOpenDialog(true)}>
              <AddOutlined/>
            </IconButton>
          </Tooltip>
        </ButtonGroup>
      </React.Fragment>
    );
  };

  export default BudgetsActionTail;