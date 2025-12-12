import DynamicImport from 'next/dynamic';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

const ApprovedPayments = DynamicImport(
  () => import('@/components/processApproval/approvedRequisitions/ApprovedPayments'),
  { ssr: false }
);

export default function Page() {
  return (
    <Suspense>
      <ApprovedPayments />
    </Suspense>
  );
}