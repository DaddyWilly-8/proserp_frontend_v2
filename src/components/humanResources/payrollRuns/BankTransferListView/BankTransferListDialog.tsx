'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import PDFContent from '@/components/pdf/PDFContent';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import PreviewTopBar from '@/components/sharedComponents/PreviewTopBar';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { HighlightOff } from '@mui/icons-material';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useState } from 'react';
import humanResourcesServices from '../../humanResourcesServices';
import BankFileDownloadMenu from '../../bankFile/BankFileDownloadMenu';
import { SalarySheetType } from '../salarySheetType';
import BankTransferListDialogPDF from './BankTransferListDialogPDF';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface BankTransferListDialogProps {
  bankTransfer: SalarySheetType;
  open: boolean;
  setOpen: (val: boolean) => void;
}

const BankTransferListDialog = ({
  bankTransfer,
  open = false,
  setOpen,
}: BankTransferListDialogProps) => {
  const dictionary = useDictionary();
  const t = dictionary.humanResources.payrollRuns.bankTransfer;
  const theme = useTheme();
  const { theme: jumboTheme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(jumboTheme.breakpoints.down('lg'));
  const authObject = useJumboAuth() as any;
  const organization = authObject?.authOrganization?.organization;

  const mainColor = organization.settings?.main_color || '#2113AD';
  const headerColor =
    theme.type === 'dark'
      ? '#29f096'
      : organization.settings?.main_color || '#2113AD';
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';

  const [showOnScreen, setShowOnScreen] = useState(true);
  const [pdfKey, setPdfKey] = useState(0);

  const payrollRun = bankTransfer.run;
  const monthNames: string[] = dictionary.humanResources.payrollRuns.months;
  const monthNo = bankTransfer.run.period.month;
  const year = bankTransfer.run.period.year;
  const monthName = monthNames[monthNo - 1];
  const payrollPeriod = `${year} - ${monthName}`;

  const costCenter = bankTransfer.run.cost_center;
  const rows = bankTransfer.rows;

  const handleDownloadBankFile = async (format: string) => {
    const blob = await humanResourcesServices.salaryBankFile(
      bankTransfer.run.id,
      format
    );
    // Some formats (e.g. CRDB) download as plain delimited text, not Excel —
    // hardcoding .xlsx here named the file wrong and Excel refused to open
    // it. blob.type reflects the actual Content-Type the backend sent, so
    // the extension always matches what's really inside.
    const extension = blob.type === 'text/plain' ? 'txt' : 'xlsx';
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Salary Bank File - ${format}.${extension}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      maxWidth={'lg'}
      fullWidth
      fullScreen={belowLargeScreen}
    >
      <DialogTitle>
        <PreviewTopBar
          fileExportGrid={
            <FileExportGrid
              startComponent={
                <BankFileDownloadMenu onDownload={handleDownloadBankFile} />
              }
              exportPdf
              handlePdf={() => {
                setShowOnScreen((prev) => !prev);
              }}
            />
          }
          closeButton={
            <IconButton
              size='small'
              color='primary'
              onClick={() => setOpen(false)}
            >
              <HighlightOff color='primary' />
            </IconButton>
          }
        />
      </DialogTitle>
      {showOnScreen ? (
        <>
          <DialogContent>
            <Grid container>
              <Grid size={12} sx={{ mb: 3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    width: '100%',
                  }}
                >
                  <Typography variant='h4' sx={{ color: headerColor }}>
                    {t.title}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            <Grid container rowSpacing={2}>
              {costCenter && (
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box>
                    <Typography variant='subtitle2' sx={{ color: headerColor }}>
                      {t.costCenter}
                    </Typography>
                    <Typography variant='body1'>
                      {costCenter?.name ?? '-'}
                    </Typography>
                  </Box>
                </Grid>
              )}

              <Grid size={{ xs: 12, md: 4 }}>
                <Box>
                  <Typography variant='subtitle2' sx={{ color: headerColor }}>
                    {t.payrollPeriod}
                  </Typography>
                  <Typography variant='body1'>{payrollPeriod}</Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Box>
                  <Typography variant='subtitle2' sx={{ color: headerColor }}>
                    {t.payrollStatus}
                  </Typography>
                  <Typography variant='body1'>
                    {(dictionary.humanResources.payrollRuns.status as Record<string, string>)[
                      String(payrollRun.status || '').toLowerCase()
                    ] || payrollRun.status}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Box>
                  <Typography variant='subtitle2' sx={{ color: headerColor }}>
                    {t.employeesWithoutBank}
                  </Typography>
                  <Typography variant='body1'>
                    {bankTransfer.employees_without_bank_account}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Box>
                  <Typography variant='subtitle2' sx={{ color: headerColor }}>
                    {t.totalEmployees}
                  </Typography>
                  <Typography variant='body1'>
                    {bankTransfer.total_employees}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Box>
                  <Typography variant='subtitle2' sx={{ color: headerColor }}>
                    {t.netSalary}
                  </Typography>
                  <Typography variant='body1'>
                    {bankTransfer.total_net_salary.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Box>
              <Box sx={{ p: 2 }}>
                {/* ===== MAIN TABLE ===== */}
                <Grid container mt={4}>
                  <Grid size={12}>
                    <TableContainer
                      component={Paper}
                      sx={{
                        boxShadow: theme.shadows[2],
                        '& .MuiTableRow-root:hover': {
                          backgroundColor: theme.palette.action.hover,
                        },
                      }}
                    >
                      <Table>
                        <>
                          <TableHead>
                            <TableRow>
                              <TableCell
                                colSpan={1}
                                sx={{
                                  backgroundColor: mainColor,
                                  color: contrastText,
                                  textWrap: 'nowrap',
                                }}
                              >
                                {t.sn}
                              </TableCell>
                              <TableCell
                                colSpan={3}
                                sx={{
                                  backgroundColor: mainColor,
                                  color: contrastText,
                                  textWrap: 'nowrap',
                                }}
                              >
                                {t.employeeNo}
                              </TableCell>
                              <TableCell
                                colSpan={3}
                                sx={{
                                  backgroundColor: mainColor,
                                  color: contrastText,
                                  textWrap: 'nowrap',
                                }}
                              >
                                {t.employeeName}
                              </TableCell>
                              <TableCell
                                colSpan={1}
                                sx={{
                                  backgroundColor: mainColor,
                                  color: contrastText,
                                  textWrap: 'nowrap',
                                }}
                                align='left'
                              >
                                {t.bankName}
                              </TableCell>
                              <TableCell
                                colSpan={1}
                                sx={{
                                  backgroundColor: mainColor,
                                  color: contrastText,
                                  textWrap: 'nowrap',
                                }}
                                align='left'
                              >
                                {t.branch}
                              </TableCell>
                              <TableCell
                                colSpan={1}
                                sx={{
                                  backgroundColor: mainColor,
                                  color: contrastText,
                                  textWrap: 'nowrap',
                                }}
                                align='left'
                              >
                                {t.bankCode}
                              </TableCell>
                              <TableCell
                                colSpan={1}
                                sx={{
                                  backgroundColor: mainColor,
                                  color: contrastText,
                                  textWrap: 'nowrap',
                                }}
                                align='left'
                              >
                                {t.accountNumber}
                              </TableCell>
                              <TableCell
                                colSpan={1}
                                sx={{
                                  backgroundColor: mainColor,
                                  color: contrastText,
                                  textWrap: 'nowrap',
                                }}
                                align='left'
                              >
                                {t.accountName}
                              </TableCell>
                              <TableCell
                                colSpan={1}
                                sx={{
                                  backgroundColor: mainColor,
                                  color: contrastText,
                                  textWrap: 'nowrap',
                                }}
                                align='right'
                              >
                                {t.netPay}
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {rows?.map((row, index: number) => {
                              return (
                                <TableRow
                                  key={index}
                                  sx={{
                                    backgroundColor:
                                      theme.palette.background.paper,
                                    '&:nth-of-type(even)': {
                                      backgroundColor:
                                        theme.palette.action.hover,
                                    },
                                  }}
                                >
                                  <TableCell colSpan={1}>{index + 1}</TableCell>
                                  <TableCell colSpan={3}>
                                    {row.employee_number ?? '-'}
                                  </TableCell>
                                  <TableCell colSpan={3}>
                                    {row.name ?? '-'}
                                  </TableCell>
                                  <TableCell colSpan={1} align='left'>
                                    {row.bank_name ?? '-'}
                                  </TableCell>
                                  <TableCell colSpan={1} align='left'>
                                    {row.branch ?? '-'}
                                  </TableCell>
                                  <TableCell colSpan={1} align='left'>
                                    {row.bank_code ?? '-'}
                                  </TableCell>
                                  <TableCell colSpan={1} align='left'>
                                    {row.account_number ?? '-'}
                                  </TableCell>
                                  <TableCell colSpan={1} align='left'>
                                    {row.account_name ?? '-'}
                                  </TableCell>
                                  <TableCell colSpan={1} align='right'>
                                    {row.net_salary.toLocaleString('en-US', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }) ?? 0}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </>
                      </Table>
                    </TableContainer>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </DialogContent>
        </>
      ) : (
        <DialogContent>
          <PDFContent
            key={`salary-sheet-${pdfKey}`}
            fileName={t.fileName}
            document={
              <BankTransferListDialogPDF
                organization={organization}
                bankTransfer={bankTransfer}
                dictionary={dictionary}
              />
            }
          />
        </DialogContent>
      )}
    </Dialog>
  );
};

export default BankTransferListDialog;
