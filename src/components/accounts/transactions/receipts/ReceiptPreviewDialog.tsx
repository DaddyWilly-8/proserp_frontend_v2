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
import receiptServices from './receipt-services';
import ReceiptOnScreen from './ReceiptOnScreen';
import ReceiptPDF from './ReceiptPDF';

interface ReceiptPreviewDialogProps {
  open: boolean;
  receiptId: number | null;
  onClose: () => void;
}

/**
 * Read-only view of a single Receipt, opened by clicking its voucher number elsewhere (e.g. the
 * Receipts section on a Customer Invoice) - reuses the same ReceiptOnScreen/ReceiptPDF pair
 * ReceiptItemAction's own DocumentDialog renders, without needing that row's full action menu.
 */
const ReceiptPreviewDialog = ({ open, receiptId, onClose }: ReceiptPreviewDialogProps) => {
  const authObject = useJumboAuth();
  const { checkOrganizationPermission } = authObject;
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const [showOnScreen, setShowOnScreen] = useState(true);

  // Being able to see this voucher number on a Customer Invoice doesn't by itself mean the
  // viewer can see full Receipt details — gate this the same way the backend route does
  // (AccountsTransactions:Read, mirroring Payments' own view check) so an invoice-only viewer
  // can't use this as a side door. Deliberately NOT PERMISSIONS.ACCOUNTS_MASTERS_READ, which
  // ReceiptItemAction.tsx's own "View" check uses — that looks like a pre-existing mismatch
  // there (every other Receipts ability check, and the backend route itself, pairs with
  // AccountsTransactions:*, never AccountsMasters:*).
  const canView = checkOrganizationPermission([
    PERMISSIONS.ACCOUNTS_TRANSACTIONS_READ,
    PERMISSIONS.RECEIPTS_READ,
  ]);

  const { data, isFetching, isError, error } = useQuery({
    queryKey: ['receipt', receiptId],
    queryFn: () => receiptServices.show(receiptId),
    enabled: open && !!receiptId && canView,
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
              You do not have permission to view receipt details.
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
              {(error as any)?.response?.data?.message || 'Failed to load this receipt.'}
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
              <ReceiptOnScreen transaction={data} authObject={authObject as unknown as AuthObject} />
            ) : (
              <PDFContent
                fileName={data.voucherNo}
                document={<ReceiptPDF transaction={data} authObject={authObject as unknown as AuthObject} />}
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

export default ReceiptPreviewDialog;
