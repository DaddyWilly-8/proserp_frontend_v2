'use client';

import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { AddOutlined } from '@mui/icons-material';
import {
  ButtonGroup,
  Dialog,
  IconButton,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { useState } from 'react';
import EmployeeEmployerContributionForm from './EmployeeEmployerContributionForm';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const EmployeeEmployerContributionActionTail = ({ employeeId }: { employeeId?: number }) => {
  const dictionary = useDictionary();
  const [openDialog, setOpenDialog] = useState(false);

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  return (
    <>
      <Dialog maxWidth='md' fullScreen={belowLargeScreen} open={openDialog}>
        <EmployeeEmployerContributionForm
          setOpenDialog={setOpenDialog}
          employeeId={employeeId}
        />
      </Dialog>
      <ButtonGroup
        variant='outlined'
        size='small'
        disableElevation
        sx={{ '& .MuiButton-root': { px: 1 } }}
      >
        <Tooltip title={dictionary.tooltips.addEmployeeEmployerContribution}>
          <IconButton onClick={() => setOpenDialog(true)}>
            <AddOutlined />
          </IconButton>
        </Tooltip>
      </ButtonGroup>
    </>
  );
};

export default EmployeeEmployerContributionActionTail;
