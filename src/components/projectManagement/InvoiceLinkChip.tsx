'use client';

import { Chip, Tooltip } from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import React from 'react';

interface InvoiceLinkChipProps {
  // 'customer' opens Accounts > Customer Invoices, 'supplier' opens Accounts > Supplier Bills
  kind: 'customer' | 'supplier';
  // Invoice/bill number (INV/xxxxx, BILL/xxxxx) - when the claim/certificate has a generated document
  documentNo?: string | null;
  // Fallback label for invoiced claims/certificates in organizations that don't generate documents
  fallbackLabel?: string;
  tooltip: string;
}

/**
 * "Invoiced" badge for a Project Payment Claim / Subcontract Certificate. When the organization
 * generates real invoices/bills for them, the badge carries the document number and opens it in
 * the matching Accounts list.
 */
const InvoiceLinkChip: React.FC<InvoiceLinkChipProps> = ({
  kind,
  documentNo,
  fallbackLabel = 'Invoiced',
  tooltip,
}) => {
  const router = useRouter();
  const params = useParams<{ lang?: string }>();

  if (!documentNo) {
    return (
      <Tooltip title={tooltip}>
        <Chip label={fallbackLabel} size="small" color="success" variant="outlined" />
      </Tooltip>
    );
  }

  const path = kind === 'customer' ? 'customerInvoices' : 'supplierBills';

  return (
    <Tooltip title={`${tooltip} - open ${documentNo}`}>
      <Chip
        label={documentNo}
        size="small"
        color="success"
        variant="outlined"
        clickable
        onClick={(event) => {
          event.stopPropagation();
          router.push(`/${params?.lang ?? 'en'}/accounts/${path}?search=${encodeURIComponent(documentNo)}`);
        }}
      />
    </Tooltip>
  );
};

export default InvoiceLinkChip;
