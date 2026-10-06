'use client';

import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { Chip, Grid, ListItemText, Stack, Tooltip, Typography } from '@mui/material';
import CustomerInvoiceItemAction from './CustomerInvoiceItemAction';
import { CustomerInvoice } from './CustomerInvoiceType';

const money = (value: number = 0) =>
  value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function CustomerInvoiceListItem({ invoice }: { invoice: CustomerInvoice }) {
  const netAmount = invoice.net_amount ?? 0;
  const paidAmount = invoice.paid_amount ?? 0;
  const paymentStatus = invoice.manually_paid_at || (netAmount > 0 && paidAmount >= netAmount)
    ? 'paid'
    : paidAmount > 0
      ? 'partial'
      : 'unpaid';
  const isOverdue =
    paymentStatus !== 'paid' && !!invoice.due_date && new Date(invoice.due_date).getTime() < Date.now();

  const sourceLabel =
    invoice.source?.type === 'ProjectPaymentClaim'
      ? `Project Payment Claim ${invoice.source.no ?? ''}`.trim()
      : invoice.source?.no
        ? `Sale ${invoice.source.no}`
        : '';

  return (
    <Grid
      container
      columnSpacing={2}
      sx={{
        borderTop: 1,
        borderColor: 'divider',
        '&:hover': { bgcolor: 'action.hover' },
        padding: 1,
      }}
      alignItems='center'
    >
      <Grid size={{ xs: 6, md: 2, lg: 1.5 }}>
        <ListItemText
          primary={
            <Tooltip title='Invoice Date'>
              <Typography variant='h5' fontSize={14} lineHeight={1.25} mb={0} noWrap component='span'>
                {readableDate(invoice.transaction_date)}
              </Typography>
            </Tooltip>
          }
          secondary={
            invoice.due_date ? (
              <Tooltip title={isOverdue ? 'Overdue' : 'Due Date'}>
                <Typography variant='caption' color={isOverdue ? 'error' : 'text.secondary'} component='span'>
                  Due {readableDate(invoice.due_date)}
                </Typography>
              </Tooltip>
            ) : null
          }
        />
      </Grid>

      <Grid size={{ xs: 6, md: 3, lg: 2.5 }}>
        <ListItemText
          primary={
            <Stack direction='row' spacing={0.5} alignItems='center' flexWrap='wrap'>
              <Tooltip title='Invoice No.'>
                <Typography variant='h5' fontSize={14} lineHeight={1.25} mb={0} noWrap component='span'>
                  {invoice.invoiceNo}
                </Typography>
              </Tooltip>
              {paymentStatus === 'paid' && (
                <Tooltip title={invoice.manually_paid_at ? 'Marked as paid' : 'Fully received from the customer'}>
                  <Chip size='small' variant='outlined' color='success' label='Paid' />
                </Tooltip>
              )}
              {paymentStatus === 'partial' && (
                <Tooltip title={`Partially received: ${money(paidAmount)} of ${money(netAmount)}`}>
                  <Chip size='small' variant='outlined' color='warning' label='Partially Paid' />
                </Tooltip>
              )}
              {paymentStatus === 'unpaid' && (
                <Tooltip title='Not yet received from the customer'>
                  <Chip size='small' variant='outlined' label='Unpaid' />
                </Tooltip>
              )}
            </Stack>
          }
          secondary={
            sourceLabel ? (
              <Tooltip title='Source Document'>
                <Typography variant='caption' color='text.secondary' component='span'>
                  {sourceLabel}
                </Typography>
              </Tooltip>
            ) : null
          }
        />
      </Grid>

      <Grid size={{ xs: 12, md: 3, lg: 3 }}>
        <ListItemText
          primary={
            <Tooltip title='Customer'>
              <Typography variant='h5' fontSize={14} lineHeight={1.25} mb={0} noWrap component='span'>
                {invoice.stakeholder?.name}
              </Typography>
            </Tooltip>
          }
        />
      </Grid>

      <Grid size={{ xs: 12, md: 2, lg: 2.5 }}>
        <ListItemText
          secondary={
            <Tooltip title='Internal / Customer Reference'>
              <Typography component='span' fontSize={14} lineHeight={1.25} mb={0} noWrap color='text.secondary'>
                {[invoice.internal_reference, invoice.customer_reference].filter(Boolean).join(' / ')}
              </Typography>
            </Tooltip>
          }
        />
      </Grid>

      <Grid size={{ xs: 10, md: 4, lg: 1.5 }} display='flex' justifyContent='flex-end'>
        <ListItemText
          primary={
            <Tooltip title={paidAmount > 0 ? `Net ${money(netAmount)} (unpaid ${money(invoice.unpaid_amount)})` : 'Net Receivable'}>
              <Typography variant='h5' fontSize={14} lineHeight={1.25} mb={0} noWrap component='span'>
                {invoice.currency?.code ? `${invoice.currency.code} ` : ''}
                {money(netAmount)}
              </Typography>
            </Tooltip>
          }
        />
      </Grid>

      <Grid size={{ xs: 2, md: 1, lg: 1 }} display='flex' justifyContent='flex-end'>
        <CustomerInvoiceItemAction invoice={invoice} />
      </Grid>
    </Grid>
  );
}

export default CustomerInvoiceListItem;
