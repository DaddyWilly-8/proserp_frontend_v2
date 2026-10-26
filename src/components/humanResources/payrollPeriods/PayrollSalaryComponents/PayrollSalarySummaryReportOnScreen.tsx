'use client';

import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import {
  Alert,
  Box,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

type GroupedSummaryItem = {
  type_id?: number | null;
  type_name?: string | null;
  total?: number;
  label?: string;
  name?: string;
};

type SalarySummaryResponse = {
  summary?: {
    period?: string;
    total_employees?: number;
    total_payroll_runs?: number;
    total_employer_cost?: number;
  };
  salary_components?: {
    basic_salary?: {
      total?: number;
    };
    allowances?: GroupedSummaryItem[];
    gross_salary?: number;
  };
  deductions?: GroupedSummaryItem[];
  employer_contributions?: GroupedSummaryItem[];
  net_salary?: {
    total?: number;
  };
};

interface PayrollSalarySummaryReportOnScreenProps {
  data: SalarySummaryResponse;
  mainColor: string;
  contrastText: string;
}

function formatCurrency(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  return numeric.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatNumber(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  return numeric.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export default function PayrollSalarySummaryReportOnScreen({
  data,
  mainColor,
  contrastText,
}: PayrollSalarySummaryReportOnScreenProps) {
  const dictionary = useDictionary();
  const t = dictionary.humanResources.payrollPeriods;
  const summary = data?.summary;
  const basicSalary = data?.salary_components?.basic_salary;
  const allowances = data?.salary_components?.allowances ?? [];
  const deductions = data?.deductions ?? [];
  const employerContributions = data?.employer_contributions ?? [];
  const netSalary = data?.net_salary;

  return (
    <>
      <Grid container spacing={2} mb={2}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              p: 2,
              height: '100%',
            }}
          >
            <Typography variant='body2' color='text.secondary'>
              {t.salaryComponents.period}
            </Typography>
            <Typography variant='h6'>{summary?.period || '-'}</Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              p: 2,
              height: '100%',
            }}
          >
            <Typography variant='body2' color='text.secondary'>
              {t.salaryComponents.employees}
            </Typography>
            <Typography variant='h6'>
              {formatNumber(summary?.total_employees)}
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              p: 2,
              height: '100%',
            }}
          >
            <Typography variant='body2' color='text.secondary'>
              {t.salaryComponents.payrollRuns}
            </Typography>
            <Typography variant='h6'>
              {formatNumber(summary?.total_payroll_runs)}
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              p: 2,
              height: '100%',
            }}
          >
            <Typography variant='body2' color='text.secondary'>
              {t.salaryComponents.totalEmployerCost}
            </Typography>
            <Typography variant='h6'>
              {formatCurrency(summary?.total_employer_cost)}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Grid container spacing={2} mb={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              p: 2,
              height: '100%',
            }}
          >
            <Typography variant='body2' color='text.secondary'>
              {t.salaryComponents.basicSalary}
            </Typography>
            <Typography variant='h5'>
              {formatCurrency(basicSalary?.total)}
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              p: 2,
              height: '100%',
            }}
          >
            <Typography variant='body2' color='text.secondary'>
              {t.salaryComponents.grossSalary}
            </Typography>
            <Typography variant='h5'>
              {formatCurrency(data?.salary_components?.gross_salary)}
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              p: 2,
              height: '100%',
            }}
          >
            <Typography variant='body2' color='text.secondary'>
              {t.salaryComponents.netSalary}
            </Typography>
            <Typography variant='h5'>
              {formatCurrency(netSalary?.total)}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {allowances.length > 0 && (
          <Grid size={{ xs: 12, lg: 4 }}>
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                p: 2,
                height: '100%',
              }}
            >
              <Typography
                variant='subtitle1'
                fontWeight={600}
                textAlign='center'
                mb={1}
              >
                {t.salaryComponents.allowances}
              </Typography>
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{ backgroundColor: mainColor, color: contrastText }}
                      >
                        {t.salaryComponents.name}
                      </TableCell>
                      <TableCell
                        align='right'
                        sx={{ backgroundColor: mainColor, color: contrastText }}
                      >
                        {t.salaryComponents.value}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allowances.map((allowance) => (
                      <TableRow
                        key={String(
                          allowance.type_id ??
                            allowance.type_name ??
                            allowance.label
                        )}
                      >
                        <TableCell>
                          {allowance.type_name ||
                            allowance.label ||
                            allowance.name ||
                            '-'}
                        </TableCell>
                        <TableCell align='right'>
                          {formatCurrency(allowance.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>{t.salaryComponents.total}</TableCell>
                      <TableCell align='right' sx={{ fontWeight: 700 }}>
                        {formatCurrency(
                          allowances.reduce(
                            (sum, row) => sum + Number(row.total ?? 0),
                            0
                          )
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Grid>
        )}

        {deductions.length > 0 && (
          <Grid size={{ xs: 12, lg: 4 }}>
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                p: 2,
                height: '100%',
              }}
            >
              <Typography
                variant='subtitle1'
                fontWeight={600}
                textAlign='center'
                mb={1}
              >
                {t.salaryComponents.deductions}
              </Typography>
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{ backgroundColor: mainColor, color: contrastText }}
                      >
                        {t.salaryComponents.name}
                      </TableCell>
                      <TableCell
                        align='right'
                        sx={{ backgroundColor: mainColor, color: contrastText }}
                      >
                        {t.salaryComponents.value}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {deductions.map((deduction) => (
                      <TableRow
                        key={String(
                          deduction.type_id ??
                            deduction.type_name ??
                            deduction.label
                        )}
                      >
                        <TableCell>
                          {deduction.type_name ||
                            deduction.label ||
                            deduction.name ||
                            '-'}
                        </TableCell>
                        <TableCell align='right'>
                          {formatCurrency(deduction.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>{t.salaryComponents.total}</TableCell>
                      <TableCell align='right' sx={{ fontWeight: 700 }}>
                        {formatCurrency(
                          deductions.reduce(
                            (sum, row) => sum + Number(row.total ?? 0),
                            0
                          )
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Grid>
        )}

        {employerContributions.length > 0 && (
          <Grid size={{ xs: 12, lg: 4 }}>
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                p: 2,
                height: '100%',
              }}
            >
              <Typography
                variant='subtitle1'
                fontWeight={600}
                textAlign='center'
                mb={1}
              >
                {t.salaryComponents.employerContributions}
              </Typography>
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{ backgroundColor: mainColor, color: contrastText }}
                      >
                        {t.salaryComponents.name}
                      </TableCell>
                      <TableCell
                        align='right'
                        sx={{ backgroundColor: mainColor, color: contrastText }}
                      >
                        {t.salaryComponents.value}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {employerContributions.map((contribution) => (
                      <TableRow
                        key={String(
                          contribution.type_id ??
                            contribution.type_name ??
                            contribution.label
                        )}
                      >
                        <TableCell>
                          {contribution.type_name ||
                            contribution.label ||
                            contribution.name ||
                            '-'}
                        </TableCell>
                        <TableCell align='right'>
                          {formatCurrency(contribution.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>{t.salaryComponents.total}</TableCell>
                      <TableCell align='right' sx={{ fontWeight: 700 }}>
                        {formatCurrency(
                          employerContributions.reduce(
                            (sum, row) => sum + Number(row.total ?? 0),
                            0
                          )
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Grid>
        )}
      </Grid>

      {allowances.length === 0 &&
        deductions.length === 0 &&
        employerContributions.length === 0 && (
          <Alert severity='info' sx={{ mt: 2 }}>
            {t.salaryComponents.noData}
          </Alert>
        )}
    </>
  );
}
