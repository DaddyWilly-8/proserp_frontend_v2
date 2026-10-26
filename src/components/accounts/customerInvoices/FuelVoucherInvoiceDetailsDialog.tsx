'use client';

import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import FuelVoucherInvoicePDF from '@/components/fuelStation/reports/fuelVoucherInvoices/FuelVoucherInvoicePDF';
import FuelVoucherInvoicePaymentsPanel from '@/components/fuelStation/reports/fuelVoucherInvoices/FuelVoucherInvoicePaymentsPanel';
import PDFContent from '@/components/pdf/PDFContent';
import PreviewTopBar from '@/components/sharedComponents/PreviewTopBar';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { HighlightOff } from '@mui/icons-material';
import { Box, Button, DialogContent, IconButton, Skeleton, Stack, Switch, Typography, useMediaQuery } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import customerInvoiceServices from '../invoices/customerInvoice-services';

// Fuel Voucher invoices have no on-screen preview of their own - they open straight
// into the same PDF that's printed from the Fuel Voucher Invoices dialog.
const FuelVoucherInvoiceDetailsDialog = ({
  id,
  setOpenDialog,
}: {
  id: number;
  setOpenDialog: (open: boolean) => void;
}) => {
  const dictionary = useDictionary();
  const { authOrganization } = useJumboAuth();
  const organization = authOrganization?.organization;
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  // Off: lines of the same product and price are grouped. On: every voucher is listed.
  const [openDetails, setOpenDetails] = useState(false);

  const { data: invoice, isFetching, isError, error } = useQuery({
    queryKey: ['fuel-voucher-invoice-details', id],
    queryFn: () => customerInvoiceServices.fuelVoucherInvoiceDetails(id),
  });

  const closeButton = (
    <IconButton size='small' color='primary' onClick={() => setOpenDialog(false)}>
      <HighlightOff color='primary' />
    </IconButton>
  );

  if (isFetching) {
    return (
      <div style={{ width: '100%', padding: '16px' }}>
        <Skeleton variant='text' width={180} height={32} style={{ borderRadius: 4, marginLeft: 'auto' }} />
        <Skeleton variant='rectangular' width='100%' height={48} style={{ borderRadius: 4 }} />
        <Skeleton variant='rectangular' width='100%' height={32} style={{ borderRadius: 4 }} />
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <DialogContent>
        <PreviewTopBar closeButton={closeButton} />
        <Typography color='error' textAlign='center' mt={2}>
          {(error as any)?.response?.data?.message || 'Failed to load this invoice.'}
        </Typography>
      </DialogContent>
    );
  }

  return (
    <DialogContent>
      <PreviewTopBar closeButton={closeButton} />
      <Stack direction='row' justifyContent='center' alignItems='center'>
        <Typography>Detailed</Typography>
        <Switch
          checked={openDetails}
          onChange={(event) => setOpenDetails(event.target.checked)}
          slotProps={{ input: { 'aria-label': 'controlled' } }}
        />
      </Stack>
      <FuelVoucherInvoicePaymentsPanel invoice={invoice} />
      <PDFContent
        // Page orientation only re-resolves on a real remount, so key both the wrapper and the inner viewer
        key={String(openDetails)}
        documentKey={String(openDetails)}
        fileName={`Invoice ${invoice.invoice_no.replace('/', '-')}${openDetails ? ' Detailed' : ' Summary'}`}
        document={<FuelVoucherInvoicePDF invoice={invoice} organization={organization} dictionary={dictionary} summarize={!openDetails} />}
      />
      {belowLargeScreen && (
        <Box textAlign='right' mt={5}>
          <Button variant='outlined' size='small' color='primary' onClick={() => setOpenDialog(false)}>
            Close
          </Button>
        </Box>
      )}
    </DialogContent>
  );
};

export default FuelVoucherInvoiceDetailsDialog;
