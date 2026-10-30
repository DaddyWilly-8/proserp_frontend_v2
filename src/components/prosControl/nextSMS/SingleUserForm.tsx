'use client';

import { Box, Typography, TextField, Chip, Card, CardContent } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from "yup";
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation } from '@tanstack/react-query';
import smsServices from './smsServices';
import { useSnackbar } from 'notistack';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface SingleSmsFormData {
  from: string;
  to: string;
  text: string;
}

interface SmsResponse {
  messages: Array<{
    to: string;
    status: {
      groupId: number;
      groupName: string;
      id: number;
      name: string;
      description: string;
    };
    smsCount: number;
  }>;
}

export default function SingleUserForm() {
    const dictionary = useDictionary();
    const { enqueueSnackbar } = useSnackbar();
    const [responseData, setResponseData] = useState<SmsResponse | null>(null);

    const validationSchema = yup.object({
        to: yup.string().required(dictionary.forms.nextSms.single.recipientRequired),
        text: yup.string().required(dictionary.forms.nextSms.common.messageRequired)
    });
    
    const { register, handleSubmit, formState: { errors }, reset } = useForm<SingleSmsFormData>({
        resolver: yupResolver(validationSchema) as any,
        defaultValues: {
            from: 'REMINDER'
        }
    });

    const sendSmsMutation = useMutation({
        mutationFn: smsServices.sendSingleSms,
        onSuccess: (data) => {
            enqueueSnackbar(dictionary.forms.nextSms.single.success, { variant: 'success' });
            setResponseData(data);
            reset();
        },
        onError: (error: any) => {
            enqueueSnackbar(error?.response?.data?.message || dictionary.forms.nextSms.common.failedToSend, { variant: 'error' });
            setResponseData(null);
        }
    });

    const onSubmit = (data: SingleSmsFormData) => {
        sendSmsMutation.mutate(data);
    };

    const getStatusColor = (statusName: string) => {
        switch (statusName) {
            case 'PENDING_ENROUTE':
                return 'warning';
            case 'DELIVERED':
                return 'success';
            case 'REJECTED':
            case 'EXPIRED':
                return 'error';
            default:
                return 'default';
        }
    };

    return (
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6">{dictionary.forms.nextSms.single.title}</Typography>

            <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                    label={dictionary.forms.nextSms.single.recipientLabel}
                    {...register("to")}
                    error={!!errors.to}
                    helperText={errors.to?.message}
                    fullWidth
                />

                <TextField
                    label={dictionary.forms.nextSms.common.message}
                    {...register("text")}
                    error={!!errors.text}
                    helperText={errors.text?.message}
                    multiline
                    rows={4}
                    fullWidth
                />

                <LoadingButton
                    type="submit"
                    variant="contained"
                    loading={sendSmsMutation.isPending}
                >
                    {dictionary.forms.nextSms.single.send}
                </LoadingButton>
            </Box>

            {responseData && responseData.messages && (
                <Card variant="outlined">
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            {dictionary.forms.nextSms.common.deliveryStatusTitle}
                        </Typography>
                        {responseData.messages.map((message, index) => (
                            <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    {dictionary.forms.nextSms.common.toValue.replace('{to}', String(message.to))}
                                </Typography>
                                
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Typography variant="body2">{dictionary.forms.nextSms.common.statusColon}</Typography>
                                    <Chip 
                                        label={message.status.name} 
                                        color={getStatusColor(message.status.name)}
                                        size="small"
                                    />
                                </Box>
                                
                                <Typography variant="body2" gutterBottom>
                                    {dictionary.forms.nextSms.common.descriptionValue.replace('{description}', String(message.status.description))}
                                </Typography>
                                
                                <Typography variant="body2" gutterBottom>
                                    {dictionary.forms.nextSms.common.groupValue.replace('{group}', String(message.status.groupName))}
                                </Typography>
                                
                                <Typography variant="body2">
                                    {dictionary.forms.nextSms.common.smsCountValue.replace('{count}', String(message.smsCount))}
                                </Typography>
                            </Box>
                        ))}
                    </CardContent>
                </Card>
            )}
        </Box>
    );
}