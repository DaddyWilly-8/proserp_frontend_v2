import { faFileExcel, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { LoadingButton } from '@mui/lab';
import { Box, Button, Divider, Tooltip } from '@mui/material';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

export const FileExportGrid = ({
  exportExcel,
  exportPdf,
  handlExcelExport,
  handlePdf,
  exportData,
  exportingExcel,
  startComponent,
}: {
  exportExcel?: boolean;
  exportPdf?: boolean;
  handlExcelExport?: (value: any) => Promise<void> | undefined;
  handlePdf?: () => void | undefined;
  exportData?: any;
  exportingExcel?: boolean;
  startComponent?: React.ReactNode;
}) => {
  const dictionary = useDictionary();
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        bgcolor: 'background.paper',
        p: 0,
        color: 'text.secondary',
        '& svg': {
          m: 1,
        },
      }}
    >
      {startComponent && startComponent}
      {exportExcel && startComponent && (
        <Divider orientation='vertical' variant='middle' flexItem />
      )}
      {exportExcel && (
        <Tooltip title={dictionary.tooltips.exportExcel}>
          <LoadingButton
            onClick={() => {
              handlExcelExport && handlExcelExport(exportData);
            }}
            loading={exportingExcel}
            sx={{
              width: 'fit-content',
              fontSize: 15,
            }}
          >
            <FontAwesomeIcon color='green' size='lg' icon={faFileExcel} />
          </LoadingButton>
        </Tooltip>
      )}
      {exportExcel && exportPdf && (
        <Divider orientation='vertical' variant='middle' flexItem />
      )}

      {exportPdf && (
        <Tooltip title={dictionary.tooltips.togglePdfPreview}>
          <Button
            onClick={() => {
              handlePdf && handlePdf();
            }}
            sx={{
              width: 'fit-content',
              fontSize: 15,
            }}
          >
            <FontAwesomeIcon color='red' size='lg' icon={faFilePdf} />
          </Button>
        </Tooltip>
      )}
    </Box>
  );
};
