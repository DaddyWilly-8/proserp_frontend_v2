'use client'

import { faFilePdf } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { LoadingButton } from '@mui/lab';
import { Box, Tooltip } from '@mui/material';

const ReportExportButtons = ({
  onExportPdf,
  exportingPdf,
  pdfLabel,
}: {
  onExportPdf: () => void;
  exportingPdf?: boolean;
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
        <LoadingButton
          onClick={onExportPdf}
          loading={exportingPdf}
          sx={{ width: 'fit-content', fontSize: 15 }}
        >
          <FontAwesomeIcon color='red' size='lg' icon={faFilePdf} />
        </LoadingButton>
      </Tooltip>
    </Box>
  );
};

export default ReportExportButtons;
