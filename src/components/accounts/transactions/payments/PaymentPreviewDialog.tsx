'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import PDFContent from '@/components/pdf/PDFContent';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import PreviewTopBar from '@/components/sharedComponents/PreviewTopBar';
import { AuthObject } from '@/types/auth-types';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { HighlightOff } from '@mui/icons-material';
import { Box, Button, Dialog, DialogContent, IconButton, Skeleton, Typography, useMediaQuery } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import paymentServices from './payment-services';
import PaymentOnScreenPreview from './PaymentOnScreenPreview';
import PaymentPDF from './PaymentPDF';

interface PaymentPreviewDialogProps {
  open: boolean;
  paymentId: number | null;
  onClose: () => void;
}

/**
 * Read-only view of a single Payment, opened by clicking its voucher number elsewhere (e.g. the
 * Payments section on a Purchase Bill) - reuses the same PaymentOnScreenPreview/PaymentPDF pair
 * PaymentItemAction's own DocumentDialog renders, without needing that row's full action menu.
 */
const PaymentPreviewDialog = ({ open, paymentId, onClose }: PaymentPreviewDialogProps) => {
  const authObject = useJumboAuth();
  const { checkOrganizationPermission } = authObject;
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const [showOnScreen, setShowOnScreen] = useState(true);

  // Being able to see this voucher number on a Purchase Bill doesn't by itself mean the viewer
  // can see full Payment details — gate this exactly like the real Payments list's own "View"
  // action does (PaymentItemAction.tsx), so a bill-only viewer can't use this as a side door.
  const canView = checkOrganizationPermission([
    PERMISSIONS.ACCOUNTS_TRANSACTIONS_READ,
    PERMISSIONS.PAYMENTS_READ,
  ]);

  const { data, isFetching, isError, error } = useQuery({
    queryKey: ['payment', paymentId],
    queryFn: () => paymentServices.show(paymentId),
    enabled: open && !!paymentId && canView,
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth='md'
      fullScreen={belowLargeScreen}
      scroll={belowLargeScreen ? 'body' : 'paper'}
    >
      <DialogContent>
        {!canView ? (
          <>
            <PreviewTopBar
              closeButton={
                <IconButton size='small' color='primary' onClick={onClose}>
                  <HighlightOff color='primary' />
                </IconButton>
              }
            />
            <Typography color='error' textAlign='center' mt={2}>
              You do not have permission to view payment details.
            </Typography>
          </>
        ) : isFetching ? (
          <div style={{ width: '100%', padding: '16px' }}>
            <Skeleton variant='text' width={180} height={32} style={{ borderRadius: 4, marginLeft: 'auto' }} />
            <Skeleton variant='rectangular' width='100%' height={48} style={{ borderRadius: 4 }} />
            <Skeleton variant='rectangular' width='100%' height={32} style={{ borderRadius: 4 }} />
          </div>
        ) : isError || !data ? (
          <>
            <PreviewTopBar
              closeButton={
                <IconButton size='small' color='primary' onClick={onClose}>
                  <HighlightOff color='primary' />
                </IconButton>
              }
            />
            <Typography color='error' textAlign='center' mt={2}>
              {(error as any)?.response?.data?.message || 'Failed to load this payment.'}
            </Typography>
          </>
        ) : (
          <>
            <PreviewTopBar
              fileExportGrid={
                <FileExportGrid exportPdf handlePdf={() => setShowOnScreen((prev) => !prev)} />
              }
              closeButton={
                <IconButton size='small' color='primary' onClick={onClose}>
                  <HighlightOff color='primary' />
                </IconButton>
              }
            />
            {showOnScreen ? (
              <PaymentOnScreenPreview transaction={data} authObject={authObject as unknown as AuthObject} />
            ) : (
              <PDFContent
                fileName={data.voucherNo}
                document={<PaymentPDF transaction={data} authObject={authObject as unknown as AuthObject} />}
              />
            )}
          </>
        )}
        {belowLargeScreen && (
          <Box textAlign='right' mt={5}>
            <Button variant='outlined' size='small' color='primary' onClick={onClose}>
              Close
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentPreviewDialog;
