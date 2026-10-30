'use client';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import {
  CheckCircleOutline,
  DescriptionOutlined,
  DownloadOutlined,
  ErrorOutline,
  InsertDriveFileOutlined,
  UploadOutlined,
} from '@mui/icons-material';
import {
  Alert,
  alpha,
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { ChangeEvent, useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => (
  <div hidden={value !== index} role='tabpanel'>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

const EmployeeAttendanceDialog = ({
  setOpenDialog,
}: {
  setOpenDialog: (open: boolean) => void;
}) => {
  const dictionary = useDictionary();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [settingTab, setSettingTab] = useState(0);

  const [file, setFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<any | null>(null);
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const { mutate: downloadTemplate, isPending: isDownloading } = useMutation({
    mutationFn: humanResourcesServices.downloadEmployeesAttendanceTemplate,
    onSuccess: (blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'employees-attendance-template.xlsx';
      anchor.click();
      window.URL.revokeObjectURL(url);
      enqueueSnackbar(dictionary.humanResources.employeesAttendance.dialog.messages.templateDownloaded, {
        variant: 'success',
      });
    },
    onError: (error: any) =>
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const { mutate: importExcelMutation, isPending: isImporting } = useMutation({
    mutationFn: humanResourcesServices.importEmployeesAttendanceExcel,
    onSuccess: (response: any) => {
      setImportResult(response);
      queryClient.invalidateQueries({ queryKey: ['employeesAtteance'] });

      if (response.errors && response.errors.length > 0) {
        enqueueSnackbar(
          dictionary.humanResources.employeesAttendance.dialog.messages.importErrors
            .replace('{message}', response.message)
            .replace('{count}', String(response.errors.length)),
          { variant: 'warning' }
        );
      } else if (response.imported > 0 && response.skipped === 0) {
        enqueueSnackbar(
          response.message || dictionary.humanResources.employeesAttendance.dialog.messages.importedSuccessfully,
          {
            variant: 'success',
          }
        );
        setOpenDialog(false);
      } else if (response.imported > 0 && response.skipped > 0) {
        enqueueSnackbar(
          dictionary.humanResources.employeesAttendance.dialog.messages.importedAndSkipped
            .replace('{message}', response.message)
            .replace('{imported}', String(response.imported))
            .replace('{skipped}', String(response.skipped)),
          { variant: 'warning' }
        );
      } else {
        enqueueSnackbar(
          response.message ||
            dictionary.humanResources.employeesAttendance.dialog.messages.noneImported,
          { variant: 'error' }
        );
      }
    },
    onError: (error: any) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  const importExcel = (data: any) => {
    const payload = {
      attendance_excel: data,
    };

    importExcelMutation(payload);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] || null);
    setImportResult(null);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    if (newValue === 1) {
      setImportResult(null);
    }
  };

  const handleClose = () => {
    if (!isImporting && !isDownloading) {
      setOpenDialog(false);
    }
  };

  const isDark = theme.type === 'dark';

  return (
    <>
      <DialogTitle
        variant='h5'
        fontWeight={600}
        sx={{ textAlign: 'center', pb: 1 }}
      >
        {dictionary.humanResources.employeesAttendance.dialog.title}
      </DialogTitle>

      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant='fullWidth'
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                py: 2,
                minHeight: 48,
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                },
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
            }}
          >
            <Tab
              icon={<DownloadOutlined />}
              label={dictionary.humanResources.employeesAttendance.dialog.tabs.downloadTemplate}
              iconPosition='start'
            />
            <Tab
              icon={<UploadOutlined />}
              label={dictionary.humanResources.employeesAttendance.dialog.tabs.uploadExcel}
              iconPosition='start'
            />
          </Tabs>
        </Box>

        {(isDownloading || isImporting) && (
          <LinearProgress sx={{ mt: 2, borderRadius: 1 }} />
        )}

        {/* Tab 1: Download Template */}
        <TabPanel value={tabValue} index={0}>
          <Stack spacing={3}>
            <Alert
              severity='info'
              icon={<DescriptionOutlined />}
              sx={{
                borderRadius: 2,
                '& .MuiAlert-icon': {
                  alignItems: 'center',
                },
                bgcolor: isDark
                  ? alpha(theme.palette.info.main, 0.1)
                  : undefined,
              }}
            >
              <Typography variant='body2' fontWeight={600} gutterBottom>
                {dictionary.humanResources.employeesAttendance.dialog.gettingStarted}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {dictionary.humanResources.employeesAttendance.dialog.gettingStartedText}
              </Typography>
            </Alert>

            <Paper
              variant='outlined'
              sx={{
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                bgcolor: isDark
                  ? alpha(theme.palette.background.paper, 0.6)
                  : 'background.default',
                borderRadius: 2,
                border: `2px dashed ${isDark ? alpha(theme.palette.divider, 0.3) : theme.palette.divider}`,
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  bgcolor: isDark
                    ? alpha(theme.palette.primary.main, 0.05)
                    : alpha(theme.palette.primary.main, 0.02),
                },
              }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: isDark
                    ? alpha(theme.palette.primary.main, 0.15)
                    : alpha(theme.palette.primary.main, 0.08),
                }}
              >
                <DescriptionOutlined
                  sx={{
                    fontSize: 32,
                    color: theme.palette.primary.main,
                  }}
                />
              </Box>
              <Typography variant='h6' fontWeight={600}>
                {dictionary.humanResources.employeesAttendance.dialog.templateTitle}
              </Typography>
              <Typography variant='body2' color='text.secondary' align='center'>
                {dictionary.humanResources.employeesAttendance.dialog.templateDescription}
              </Typography>
            </Paper>
          </Stack>
        </TabPanel>

        {/* Tab 2: Upload Excel */}
        <TabPanel value={tabValue} index={1}>
          <Stack spacing={3}>
            <Alert
              severity='info'
              sx={{
                borderRadius: 2,
                '& .MuiAlert-icon': {
                  alignItems: 'center',
                },
                bgcolor: isDark
                  ? alpha(theme.palette.info.main, 0.1)
                  : undefined,
              }}
            >
              <Typography variant='body2' fontWeight={600} gutterBottom>
                {dictionary.humanResources.employeesAttendance.dialog.uploadInstructions}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {dictionary.humanResources.employeesAttendance.dialog.uploadInstructionsText}
              </Typography>
            </Alert>

            <Paper
              variant='outlined'
              sx={{
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                bgcolor: isDark
                  ? alpha(theme.palette.background.paper, 0.6)
                  : 'background.default',
                borderRadius: 2,
                border: `2px dashed ${file ? theme.palette.success.main : isDark ? alpha(theme.palette.divider, 0.3) : theme.palette.divider}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: file
                    ? theme.palette.success.main
                    : theme.palette.primary.main,
                  bgcolor: isDark
                    ? alpha(theme.palette.primary.main, 0.05)
                    : alpha(theme.palette.primary.main, 0.02),
                },
              }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: file
                    ? isDark
                      ? alpha(theme.palette.success.main, 0.15)
                      : alpha(theme.palette.success.main, 0.08)
                    : isDark
                      ? alpha(theme.palette.text.secondary, 0.05)
                      : alpha(theme.palette.text.secondary, 0.04),
                  transition: 'all 0.3s ease',
                }}
              >
                <InsertDriveFileOutlined
                  sx={{
                    fontSize: 32,
                    color: file ? theme.palette.success.main : 'text.secondary',
                    opacity: file ? 1 : 0.5,
                  }}
                />
              </Box>

              {file ? (
                <>
                  <Typography
                    variant='h6'
                    fontWeight={600}
                    color='success.main'
                  >
                    {file.name}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {dictionary.humanResources.employeesAttendance.dialog.readyToUpload.replace(
                      '{size}',
                      (file.size / 1024).toFixed(1)
                    )}
                  </Typography>
                  <Button
                    variant='outlined'
                    color='error'
                    size='small'
                    onClick={() => setFile(null)}
                    sx={{ borderRadius: 2, textTransform: 'none' }}
                  >
                    {dictionary.humanResources.employeesAttendance.dialog.removeFile}
                  </Button>
                </>
              ) : (
                <>
                  <Typography variant='body2' color='text.secondary'>
                    {dictionary.humanResources.employeesAttendance.dialog.noFileSelected}
                  </Typography>
                  <Button
                    variant='outlined'
                    component='label'
                    startIcon={<UploadOutlined />}
                    sx={{
                      minWidth: 200,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 500,
                    }}
                  >
                    {dictionary.humanResources.employeesAttendance.dialog.selectExcelFile}
                    <input
                      hidden
                      type='file'
                      accept='.xlsx,.xls'
                      onChange={handleFileChange}
                    />
                  </Button>
                </>
              )}
            </Paper>

            {/* Improved Import Results with Dark Mode Support */}
            {importResult && (
              <Paper
                variant='outlined'
                sx={{
                  p: 3,
                  borderRadius: 2,
                }}
              >
                <Stack spacing={3}>
                  {/* Summary Alert */}
                  <Alert
                    severity={
                      (importResult.errors || []).length > 0
                        ? 'warning'
                        : 'success'
                    }
                    icon={
                      importResult.errors?.length > 0 ? (
                        <ErrorOutline />
                      ) : (
                        <CheckCircleOutline />
                      )
                    }
                    sx={{
                      borderRadius: 2,
                      '& .MuiAlert-icon': {
                        alignItems: 'center',
                      },
                      bgcolor: isDark
                        ? 'background.paper'
                        : 'background.default',
                    }}
                  >
                    <Typography
                      variant='body2'
                      color={isDark ? theme.palette.text.primary : 'primary'}
                      gutterBottom
                    >
                      {dictionary.humanResources.employeesAttendance.dialog.importSummary}
                    </Typography>
                    <Box
                      sx={{ display: 'flex', gap: 4, mt: 1, flexWrap: 'wrap' }}
                    >
                      <Box>
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          display='block'
                        >
                          {dictionary.humanResources.employeesAttendance.dialog.imported}
                        </Typography>
                        <Typography
                          variant='h6'
                          color='success.main'
                          fontWeight={700}
                        >
                          {importResult.imported ?? 0}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          display='block'
                        >
                          {dictionary.humanResources.employeesAttendance.dialog.skipped}
                        </Typography>
                        <Typography
                          variant='h6'
                          color='warning.main'
                          fontWeight={700}
                        >
                          {importResult.skipped ?? 0}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          display='block'
                        >
                          {dictionary.humanResources.employeesAttendance.dialog.errors}
                        </Typography>
                        <Typography
                          variant='h6'
                          color='error.main'
                          fontWeight={700}
                        >
                          {importResult.errors?.length ?? 0}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          display='block'
                        >
                          {dictionary.humanResources.employeesAttendance.dialog.totalProcessed}
                        </Typography>
                        <Typography
                          variant='h6'
                          color={isDark ? 'text.primary' : 'text.primary'}
                          fontWeight={700}
                        >
                          {(importResult.imported ?? 0) +
                            (importResult.skipped ?? 0)}
                        </Typography>
                      </Box>
                    </Box>
                    {importResult.message && (
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{ mt: 1 }}
                      >
                        {importResult.message}
                      </Typography>
                    )}
                  </Alert>

                  {/* Skipped Rows Details - Enhanced Dark Mode */}
                  {importResult.errors && importResult.errors.length > 0 && (
                    <Box>
                      <Typography
                        variant='subtitle2'
                        gutterBottom
                        fontWeight={600}
                        color='text.secondary'
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <ErrorOutline fontSize='small' color='warning' />
                        {dictionary.humanResources.employeesAttendance.dialog.skippedRows.replace(
                          '{count}',
                          String(importResult.errors.length)
                        )}
                      </Typography>

                      <Box
                        sx={{
                          bgcolor: isDark
                            ? alpha(theme.palette.warning.main, 0.06)
                            : alpha(theme.palette.warning.main, 0.03),
                          borderRadius: 1,
                          border: 1,
                          borderColor: isDark
                            ? alpha(theme.palette.warning.main, 0.15)
                            : alpha(theme.palette.warning.main, 0.1),
                          overflow: 'hidden',
                          maxHeight: 320,
                          overflowY: 'auto',
                          '&::-webkit-scrollbar': {
                            width: 6,
                          },
                          '&::-webkit-scrollbar-track': {
                            background: isDark
                              ? alpha(theme.palette.common.white, 0.05)
                              : alpha(theme.palette.common.black, 0.05),
                          },
                          '&::-webkit-scrollbar-thumb': {
                            background: isDark
                              ? alpha(theme.palette.common.white, 0.15)
                              : alpha(theme.palette.common.black, 0.15),
                            borderRadius: 3,
                          },
                        }}
                      >
                        {/* Table Header */}
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: '80px 1fr',
                            bgcolor: isDark
                              ? alpha(theme.palette.warning.main, 0.12)
                              : alpha(theme.palette.warning.main, 0.06),
                            borderBottom: 1,
                            borderColor: isDark
                              ? alpha(theme.palette.divider, 0.3)
                              : theme.palette.divider,
                            p: 1.5,
                            gap: 1,
                            position: 'sticky',
                            top: 0,
                            zIndex: 1,
                            backdropFilter: isDark ? 'blur(4px)' : 'none',
                          }}
                        >
                          <Typography
                            variant='caption'
                            fontWeight={700}
                            color={isDark ? 'text.primary' : 'text.secondary'}
                            sx={{ letterSpacing: 0.5 }}
                          >
                            {dictionary.humanResources.employeesAttendance.dialog.rowNo}
                          </Typography>
                          <Typography
                            variant='caption'
                            fontWeight={700}
                            color={isDark ? 'text.primary' : 'text.secondary'}
                            sx={{ letterSpacing: 0.5 }}
                          >
                            {dictionary.humanResources.employeesAttendance.dialog.errorDescription}
                          </Typography>
                        </Box>

                        {/* Error Rows */}
                        {importResult.errors.map((item: any, index: number) => (
                          <Box
                            key={`${item.row}-${index}`}
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: '80px 1fr',
                              gap: 1,
                              p: 1.5,
                            }}
                          >
                            <Box
                              sx={{ display: 'flex', alignItems: 'flex-start' }}
                            >
                              <Typography
                                variant='body2'
                                color='warning.main'
                                sx={{
                                  px: 1,
                                  py: 0.25,
                                  borderRadius: 0.5,
                                }}
                              >
                                {item.row}.
                              </Typography>
                            </Box>
                            <Box>
                              <Typography
                                variant='body2'
                                color={isDark ? 'text.primary' : 'text.primary'}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: 1,
                                }}
                              >
                                <span
                                  style={{
                                    color: isDark
                                      ? alpha(theme.palette.common.white, 0.9)
                                      : 'inherit',
                                  }}
                                >
                                  {item.error || item.message}
                                </span>
                              </Typography>
                              {item.rowData && (
                                <Typography
                                  variant='caption'
                                  color={
                                    isDark ? 'text.secondary' : 'text.secondary'
                                  }
                                  sx={{
                                    display: 'block',
                                    mt: 0.5,
                                    ml: 3.5,
                                    bgcolor: isDark
                                      ? alpha(theme.palette.common.white, 0.03)
                                      : alpha(theme.palette.common.black, 0.02),
                                    p: 0.5,
                                    borderRadius: 0.5,
                                    fontFamily: 'monospace',
                                    fontSize: '0.7rem',
                                  }}
                                >
                                  {dictionary.humanResources.employeesAttendance.dialog.rowData.replace(
                                    '{data}',
                                    JSON.stringify(item.rowData)
                                  )}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        ))}
                      </Box>

                      <Box
                        sx={{
                          mt: 1.5,
                          p: 1.5,
                          bgcolor: isDark
                            ? alpha(theme.palette.info.main, 0.06)
                            : alpha(theme.palette.info.main, 0.04),
                          borderRadius: 1,
                          border: 1,
                          borderColor: isDark
                            ? alpha(theme.palette.info.main, 0.15)
                            : alpha(theme.palette.info.main, 0.1),
                        }}
                      >
                        <Typography
                          variant='body2'
                          color={isDark ? 'text.secondary' : 'text.secondary'}
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <span style={{ fontSize: '1.2rem' }}>💡</span>
                          <strong>{dictionary.humanResources.employeesAttendance.dialog.tipLabel}</strong> {dictionary.humanResources.employeesAttendance.dialog.tipText}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Success Message for Fully Successful Import */}
                  {(!importResult.errors || importResult.errors.length === 0) &&
                    importResult.imported > 0 && (
                      <Alert
                        severity='success'
                        sx={{
                          borderRadius: 2,
                          bgcolor: isDark
                            ? alpha(theme.palette.success.main, 0.1)
                            : undefined,
                        }}
                      >
                        <Typography variant='body2'>
                          {dictionary.humanResources.employeesAttendance.dialog.allImported.replace(
                            '{count}',
                            String(importResult.imported)
                          )}
                        </Typography>
                      </Alert>
                    )}
                </Stack>
              </Paper>
            )}
          </Stack>
        </TabPanel>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: 1,
          borderColor: isDark ? alpha(theme.palette.divider, 0.2) : 'divider',
        }}
      >
        <Button
          onClick={handleClose}
          disabled={isImporting || isDownloading}
          variant='outlined'
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 500,
            minWidth: 100,
            borderColor: isDark
              ? alpha(theme.palette.common.white, 0.15)
              : undefined,
            color: isDark ? theme.palette.common.white : undefined,
            '&:hover': {
              borderColor: isDark
                ? alpha(theme.palette.common.white, 0.3)
                : undefined,
              bgcolor: isDark
                ? alpha(theme.palette.common.white, 0.05)
                : undefined,
            },
          }}
        >
          {dictionary.humanResources.employeesAttendance.dialog.buttons.close}
        </Button>

        {tabValue === 0 && (
          <Button
            variant='contained'
            startIcon={<DownloadOutlined />}
            onClick={() => downloadTemplate()}
            disabled={isDownloading}
            size='large'
            sx={{
              minWidth: 200,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            {isDownloading
              ? dictionary.humanResources.employeesAttendance.dialog.buttons.downloading
              : dictionary.humanResources.employeesAttendance.dialog.buttons.downloadTemplate}
          </Button>
        )}
        {file && tabValue === 1 && (
          <Button
            variant='contained'
            startIcon={<UploadOutlined />}
            onClick={() => importExcel(file)}
            disabled={isImporting}
            size='large'
            sx={{
              minWidth: 200,
              alignSelf: 'center',
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            {isImporting
              ? dictionary.humanResources.employeesAttendance.dialog.buttons.uploading
              : dictionary.humanResources.employeesAttendance.dialog.buttons.uploadAndImport}
          </Button>
        )}
      </DialogActions>
    </>
  );
};

export default EmployeeAttendanceDialog;
