import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import ReceiptPreviewDialog from '@/components/accounts/transactions/receipts/ReceiptPreviewDialog';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { CancelOutlined } from '@mui/icons-material';
import { Box, Chip, Divider, Grid, Stack, Tooltip, Typography, useTheme } from '@mui/material';
import { useState } from 'react';

const money = (value: number = 0) =>
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const lineDescription = (item: any) => item.description || item.product?.name || '';
const lineAmount = (item: any) => item.amount ?? (item.quantity ?? 0) * (item.rate ?? 0);

function CustomerInvoiceOnScreenPreview({ invoice, organization }: { invoice: any; organization: any }) {
  const theme = useTheme();
  const { checkOrganizationPermission } = useJumboAuth();
  // Seeing this invoice (gated on AccountsTransactions:Read) doesn't imply the viewer can see
  // full Receipt details — only offer the voucher number as a link to those who actually hold
  // that permission (ReceiptPreviewDialog enforces this again itself; this just avoids showing a
  // clickable link that leads to a "no permission" dead end).
  const canViewReceipts = checkOrganizationPermission([
    PERMISSIONS.ACCOUNTS_TRANSACTIONS_READ,
    PERMISSIONS.RECEIPTS_READ,
  ]);
  const [previewReceiptId, setPreviewReceiptId] = useState<number | null>(null);
  // Theme-native primary color: the org's raw brand hex isn't guaranteed to contrast on a dark background.
  const headerColor = theme.palette.primary.main;

  if (!invoice) return null;

  const currencyCode = invoice.currency?.code ? `${invoice.currency.code} ` : '';
  const showQuantities = (invoice.items ?? []).some((item: any) => item.quantity != null);
  const sourceNo = invoice.source?.claimNo || '';
  const cell = { padding: 8, border: `1px solid ${theme.palette.divider}` };

  return (
    <Box sx={{ padding: 2 }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant='h4' sx={{ color: headerColor }} gutterBottom>
          INVOICE
        </Typography>
        <Typography variant='h6' fontWeight='bold' gutterBottom>
          {invoice.invoiceNo}
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Typography variant='subtitle2' color='text.secondary' gutterBottom>
            Invoice Date
          </Typography>
          <Typography variant='body1'>{readableDate(invoice.transaction_date)}</Typography>
        </Grid>
        {invoice.due_date && (
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Typography variant='subtitle2' color='text.secondary' gutterBottom>
              Due Date
            </Typography>
            <Typography variant='body1'>{readableDate(invoice.due_date)}</Typography>
          </Grid>
        )}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Typography variant='subtitle2' color='text.secondary' gutterBottom>
            Customer
          </Typography>
          <Typography variant='body1'>{invoice.stakeholder?.name}</Typography>
        </Grid>
        {sourceNo && (
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Typography variant='subtitle2' color='text.secondary' gutterBottom>
              Project Payment Claim
            </Typography>
            <Typography variant='body1'>
              {sourceNo}
              {invoice.source?.project?.name ? ` - ${invoice.source.project.name}` : ''}
            </Typography>
          </Grid>
        )}
        {invoice.internal_reference && (
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Typography variant='subtitle2' color='text.secondary' gutterBottom>
              Internal Reference
            </Typography>
            <Typography variant='body1'>{invoice.internal_reference}</Typography>
          </Grid>
        )}
        {invoice.customer_reference && (
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Typography variant='subtitle2' color='text.secondary' gutterBottom>
              Customer Reference
            </Typography>
            <Typography variant='body1'>{invoice.customer_reference}</Typography>
          </Grid>
        )}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Typography variant='subtitle2' color='text.secondary' gutterBottom>
            Prepared By
          </Typography>
          <Typography variant='body1'>{invoice.creator?.name}</Typography>
        </Grid>
      </Grid>

      {!!invoice.items?.length && (
        <Box sx={{ mb: 3 }}>
          <Typography variant='h6' sx={{ color: headerColor, textAlign: 'center', mb: 2 }}>
            ITEMS
          </Typography>
          <Box
            sx={{
              p: 2,
              backgroundColor: theme.palette.background.default,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              overflowX: 'auto',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: theme.palette.action.hover }}>
                  <th style={{ ...cell, textAlign: 'left' }}>Description</th>
                  {showQuantities && (
                    <>
                      <th style={cell}>Qty</th>
                      <th style={cell}>Rate</th>
                    </>
                  )}
                  <th style={cell}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item: any, index: number) => (
                  <tr key={item.id ?? index}>
                    <td style={cell}>
                      {lineDescription(item)}
                      {item.kind === 'adjustment' && (
                        <Typography component='span' variant='caption' color='text.secondary' sx={{ ml: 1, textTransform: 'capitalize' }}>
                          ({item.adjustment_type})
                        </Typography>
                      )}
                    </td>
                    {showQuantities && (
                      <>
                        <td style={{ ...cell, textAlign: 'center' }}>
                          {item.quantity != null ? `${item.quantity}${item.measurement_unit?.symbol ? ` ${item.measurement_unit.symbol}` : ''}` : ''}
                        </td>
                        <td style={{ ...cell, textAlign: 'right' }}>{item.rate != null ? money(item.rate) : ''}</td>
                      </>
                    )}
                    <td style={{ ...cell, textAlign: 'right' }}>{money(lineAmount(item))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </Box>
      )}

      <Box
        sx={{
          p: 2,
          backgroundColor: theme.palette.background.default,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
        }}
      >
        <Grid container rowSpacing={0.5}>
          <Grid size={8}>
            <Typography variant='body1'>Amount</Typography>
          </Grid>
          <Grid size={4} textAlign='right'>
            <Typography variant='body1'>{currencyCode}{money(invoice.amount)}</Typography>
          </Grid>

          {!!invoice.adjustment_amount && (
            <>
              <Grid size={8}>
                <Typography variant='body1'>Adjustments</Typography>
              </Grid>
              <Grid size={4} textAlign='right'>
                <Typography variant='body1'>{currencyCode}{money(invoice.adjustment_amount)}</Typography>
              </Grid>
            </>
          )}

          {!!invoice.vat_amount && (
            <>
              <Grid size={8}>
                <Typography variant='body1'>VAT</Typography>
              </Grid>
              <Grid size={4} textAlign='right'>
                <Typography variant='body1'>{currencyCode}{money(invoice.vat_amount)}</Typography>
              </Grid>
            </>
          )}

          <Grid size={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>

          <Grid size={8}>
            <Typography variant='h6' fontWeight='bold' color={headerColor}>
              Net Receivable
            </Typography>
          </Grid>
          <Grid size={4} textAlign='right'>
            <Typography variant='h6' fontWeight='bold' color={headerColor}>
              {currencyCode}{money(invoice.net_amount)}
            </Typography>
          </Grid>

          {!!invoice.paid_amount && (
            <>
              <Grid size={8}>
                <Typography variant='body1'>Received</Typography>
              </Grid>
              <Grid size={4} textAlign='right'>
                <Typography variant='body1'>{currencyCode}{money(invoice.paid_amount)}</Typography>
              </Grid>
            </>
          )}

          {(!!invoice.paid_amount || !!invoice.manually_paid_at) && (
            <>
              <Grid size={8}>
                <Typography variant='body1' fontWeight='bold'>
                  Balance Due
                </Typography>
              </Grid>
              <Grid size={4} textAlign='right'>
                <Typography variant='body1' fontWeight='bold'>
                  {currencyCode}{money(invoice.unpaid_amount)}
                </Typography>
              </Grid>
            </>
          )}
        </Grid>
      </Box>

      {invoice.narration && (
        <Box sx={{ mt: 3 }}>
          <Typography variant='h6' sx={{ color: headerColor, textAlign: 'center', mb: 2 }}>
            NARRATION
          </Typography>
          <Box
            sx={{
              p: 2,
              backgroundColor: theme.palette.background.default,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              textAlign: 'center',
            }}
          >
            <Typography variant='body1' sx={{ lineHeight: 1.5, whiteSpace: 'pre-line' }}>
              {invoice.narration}
            </Typography>
          </Box>
        </Box>
      )}

      {invoice.terms_and_instructions && (
        <Box sx={{ mt: 3 }}>
          <Typography variant='h6' sx={{ color: headerColor, textAlign: 'center', mb: 2 }}>
            TERMS AND INSTRUCTIONS
          </Typography>
          <Typography variant='body2' sx={{ lineHeight: 1.5, whiteSpace: 'pre-line', textAlign: 'center' }}>
            {invoice.terms_and_instructions}
          </Typography>
        </Box>
      )}

      {!!invoice.receipts?.length && (
        <Box sx={{ mt: 3 }}>
          <Typography variant='h6' sx={{ color: headerColor, textAlign: 'center', mb: 2 }}>
            RECEIPTS
          </Typography>
          <Box
            sx={{
              p: 2,
              backgroundColor: theme.palette.background.default,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              overflowX: 'auto',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: theme.palette.action.hover }}>
                  <th style={{ padding: 8, border: `1px solid ${theme.palette.divider}`, textAlign: 'left' }}>
                    Voucher No.
                  </th>
                  <th style={{ padding: 8, border: `1px solid ${theme.palette.divider}`, textAlign: 'left' }}>
                    Date
                  </th>
                  <th style={{ padding: 8, border: `1px solid ${theme.palette.divider}`, textAlign: 'left' }}>
                    Received Into
                  </th>
                  <th style={{ padding: 8, border: `1px solid ${theme.palette.divider}`, textAlign: 'left' }}>
                    Reference
                  </th>
                  <th style={{ padding: 8, border: `1px solid ${theme.palette.divider}` }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.receipts.map((receipt: any) => (
                  <tr key={receipt.id}>
                    <td style={{ padding: 8, border: `1px solid ${theme.palette.divider}` }}>
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
                          <Tooltip title={`Cancelled ${readableDate(receipt.cancelled_at)} — this receipt was reversed, but the amount it applied here is unaffected and may no longer be accurate`}>
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
                    </td>
                    <td style={{ padding: 8, border: `1px solid ${theme.palette.divider}` }}>
                      {readableDate(receipt.transaction_date)}
                    </td>
                    <td style={{ padding: 8, border: `1px solid ${theme.palette.divider}` }}>
                      {receipt.debit_ledger?.name}
                    </td>
                    <td style={{ padding: 8, border: `1px solid ${theme.palette.divider}` }}>
                      {receipt.reference || receipt.narration}
                    </td>
                    <td style={{ padding: 8, border: `1px solid ${theme.palette.divider}`, textAlign: 'right' }}>
                      {money(receipt.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </Box>
      )}

      <ReceiptPreviewDialog
        open={!!previewReceiptId}
        receiptId={previewReceiptId}
        onClose={() => setPreviewReceiptId(null)}
      />
    </Box>
  );
}

export default CustomerInvoiceOnScreenPreview;
