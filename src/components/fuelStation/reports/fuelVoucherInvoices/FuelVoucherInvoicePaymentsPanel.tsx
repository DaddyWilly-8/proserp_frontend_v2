'use client';

import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import ReceiptPreviewDialog from '@/components/accounts/transactions/receipts/ReceiptPreviewDialog';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { CancelOutlined } from '@mui/icons-material';
import {
  Box,
  Chip,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';

const money = (value = 0) =>
  (value ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

interface Props {
  // Fuel Voucher invoice details, as returned by FuelVoucherInvoiceController::show()
  invoice: any;
}

// Received / balance summary and the receipts already linked to a batch Fuel Voucher invoice.
function FuelVoucherInvoicePaymentsPanel({ invoice }: Props) {
  const { checkOrganizationPermission } = useJumboAuth();
  const [previewReceiptId, setPreviewReceiptId] = useState<number | null>(null);

  const canViewReceipts = checkOrganizationPermission([
    PERMISSIONS.ACCOUNTS_TRANSACTIONS_READ,
    PERMISSIONS.RECEIPTS_READ,
  ]);

  const receipts: any[] = invoice.receipts ?? [];
  const isPaid = !!invoice.manually_paid_at || invoice.unpaid_amount <= 0;

  return (
    <Box sx={{ mb: 2 }}>
      <Grid container spacing={1} alignItems='center'>
        <Grid size={12}>
          <Stack direction='row' spacing={3} flexWrap='wrap' alignItems='center'>
            <Typography>{`Total: ${money(invoice.total)}`}</Typography>
            <Typography>{`Received: ${money(invoice.paid_amount)}`}</Typography>
            <Typography fontWeight='bold'>
              {`Balance: ${money(invoice.unpaid_amount)}`}
            </Typography>
            {isPaid ? (
              <Chip
                size='small'
                color='success'
                variant='outlined'
                label={invoice.manually_paid_at ? 'Marked as paid' : 'Paid'}
              />
            ) : invoice.paid_amount > 0 ? (
              <Chip size='small' color='warning' variant='outlined' label='Partially Paid' />
            ) : (
              <Chip size='small' variant='outlined' label='Unpaid' />
            )}
          </Stack>
        </Grid>
      </Grid>

      {receipts.length > 0 && (
        <TableContainer component={Paper} sx={{ mt: 1, overflowX: 'auto' }}>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Receipt</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Received Into</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell align='right'>Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {receipts.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell>
                    <Stack direction='row' spacing={1} alignItems='center'>
                      {canViewReceipts ? (
                        <Tooltip title='View Receipt'>
                          <Typography
                            component='span'
                            variant='body2'
                            color='primary'
                            sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                            onClick={() => setPreviewReceiptId(receipt.id)}
                          >
                            {receipt.voucherNo}
                          </Typography>
                        </Tooltip>
                      ) : (
                        <Typography component='span' variant='body2'>
                          {receipt.voucherNo}
                        </Typography>
                      )}
                      {receipt.cancelled_at && (
                        <Tooltip
                          title={`Cancelled ${readableDate(receipt.cancelled_at)} - the amount it applied here may no longer be accurate`}
                        >
                          <Chip
                            size='small'
                            color='error'
                            variant='outlined'
                            icon={<CancelOutlined fontSize='small' />}
                            label='Cancelled'
                          />
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>{readableDate(receipt.transaction_date)}</TableCell>
                  <TableCell>{receipt.debit_ledger?.name}</TableCell>
                  <TableCell>{receipt.reference || receipt.narration}</TableCell>
                  <TableCell align='right'>{money(receipt.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <ReceiptPreviewDialog
        open={!!previewReceiptId}
        receiptId={previewReceiptId}
        onClose={() => setPreviewReceiptId(null)}
      />

    </Box>
  );
}

export default FuelVoucherInvoicePaymentsPanel;
