'use client';

import React, { useState } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { LoadingButton } from '@mui/lab';

interface Props {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export default function CancelTransactionDialog({ open, loading, onClose, onConfirm }: Props) {
  const [reason, setReason] = useState('');

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>Cancel this transaction?</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          multiline
          minRows={2}
          sx={{ mt: 1 }}
          label='Reason for cancelling'
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <LoadingButton onClick={onClose}>Back</LoadingButton>
        <LoadingButton
          variant='contained'
          color='error'
          disabled={!reason.trim()}
          loading={loading}
          onClick={() => onConfirm(reason)}
        >
          Cancel Transaction
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
