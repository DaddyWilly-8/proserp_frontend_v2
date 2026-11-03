'use client'

import React, { useState } from 'react';
import { LoadingButton } from '@mui/lab';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Typography } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { sharedCostServices } from '../bio-production-services';
import { BioSharedCost } from '../types';
import PayLedgerFields, { PayFrom } from './PayLedgerFields';

const money = (value: number) => Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Posts the payment of a shared cost that was saved unpaid. */
const PayDialog = ({ cost, open, onClose }: { cost: BioSharedCost; open: boolean; onClose: () => void }) => {
  const dictionary = useDictionary();
  const text = dictionary.bioProduction.sharedCosts;
  const common = dictionary.bioProduction.common;
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [payFrom, setPayFrom] = useState<PayFrom | null>(null);
  const [reference, setReference] = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: () => sharedCostServices.pay(cost.id, { pay_from_ledger_id: payFrom?.id, payment_reference: reference.trim() || undefined }),
    onSuccess: (data) => {
      enqueueSnackbar(data.paymentNo ? `${data.message} · ${data.paymentNo}` : data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['bioSharedCosts'] });
      queryClient.invalidateQueries({ queryKey: ['bioSharedCost', cost.id] });
      onClose();
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
      <DialogTitle>{text.payTitle}</DialogTitle>
      <DialogContent sx={{ pt: '10px !important' }}>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>{text.payHelp.replace('{amount}', money(Number(cost.amount))).replace('{ledger}', cost.ledger?.name ?? '')}</Typography>
        <Grid container spacing={2}>
          <PayLedgerFields payFrom={payFrom} onPayFrom={setPayFrom} reference={reference} onReference={setReference} />
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button size='small' onClick={onClose}>{common.cancel}</Button>
        <LoadingButton size='small' variant='contained' loading={isPending} disabled={!payFrom} onClick={() => mutate()}>{text.buttons.pay}</LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default PayDialog;
