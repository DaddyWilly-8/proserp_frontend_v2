'use client';

import {
  CheckCircleOutline,
  DescriptionOutlined,
  DownloadOutlined,
  ErrorOutline,
  InsertDriveFileOutlined,
  UploadOutlined,
  Refresh,
  Close,
} from '@mui/icons-material';
import {
  Alert,
  alpha,
  Box,
  Button,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
  useTheme,
  Grid,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import projectsServices from '../../project-services';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const getErrorMessage = (error, fallback) => {
  const validationErrors = error?.response?.data?.validation_errors;
  if (validationErrors && typeof validationErrors === 'object') {
    const first = Object.values(validationErrors)[0];
    return Array.isArray(first) ? first[0] : String(first);
  }
  return error?.response?.data?.message || error?.message || fallback;
};

const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index} role="tabpanel">
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

const DeliverablesBulkImport = ({ project, setOpenDialog }) => {
  const dictionary = useDictionary();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const isDark = theme.type === 'dark';

  const [tabValue, setTabValue] = useState(0);
  const [file, setFile] = useState(null);
  const [importResult, setImportResult] = useState(null);

  const handleClose = () => setOpenDialog(false);

  const { mutate: downloadTemplate, isPending: isDownloading } = useMutation({
    mutationFn: () => projectsServices.downloadDeliverablesExcelTemplate(project.id),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${project?.name ?? dictionary.projectManagement.deliverables.bulkImport.projectFallback} ${dictionary.projectManagement.deliverables.title}.xlsx`;
      anchor.click();
      window.URL.revokeObjectURL(url);
      enqueueSnackbar(dictionary.projectManagement.deliverables.bulkImport.templateDownloaded, { variant: 'success' });
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error, dictionary.projectManagement.deliverables.bulkImport.somethingWentWrong), { variant: 'error' }),
  });

  const { mutate: importDeliverables, isPending: isImporting } = useMutation({
    mutationFn: (file) => {
      const formData = new FormData();
      formData.append('project_id', project.id);
      formData.append('deliverables_excel', file);
      return projectsServices.importDeliverablesExcel(formData);
    },
    onSuccess: (response) => {
      setImportResult(response);
      setFile(null);

      queryClient.invalidateQueries({ queryKey: ['projectDeliverableGroups'] });

      if (response.errors && response.errors.length > 0) {
        enqueueSnackbar(
          dictionary.projectManagement.deliverables.bulkImport.errorsFound.replace('{message}', response.message).replace('{count}', response.errors.length),
          { variant: 'warning' }
        );
      } else if (response.imported > 0 && response.skipped === 0) {
        enqueueSnackbar(response.message || dictionary.projectManagement.deliverables.bulkImport.importedSuccess, { variant: 'success' });
      } else if (response.imported > 0 && response.skipped > 0) {
        enqueueSnackbar(dictionary.projectManagement.deliverables.bulkImport.importedSkipped.replace('{message}', response.message).replace('{imported}', response.imported).replace('{skipped}', response.skipped), { variant: 'warning' });
      } else {
        enqueueSnackbar(response.message || dictionary.projectManagement.deliverables.bulkImport.nothingImported, { variant: 'error' });
      }
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error, dictionary.projectManagement.deliverables.bulkImport.somethingWentWrong), { variant: 'error' }),
  });

  const handleFileChange = (event) => {
    setFile(event.target.files?.[0] || null);
    setImportResult(null);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    if (newValue === 1) {
      setImportResult(null);
    }
  };

  const handleReset = () => {
    setFile(null);
    setImportResult(null);
    setTabValue(0);
  };

  const hasErrors = (importResult?.errors || []).length > 0;

  return (
    <React.Fragment>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {dictionary.projectManagement.deliverables.bulkImport.title}
        <IconButton onClick={handleClose}>
          <Close />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {dictionary.projectManagement.deliverables.bulkImport.intro.replace('{project}', project?.name)}
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 500, py: 1.5, minHeight: 40 } }}
          >
            <Tab icon={<DownloadOutlined />} label={dictionary.projectManagement.deliverables.bulkImport.downloadTemplate} iconPosition="start" />
            <Tab icon={<UploadOutlined />} label={dictionary.projectManagement.deliverables.bulkImport.uploadExcel} iconPosition="start" />
          </Tabs>
        </Box>

        {(isDownloading || isImporting) && <LinearProgress sx={{ mt: 2, borderRadius: 1 }} />}

        <TabPanel value={tabValue} index={0}>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Alert
              severity="info"
              icon={<DescriptionOutlined />}
              sx={{
                borderRadius: 2,
                '& .MuiAlert-icon': {
                  alignItems: 'center',
                  color: isDark ? theme.palette.info.light : undefined,
                },
                bgcolor: isDark ? alpha(theme.palette.info.main, 0.12) : undefined,
                color: isDark ? theme.palette.common.white : undefined,
                border: isDark ? `1px solid ${alpha(theme.palette.info.main, 0.3)}` : undefined,
              }}
            >
              <Typography variant="body2" fontWeight={600} gutterBottom color={isDark ? 'inherit' : undefined}>
                {dictionary.projectManagement.deliverables.bulkImport.gettingStarted}
              </Typography>
              <Typography variant="body2" color={isDark ? alpha(theme.palette.common.white, 0.8) : 'text.secondary'}>
                {dictionary.projectManagement.deliverables.bulkImport.gettingStartedText}
              </Typography>
            </Alert>

            <Paper
              variant="outlined"
              sx={{
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                borderRadius: 2,
                border: `2px dashed ${theme.palette.divider}`,
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
                  bgcolor: alpha(theme.palette.primary.main, isDark ? 0.15 : 0.08),
                }}
              >
                <DescriptionOutlined sx={{ fontSize: 32, color: theme.palette.primary.main }} />
              </Box>
              <Typography variant="h6" fontWeight={600}>
                {dictionary.projectManagement.deliverables.bulkImport.templateName}
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                {dictionary.projectManagement.deliverables.bulkImport.templateDesc}
              </Typography>
              <Button
                variant="contained"
                startIcon={<DownloadOutlined />}
                onClick={() => downloadTemplate()}
                disabled={isDownloading}
                size="large"
                sx={{ minWidth: 200, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                {isDownloading ? dictionary.projectManagement.deliverables.bulkImport.downloading : dictionary.projectManagement.deliverables.bulkImport.downloadTemplate}
              </Button>
            </Paper>
          </Stack>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Alert
              severity="info"
              sx={{
                borderRadius: 2,
                '& .MuiAlert-icon': {
                  alignItems: 'center',
                  color: isDark ? theme.palette.info.light : undefined,
                },
                bgcolor: isDark ? alpha(theme.palette.info.main, 0.12) : undefined,
                color: isDark ? theme.palette.common.white : undefined,
                border: isDark ? `1px solid ${alpha(theme.palette.info.main, 0.3)}` : undefined,
              }}
            >
              <Typography variant="body2" fontWeight={600} gutterBottom color={isDark ? 'inherit' : undefined}>
                {dictionary.projectManagement.deliverables.bulkImport.uploadInstructions}
              </Typography>
              <Typography variant="body2" color={isDark ? alpha(theme.palette.common.white, 0.8) : 'text.secondary'}>
                {dictionary.projectManagement.deliverables.bulkImport.uploadInstructionsText}
              </Typography>
            </Alert>

            <Paper
              variant="outlined"
              sx={{
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                borderRadius: 2,
                border: `2px dashed ${file ? theme.palette.success.main : theme.palette.divider}`,
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
                    ? alpha(theme.palette.success.main, isDark ? 0.15 : 0.08)
                    : alpha(theme.palette.text.secondary, 0.05),
                }}
              >
                <InsertDriveFileOutlined
                  sx={{ fontSize: 32, color: file ? theme.palette.success.main : 'text.secondary', opacity: file ? 1 : 0.5 }}
                />
              </Box>

              {file ? (
                <React.Fragment>
                  <Typography variant="h6" fontWeight={600} color="success.main">
                    {file.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {(file.size / 1024).toFixed(1)} KB &bull; {dictionary.projectManagement.deliverables.bulkImport.readyToUpload}
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    <Button variant="outlined" color="error" size="small" onClick={() => setFile(null)} sx={{ borderRadius: 2, textTransform: 'none' }}>
                      {dictionary.projectManagement.deliverables.bulkImport.removeFile}
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<UploadOutlined />}
                      onClick={() => importDeliverables(file)}
                      disabled={isImporting}
                      size="large"
                      sx={{ minWidth: 200, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                    >
                      {isImporting ? dictionary.projectManagement.deliverables.bulkImport.uploading : dictionary.projectManagement.deliverables.bulkImport.uploadAndImport}
                    </Button>
                  </Stack>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <Typography variant="body2" color="text.secondary">
                    {dictionary.projectManagement.deliverables.bulkImport.noFileSelected}
                  </Typography>
                  <Button variant="outlined" component="label" startIcon={<UploadOutlined />} sx={{ minWidth: 200, borderRadius: 2, textTransform: 'none', fontWeight: 500 }}>
                    {dictionary.projectManagement.deliverables.bulkImport.selectExcelFile}
                    <input hidden type="file" accept=".xlsx,.xls" onChange={handleFileChange} />
                  </Button>
                </React.Fragment>
              )}
            </Paper>

            {importResult && (
              <Box sx={{ width: '100%' }}>
                <Stack spacing={3}>
                  <Alert
                    severity={hasErrors ? 'warning' : 'success'}
                    icon={hasErrors ? <ErrorOutline /> : <CheckCircleOutline />}
                    sx={{
                      borderRadius: 2,
                      width: '100%',
                      '& .MuiAlert-icon': {
                        alignItems: 'center',
                        color: isDark ? (hasErrors ? theme.palette.warning.light : theme.palette.success.light) : undefined,
                      },
                      bgcolor: isDark ? alpha(hasErrors ? theme.palette.warning.main : theme.palette.success.main, 0.12) : undefined,
                      color: isDark ? theme.palette.common.white : undefined,
                      border: isDark
                        ? `1px solid ${alpha(hasErrors ? theme.palette.warning.main : theme.palette.success.main, 0.3)}`
                        : undefined,
                    }}
                  >
                    <Typography variant="body2" fontWeight={600} gutterBottom color={isDark ? 'inherit' : undefined}>
                      {dictionary.projectManagement.deliverables.bulkImport.importSummary}
                    </Typography>

                    <Grid container spacing={2} sx={{ width: '100%', mt: 1 }}>
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Typography variant="caption" color={isDark ? alpha(theme.palette.common.white, 0.7) : 'text.secondary'} display="block">
                          {dictionary.projectManagement.deliverables.bulkImport.imported}
                        </Typography>
                        <Typography variant="h6" color={isDark ? theme.palette.success.light : 'success.main'} fontWeight={700}>
                          {importResult.imported ?? 0}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Typography variant="caption" color={isDark ? alpha(theme.palette.common.white, 0.7) : 'text.secondary'} display="block">
                          {dictionary.projectManagement.deliverables.bulkImport.skipped}
                        </Typography>
                        <Typography variant="h6" color={isDark ? theme.palette.warning.light : 'warning.main'} fontWeight={700}>
                          {importResult.skipped ?? 0}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Typography variant="caption" color={isDark ? alpha(theme.palette.common.white, 0.7) : 'text.secondary'} display="block">
                          {dictionary.projectManagement.deliverables.bulkImport.errors}
                        </Typography>
                        <Typography variant="h6" color={isDark ? theme.palette.error.light : 'error.main'} fontWeight={700}>
                          {importResult.errors?.length ?? 0}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Typography variant="caption" color={isDark ? alpha(theme.palette.common.white, 0.7) : 'text.secondary'} display="block">
                          {dictionary.projectManagement.deliverables.bulkImport.totalProcessed}
                        </Typography>
                        <Typography variant="h6" fontWeight={700} color={isDark ? 'inherit' : undefined}>
                          {(importResult.imported ?? 0) + (importResult.skipped ?? 0)}
                        </Typography>
                      </Grid>
                    </Grid>

                    {importResult.message && (
                      <Typography variant="body2" color={isDark ? alpha(theme.palette.common.white, 0.8) : 'text.secondary'} sx={{ mt: 1 }}>
                        {importResult.message}
                      </Typography>
                    )}
                  </Alert>

                  {importResult.errors && importResult.errors.length > 0 && (
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="subtitle2" gutterBottom fontWeight={600} color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ErrorOutline fontSize="small" color="warning" />
                        {(importResult.errors.length > 1 ? dictionary.projectManagement.deliverables.bulkImport.skippedRowsMany : dictionary.projectManagement.deliverables.bulkImport.skippedRowsOne).replace('{count}', importResult.errors.length)}
                      </Typography>

                      <Box
                        sx={{
                          bgcolor: alpha(theme.palette.warning.main, isDark ? 0.06 : 0.03),
                          borderRadius: 1,
                          border: 1,
                          borderColor: alpha(theme.palette.warning.main, isDark ? 0.15 : 0.1),
                          overflow: 'hidden',
                          maxHeight: 320,
                          overflowY: 'auto',
                          width: '100%',
                        }}
                      >
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: '80px 1fr',
                            bgcolor: alpha(theme.palette.warning.main, isDark ? 0.12 : 0.06),
                            borderBottom: 1,
                            borderColor: theme.palette.divider,
                            p: 1.5,
                            gap: 1,
                            position: 'sticky',
                            top: 0,
                          }}
                        >
                          <Typography variant="caption" fontWeight={700}>
                            {dictionary.projectManagement.deliverables.bulkImport.rowNo}
                          </Typography>
                          <Typography variant="caption" fontWeight={700}>
                            {dictionary.projectManagement.deliverables.bulkImport.errorDescription}
                          </Typography>
                        </Box>

                        {importResult.errors.map((item, index) => (
                          <Box key={`${item.row}-${index}`} sx={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 1, p: 1.5 }}>
                            <Typography variant="body2" color="warning.main">
                              {item.row}.
                            </Typography>
                            <Typography variant="body2">{item.error}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {(!importResult.errors || importResult.errors.length === 0) && importResult.imported > 0 && (
                    <Alert severity="success" sx={{ width: '100%' }}>
                      <Typography variant="body2">
                        {(importResult.imported > 1 ? dictionary.projectManagement.deliverables.bulkImport.allImportedMany : dictionary.projectManagement.deliverables.bulkImport.allImportedOne).replace('{count}', importResult.imported)}
                      </Typography>
                    </Alert>
                  )}

                  <Button variant="outlined" startIcon={<Refresh />} onClick={handleReset} size="small" sx={{ alignSelf: 'flex-start' }}>
                    {dictionary.projectManagement.deliverables.bulkImport.importAnother}
                  </Button>
                </Stack>
              </Box>
            )}
          </Stack>
        </TabPanel>
      </DialogContent>
    </React.Fragment>
  );
};

export default DeliverablesBulkImport;
