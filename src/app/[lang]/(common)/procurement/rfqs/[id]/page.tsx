export const dynamic = 'force-dynamic';

import React from 'react';
import RFQDetail from '@/components/procurement/rfqs/detail/RFQDetail';

export default async function RFQPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RFQDetail rfqId={id} />;
}
