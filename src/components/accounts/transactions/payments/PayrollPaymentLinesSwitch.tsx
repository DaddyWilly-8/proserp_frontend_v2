'use client';

import { Stack, Switch, Typography } from '@mui/material';

interface SalaryPaymentItem {
  debit_ledger_id?: number;
  credit_ledger_id?: number;
  debitLedgerName: string;
  description: string;
  amount: number;
}

interface SalaryPaymentVoucher<T extends SalaryPaymentItem> {
  payroll_salary_payment?: boolean;
  items: T[];
}

/**
 * A payroll net-salary payment has one line per employee. This collapses them into one line per
 * ledger (normally just the one Salary Payable line) carrying the full amount, for the voucher view
 * that shouldn't list every employee. The data itself isn't touched - the lines come back as soon
 * as the switch is turned on again - and the voucher total is unchanged.
 */
export const collapseSalaryPaymentItems = <T extends SalaryPaymentItem, V extends SalaryPaymentVoucher<T>>(
  voucher: V
): V => {
  if (!voucher?.payroll_salary_payment) return voucher;

  const groups = new Map<string, { first: T; amount: number; count: number }>();

  voucher.items.forEach((item) => {
    const key = `${item.debit_ledger_id ?? item.debitLedgerName}|${item.credit_ledger_id ?? ''}`;
    const group = groups.get(key);
    if (group) {
      group.amount += Number(item.amount) || 0;
      group.count += 1;
    } else {
      groups.set(key, { first: item, amount: Number(item.amount) || 0, count: 1 });
    }
  });

  return {
    ...voucher,
    items: Array.from(groups.values()).map(({ first, amount, count }) => ({
      ...first,
      description: `Net salary payment - ${count} ${count === 1 ? 'employee' : 'employees'}`,
      amount: Math.round(amount * 100) / 100,
    })),
  };
};

interface EmployeeLinesSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** "Employee-wise lines" switch - same look as the Detailed switch on the Fuel Sales Shift view. */
export const EmployeeLinesSwitch = ({ checked, onChange }: EmployeeLinesSwitchProps) => (
  <Stack direction='row' justifyContent='center' alignItems='center' mb={1}>
    <Typography>Employee-wise lines</Typography>
    <Switch
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      slotProps={{ input: { 'aria-label': 'Show employee-wise lines' } }}
    />
  </Stack>
);
