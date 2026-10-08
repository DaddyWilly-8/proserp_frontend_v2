'use client'

import { faFilePdf } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Button, Tooltip } from '@mui/material';

const ReportExportButtons = ({
  onExportPdf,
  pdfLabel,
}: {
  onExportPdf: () => void;
  pdfLabel: string;
}) => {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        bgcolor: 'background.paper',
        color: 'text.secondary',
      }}
    >
      <Tooltip title={pdfLabel}>
        <Button onClick={onExportPdf} sx={{ width: 'fit-content', fontSize: 15 }}>
          <FontAwesomeIcon color='red' size='lg' icon={faFilePdf} />
        </Button>
      </Tooltip>
    </Box>
  );
};

export default ReportExportButtons;
