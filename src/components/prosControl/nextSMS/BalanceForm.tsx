'use client';

import { Box, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import smsServices from './smsServices';
import { useSnackbar } from 'notistack';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

export default function BalanceForm() {
    const dictionary = useDictionary();
    const { enqueueSnackbar } = useSnackbar();
    const [currentBalance, setCurrentBalance] = useState(null);

    const mutation = useMutation({
        mutationFn: smsServices.checkBalance,
        onSuccess: (data) => {
            enqueueSnackbar(dictionary.forms.nextSms.balance.current.replace('{balance}', String(data.sms_balance)), { variant: 'success' });
            setCurrentBalance(data.sms_balance);
        },
        onError: (err) => {
            enqueueSnackbar(dictionary.forms.nextSms.balance.error, { variant: 'error' });
        }
    });

    return (
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {currentBalance ? (
                <Typography variant="h6">{dictionary.forms.nextSms.balance.current.replace('{balance}', String(currentBalance))}</Typography>
            ) : (
                <Typography variant="h6">{dictionary.forms.nextSms.balance.check}</Typography>
            )}

            <LoadingButton
                onClick={() => mutation.mutate()}
                variant="contained"
                loading={mutation.isPending}
            >
                {dictionary.forms.nextSms.balance.button}
            </LoadingButton>
        </Box>
    );
}