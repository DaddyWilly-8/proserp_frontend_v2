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
import LoanRequestsForm from './LoanRequestsForm';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const LoanRequestsActionTail = () => {
  const dictionary = useDictionary();
  const { theme } = useJumboTheme();
  const belowMediumScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [openDialog, setOpenDialog] = useState(false);

  return (
    <>
      <Dialog
        open={openDialog}
        fullWidth
        maxWidth='md'
        fullScreen={belowMediumScreen}
        onClose={() => setOpenDialog(false)}
      >
        <LoanRequestsForm setOpenDialog={setOpenDialog} />
      </Dialog>
      <ButtonGroup
        variant='outlined'
        size='small'
        disableElevation
        sx={{ '& .MuiButton-root': { px: 1 } }}
      >
        <Tooltip title={dictionary.tooltips.addLoanRequest}>
          <IconButton onClick={() => setOpenDialog(true)}>
            <AddOutlined />
          </IconButton>
        </Tooltip>
      </ButtonGroup>
    </>
  );
};

export default LoanRequestsActionTail;
