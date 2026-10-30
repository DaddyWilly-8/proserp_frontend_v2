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
import DesignationForm from './DesignationForm';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const DesignationActionTail = () => {
  const dictionary = useDictionary();
  const [openDialog, setOpenDialog] = useState(false);

  //Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  return (
    <>
      <Dialog maxWidth='md' fullScreen={belowLargeScreen} open={openDialog}>
        <DesignationForm setOpenDialog={setOpenDialog} />
      </Dialog>
      <ButtonGroup
        variant='outlined'
        size='small'
        disableElevation
        sx={{ '& .MuiButton-root': { px: 1 } }}
      >
        {/* {( */}
        <Tooltip title={dictionary.tooltips.addDesignation}>
          <IconButton onClick={() => setOpenDialog(true)}>
            <AddOutlined />
          </IconButton>
        </Tooltip>
        {/* )} */}
      </ButtonGroup>
    </>
  );
};

export default DesignationActionTail;
