import PayrollRuns from '@/components/humanResources/payrollRuns/PayrollRuns';

// Process Approval > Payroll — every submitted run and every run that has
// made it past approval (approved, posted, partially paid, paid), no period
// selection required (unlike the general Payroll Runs page), so an approver
// can see everything awaiting action across periods at a glance, and runs
// stay visible here instead of disappearing once they're posted or paid.
export default function PayrollApprovalsPage() {
  return (
    <PayrollRuns
      defaultStatus='submitted,approved,completed,posted,partially_paid,paid'
      title='Payroll Approvals'
    />
  );
}
