// components/humanResources/payrollRuns/PayrollRunDialogs.tsx
'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import PDFContent from '@/components/pdf/PDFContent';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import PreviewTopBar from '@/components/sharedComponents/PreviewTopBar';
import { BackdropSpinner } from '@/shared/ProgressIndicators/BackdropSpinner';
import { Organization } from '@/types/auth-types';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { HighlightOff } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { Suspense, useState } from 'react';
import { formatMoney, formatPayslipPeriod, getEmployeeName } from './payrollUtils';
import PayslipPDF from './PayslipPDF';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface SimulationDialogProps {
  open: boolean;
  onClose: () => void;
  data: any;
}

export const SimulationDialog = ({
  open,
  onClose,
  data,
}: SimulationDialogProps) => {
  const dictionary = useDictionary();
  const t = dictionary.humanResources.payrollRuns.dialogs;
  const { theme } = useJumboTheme();
  const belowMediumScreen = useMediaQuery(theme.breakpoints.down('md'));
  const simulationRow = data?.row || data?.data?.row || data;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      fullScreen={belowMediumScreen}
      maxWidth='md'
    >
      <DialogTitle sx={{ textAlign: 'center' }}>
        <Typography variant='h5' component='div'>
          {t.simulationTitle}
        </Typography>
        <Typography variant='body2' color='text.secondary' component='div'>
          {t.simulatedPayslip.replace(
            '{name}',
            simulationRow?.employee?.name || t.employee
          )}
        </Typography>
      </DialogTitle>
      <DialogContent>
        {simulationRow ? (
          <Grid container spacing={2}>
            <Grid size={12}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6, md: 4 }}>
                  <Typography variant='caption' color='text.secondary'>
                    {t.basicSalary}
                  </Typography>
                  <Typography variant='h6'>
                    {formatMoney(
                      simulationRow.full_basic_salary ??
                        simulationRow.basic_salary
                    )}
                  </Typography>
                  {simulationRow.proration && (
                    <Typography
                      variant='caption'
                      color='warning.main'
                      display='block'
                    >
                      {t.prorated
                        .replace('{active}', String(simulationRow.proration.active_days))
                        .replace('{total}', String(simulationRow.proration.total_days))
                        .replace('{amount}', formatMoney(simulationRow.basic_salary))}
                    </Typography>
                  )}
                </Grid>
                <Grid size={{ xs: 6, md: 4 }}>
                  <Typography variant='caption' color='text.secondary'>
                    {t.grossSalary}
                  </Typography>
                  <Typography variant='h6'>
                    {formatMoney(simulationRow.gross_salary)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 4 }}>
                  <Typography variant='caption' color='text.secondary'>
                    {t.paye}
                  </Typography>
                  <Typography variant='h6' color='error.main'>
                    {formatMoney(simulationRow.paye || 0)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 4 }}>
                  <Typography variant='caption' color='text.secondary'>
                    {t.totalAllowances}
                  </Typography>
                  <Typography variant='h6'>
                    {formatMoney(simulationRow.total_allowances || 0)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 4 }}>
                  <Typography variant='caption' color='text.secondary'>
                    {t.totalDeductions}
                  </Typography>
                  <Typography variant='h6'>
                    {formatMoney(simulationRow.total_deductions || 0)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 4 }}>
                  <Typography variant='caption' color='text.secondary'>
                    {t.totalEmployerContributions}
                  </Typography>
                  <Typography variant='h6'>
                    {formatMoney(
                      simulationRow.employer_contributions.reduce(
                        (acc: number, curr: any) => acc + curr.amount,
                        0
                      ) || 0
                    )}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 4 }}>
                  <Typography variant='caption' color='text.secondary'>
                    {t.netPay}
                  </Typography>
                  <Typography variant='h6' color='success.main'>
                    {formatMoney(simulationRow.net_salary)}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
            {simulationRow.allowances?.length > 0 && (
              <Grid size={12}>
                <Typography
                  variant='subtitle2'
                  gutterBottom
                  textAlign={'center'}
                >
                  {t.allowances}
                </Typography>
                <TableContainer component={Paper} variant='outlined'>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t.label}</TableCell>
                        <TableCell align='right'>{t.amount}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {simulationRow.allowances.map(
                        (item: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell>
                              {item.label}
                              {item.full_amount != null && (
                                <Typography
                                  variant='caption'
                                  color='warning.main'
                                  display='block'
                                >
                                  {t.proratedShort
                                    .replace('{active}', String(simulationRow.proration?.active_days))
                                    .replace('{total}', String(simulationRow.proration?.total_days))}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align='right'>
                              {item.full_amount != null ? (
                                <>
                                  <Typography
                                    variant='caption'
                                    color='text.secondary'
                                    display='block'
                                    sx={{ textDecoration: 'line-through' }}
                                  >
                                    {formatMoney(item.full_amount)}
                                  </Typography>
                                  {formatMoney(item.amount)}
                                </>
                              ) : (
                                formatMoney(item.amount)
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            )}
            {simulationRow.deductions?.length > 0 && (
              <Grid size={12}>
                <Typography
                  variant='subtitle2'
                  gutterBottom
                  textAlign={'center'}
                >
                  {t.deductions}
                </Typography>
                <TableContainer component={Paper} variant='outlined'>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t.label}</TableCell>
                        <TableCell align='right'>{t.amount}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {simulationRow.deductions.map(
                        (item: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell>{item.label}</TableCell>
                            <TableCell align='right'>
                              {formatMoney(item.amount)}
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            )}
            {simulationRow.employer_contributions?.length > 0 && (
              <Grid size={12}>
                <Typography
                  variant='subtitle2'
                  gutterBottom
                  textAlign={'center'}
                >
                  {t.employerContributions}
                </Typography>
                <TableContainer component={Paper} variant='outlined'>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t.label}</TableCell>
                        <TableCell align='right'>{t.amount}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {simulationRow.employer_contributions.map(
                        (item: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell>{item.label}</TableCell>
                            <TableCell align='right'>
                              {formatMoney(item.amount)}
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            )}
          </Grid>
        ) : (
          <Alert severity='warning'>{t.noSimulationData}</Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t.close}</Button>
      </DialogActions>
    </Dialog>
  );
};

interface PayslipViewDialogProps {
  open: boolean;
  onClose: () => void;
  payslip: any;
}

export const PayslipViewDialog = ({
  open,
  onClose,
  payslip,
}: PayslipViewDialogProps) => {
  const dictionary = useDictionary();
  const t = dictionary.humanResources.payrollRuns.dialogs;
  const monthNames: string[] = dictionary.humanResources.payrollRuns.months;
  const { authOrganization } = useJumboAuth();
  const organization = authOrganization?.organization;
  const { theme } = useJumboTheme();
  const belowMediumScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [showOnScreen, setShowOnScreen] = useState(true);
  const [thermalPrinter, setThermalPrinter] = useState(false);
  const [pdfKey, setPdfKey] = useState(0); // Force remount when changing format

  const handleThermalToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setThermalPrinter(e.target.checked);
    setPdfKey((prev) => prev + 1); // Force PDF remount when changing format
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      fullScreen={belowMediumScreen}
      maxWidth='md'
    >
      <DialogTitle sx={{ textAlign: 'center' }}>
        <PreviewTopBar
          fileExportGrid={
            <FileExportGrid
              exportPdf
              handlePdf={() => {
                setShowOnScreen((prev) => !prev);
              }}
            />
          }
          closeButton={
            <IconButton size='small' color='primary' onClick={onClose}>
              <HighlightOff color='primary' />
            </IconButton>
          }
        />
      </DialogTitle>
      {showOnScreen ? (
        <>
          <DialogTitle sx={{ textAlign: 'center' }}>
            <Typography variant='h5' component='div'>
              {t.payslipDetails}
            </Typography>
            <Typography variant='body2' color='text.secondary' component='div'>
              {payslip
                ? getEmployeeName(payslip.employee || payslip)
                : t.employee}
            </Typography>
            {payslip && (
              <Typography variant='caption' color='text.secondary' component='div'>
                {formatPayslipPeriod(payslip, monthNames)}
              </Typography>
            )}
          </DialogTitle>
          <DialogContent>
            {payslip ? (
              <Grid container spacing={2}>
                <Grid size={12}>
                  <Grid container spacing={2}>
                    <Grid size={6}>
                      <Typography variant='caption' color='text.secondary'>
                        {t.employee}
                      </Typography>
                      <Typography variant='body2'>
                        {getEmployeeName(payslip.employee || payslip)}
                      </Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant='caption' color='text.secondary'>
                        {t.employeeNumber}
                      </Typography>
                      <Typography variant='body2'>
                        {payslip.employee?.employee_number ||
                          payslip.employee_number ||
                          t.notAvailable}
                      </Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant='caption' color='text.secondary'>
                        {t.basicSalary}
                      </Typography>
                      <Typography variant='h6'>
                        {formatMoney(
                          payslip.full_basic_salary ?? payslip.basic_salary ?? 0
                        )}
                      </Typography>
                      {payslip.proration && (
                        <Typography
                          variant='caption'
                          color='warning.main'
                          display='block'
                        >
                          {t.prorated
                            .replace('{active}', String(payslip.proration.active_days))
                            .replace('{total}', String(payslip.proration.total_days))
                            .replace('{amount}', formatMoney(payslip.basic_salary || 0))}
                        </Typography>
                      )}
                    </Grid>
                    <Grid size={6}>
                      <Typography variant='caption' color='text.secondary'>
                        {t.grossSalary}
                      </Typography>
                      <Typography variant='h6'>
                        {formatMoney(payslip.gross_salary || 0)}
                      </Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant='caption' color='text.secondary'>
                        {t.totalAllowances}
                      </Typography>
                      <Typography variant='h6'>
                        {formatMoney(payslip.total_allowances || 0)}
                      </Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant='caption' color='text.secondary'>
                        {t.totalDeductions}
                      </Typography>
                      <Typography variant='h6'>
                        {formatMoney(payslip.total_deductions || 0)}
                      </Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant='caption' color='text.secondary'>
                        {t.paye}
                      </Typography>
                      <Typography variant='h6' color='error.main'>
                        {formatMoney(payslip.paye || 0)}
                      </Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant='caption' color='text.secondary'>
                        {t.netPay}
                      </Typography>
                      <Typography variant='h6' color='success.main'>
                        {formatMoney(payslip.net_salary || 0)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>
                {payslip.allowances?.length > 0 && (
                  <Grid size={12}>
                    <Typography
                      variant='subtitle2'
                      gutterBottom
                      textAlign={'center'}
                    >
                      {t.allowances}
                    </Typography>
                    <TableContainer component={Paper} variant='outlined'>
                      <Table size='small'>
                        <TableHead>
                          <TableRow>
                            <TableCell>{t.label}</TableCell>
                            <TableCell align='right'>{t.amount}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {payslip.allowances.map((item: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell>
                                {item.label}
                                {item.full_amount != null && (
                                  <Typography
                                    variant='caption'
                                    color='warning.main'
                                    display='block'
                                  >
                                    {t.proratedShort
                                      .replace('{active}', String(payslip.proration?.active_days))
                                      .replace('{total}', String(payslip.proration?.total_days))}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align='right'>
                                {item.full_amount != null ? (
                                  <>
                                    <Typography
                                      variant='caption'
                                      color='text.secondary'
                                      display='block'
                                      sx={{ textDecoration: 'line-through' }}
                                    >
                                      {formatMoney(item.full_amount)}
                                    </Typography>
                                    {formatMoney(item.amount)}
                                  </>
                                ) : (
                                  formatMoney(item.amount)
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                )}
                {payslip.deductions?.length > 0 && (
                  <Grid size={12}>
                    <Typography
                      variant='subtitle2'
                      gutterBottom
                      textAlign={'center'}
                    >
                      {t.deductions}
                    </Typography>
                    <TableContainer component={Paper} variant='outlined'>
                      <Table size='small'>
                        <TableHead>
                          <TableRow>
                            <TableCell>{t.label}</TableCell>
                            <TableCell align='right'>{t.amount}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {payslip.deductions.map((item: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell>{item.label}</TableCell>
                              <TableCell align='right'>
                                {formatMoney(item.amount)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                )}
                {payslip.employer_contributions?.length > 0 && (
                  <Grid size={12}>
                    <Typography
                      variant='subtitle2'
                      gutterBottom
                      textAlign={'center'}
                    >
                      {t.employerContributions}
                    </Typography>
                    <TableContainer component={Paper} variant='outlined'>
                      <Table size='small'>
                        <TableHead>
                          <TableRow>
                            <TableCell>{t.label}</TableCell>
                            <TableCell align='right'>{t.amount}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {payslip.employer_contributions.map(
                            (item: any, idx: number) => (
                              <TableRow key={idx}>
                                <TableCell>{item.label}</TableCell>
                                <TableCell align='right'>
                                  {formatMoney(item.amount)}
                                </TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                )}
              </Grid>
            ) : (
              <Alert severity='warning'>{t.noPayslipData}</Alert>
            )}
          </DialogContent>
        </>
      ) : (
        <DialogContent>
          <Box sx={{ minHeight: '300px' }}>
            <Box
              display='flex'
              justifyContent='flex-end'
              alignItems='center'
              mb={2}
            >
              <Typography variant='body2'>A4</Typography>
              <Switch
                checked={thermalPrinter}
                onChange={handleThermalToggle}
                color='primary'
                sx={{ mx: 1 }}
              />
              <Typography variant='body2'>80mm</Typography>
            </Box>

            <Suspense fallback={<BackdropSpinner />}>
              <PDFContent
                key={`pdf-${pdfKey}`}
                fileName={`${'payslip'}_${thermalPrinter ? '80mm' : 'A4'}`}
                document={
                  <PayslipPDF
                    thermalPrinter={thermalPrinter}
                    organization={
                      organization ? (organization as Organization) : null
                    }
                    payslip={payslip}
                    dictionary={dictionary}
                  />
                }
              />
            </Suspense>
          </Box>
        </DialogContent>
      )}
      <DialogActions>
        <Button onClick={onClose}>{t.close}</Button>
      </DialogActions>
    </Dialog>
  );
};
