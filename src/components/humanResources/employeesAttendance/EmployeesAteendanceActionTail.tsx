'use client';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { UploadFileOutlined } from '@mui/icons-material';
import {
  alpha,
  Box,
  ButtonGroup,
  Dialog,
  IconButton,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { useState } from 'react';
import EmployeeAttendanceDialog from './EmployeeAttendanceDialog';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
// Simple Excel-styled icon with "XLS" badge
const ExcelUploadIcon = () => (
  <Box sx={{ position: 'relative', display: 'inline-flex' }}>
    <UploadFileOutlined
      sx={{
        color: '#217346',
        fontSize: 24,
      }}
    />
    <Box
      sx={{
        position: 'absolute',
        bottom: -4,
        right: -4,
        fontSize: 7,
        fontWeight: 700,
        bgcolor: '#217346',
        color: 'white',
        px: 0.4,
        borderRadius: 0.5,
        lineHeight: 1.2,
        fontFamily: 'sans-serif',
      }}
    >
      XLS
    </Box>
  </Box>
);

const EmployeesAteendanceActionTail = () => {
  const dictionary = useDictionary();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const [openAttendanceDialog, setOpenAttendanceDialog] = useState(false);

  return (
    <>
      <Dialog
        open={openAttendanceDialog}
        fullWidth
        maxWidth='md'
        fullScreen={belowLargeScreen}
        onClose={() => setOpenAttendanceDialog(false)}
      >
        <EmployeeAttendanceDialog setOpenDialog={setOpenAttendanceDialog} />
      </Dialog>
      <ButtonGroup
        variant='outlined'
        size='small'
        disableElevation
        sx={{
          '& .MuiButton-root': { px: 1 },
          '& .MuiButtonGroup-grouped:not(:last-of-type)': {
            borderColor: 'divider',
          },
        }}
      >
        <Tooltip title={dictionary.tooltips.employeeAttendanceImport}>
          <IconButton
            onClick={() => setOpenAttendanceDialog(true)}
            sx={{
              color: '#217346',
              '&:hover': {
                bgcolor: alpha('#217346', 0.08),
              },
            }}
          >
            <ExcelUploadIcon />
          </IconButton>
        </Tooltip>
      </ButtonGroup>
    </>
  );
};

export default EmployeesAteendanceActionTail;
