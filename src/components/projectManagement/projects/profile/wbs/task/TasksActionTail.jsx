'use client'
import { AddTask } from "@mui/icons-material";
import { ButtonGroup, Dialog, IconButton, Tooltip, useMediaQuery } from "@mui/material";
import React, { useState } from "react";
import TasksForm from "./TasksForm";
import { useJumboTheme } from "@jumbo/components/JumboTheme/hooks";
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const TasksActionTail = ({activity}) => {
  const dictionary = useDictionary();
  const { theme } = useJumboTheme();
  const [openDialog, setOpenDialog] = useState(false)
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const { checkOrganizationPermission } = useJumboAuth();

  if (!checkOrganizationPermission(PERMISSIONS.PROJECTS_EDIT)) {
    return null;
  }

  return (
    <React.Fragment>
      <Dialog maxWidth="md" fullWidth fullScreen={belowLargeScreen} open={openDialog}>
        <TasksForm setOpenDialog={setOpenDialog} activity={activity}/>
      </Dialog>

      <ButtonGroup variant="outlined" size="small" disableElevation sx={{ '& .MuiButton-root': { px: 1 } }}>
        <Tooltip title={dictionary.projectManagement.wbs.task.addTaskFor.replace('{name}', activity?.name)}>
          <IconButton onClick={() => setOpenDialog(true)}>
            <AddTask/>
          </IconButton>
        </Tooltip>
      </ButtonGroup>
    </React.Fragment>
  );
};

export default TasksActionTail;