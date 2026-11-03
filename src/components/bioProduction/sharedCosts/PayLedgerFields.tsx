'use client'

import React from 'react';
import { Grid, TextField } from '@mui/material';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

export interface PayFrom { id: number; name: string }

/** The account the money leaves and an optional reference: the same two fields as paying a cost record. */
const PayLedgerFields = ({ payFrom, onPayFrom, reference, onReference }: { payFrom: PayFrom | null; onPayFrom: (ledger: PayFrom | null) => void; reference: string; onReference: (value: string) => void }) => {
  const text = useDictionary().bioProduction.sharedCosts;

  return (
    <>
      <Grid size={{ xs: 12, md: 7 }}>
        <LedgerSelect
          label={text.labels.payFrom}
          defaultValue={payFrom as any}
          allowedGroups={['Current Assets', 'Current Liabilities', 'Cash and Cash Equivalents', 'Banks', 'Accounts Payable', 'Accounts Receivable']}
          onChange={(selected: any) => onPayFrom(selected && !Array.isArray(selected) ? { id: selected.id, name: selected.name } : null)}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 5 }}>
        <TextField size='small' fullWidth label={text.labels.paymentReference} value={reference} onChange={(event) => onReference(event.target.value)} />
      </Grid>
    </>
  );
};

export default PayLedgerFields;
