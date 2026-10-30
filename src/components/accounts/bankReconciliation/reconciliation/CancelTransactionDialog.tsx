'use client';

import React, { useState } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface Props {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export default function CancelTransactionDialog({ open, loading, onClose, onConfirm }: Props) {
  const dictionary = useDictionary();
  const [reason, setReason] = useState('');

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>{dictionary.forms.bankReconciliation.cancelTransaction.title}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          multiline
          minRows={2}
          sx={{ mt: 1 }}
          label={dictionary.forms.bankReconciliation.cancelTransaction.labels.reason}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <LoadingButton onClick={onClose}>{dictionary.forms.bankReconciliation.cancelTransaction.buttons.back}</LoadingButton>
        <LoadingButton
          variant='contained'
          color='error'
          disabled={!reason.trim()}
          loading={loading}
          onClick={() => onConfirm(reason)}
        >
          {dictionary.forms.bankReconciliation.cancelTransaction.buttons.cancelTransaction}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
