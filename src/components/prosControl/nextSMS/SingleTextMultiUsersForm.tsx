'use client';
import { Box, Typography, TextField, Chip, Card, CardContent, Grid } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from "yup";
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation } from '@tanstack/react-query';
import smsServices from './smsServices';
import { useSnackbar } from 'notistack';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface MultiUsersFormData {
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

export default function SingleTextMultiUsersForm() {
    const dictionary = useDictionary();
    const { enqueueSnackbar } = useSnackbar();
    const [responseData, setResponseData] = useState<SmsResponse | null>(null);

    const schema = yup.object({
        to: yup.string().required(dictionary.forms.nextSms.singleMulti.recipientsRequired),
        text: yup.string().required(dictionary.forms.nextSms.common.messageRequired)
    });

    const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<MultiUsersFormData>({
        resolver: yupResolver(schema) as any
    });

    const mutation = useMutation({
        mutationFn: smsServices.sendSingleTextMultiUsers,
        onSuccess: (data) => {
            enqueueSnackbar(dictionary.forms.nextSms.singleMulti.success, { variant: 'success' });
            setResponseData(data);
            reset();
        },
        onError: (err: any) => {
            enqueueSnackbar(err?.response?.data?.message || dictionary.forms.nextSms.common.failedToSend, { variant: 'error' });
            setResponseData(null);
        }
    });

    const onSubmit = (data: MultiUsersFormData) => {
        const toArray = data.to.split(",").map(n => n.trim()).filter(n => n.length > 0);
        mutation.mutate({ to: toArray, text: data.text });
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

    // Calculate recipient count and SMS count
    const recipientCount = watch('to') ? watch('to').split(",").filter(n => n.trim().length > 0).length : 0;
    const estimatedSmsCount = Math.ceil((watch('text')?.length || 0) / 160) * recipientCount;

    return (
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6">{dictionary.forms.nextSms.singleMulti.title}</Typography>

            <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                    label={dictionary.forms.nextSms.singleMulti.recipientsLabel}
                    {...register("to")}
                    error={!!errors.to}
                    helperText={errors.to?.message || dictionary.forms.nextSms.singleMulti.recipientsHelper.replace('{count}', String(recipientCount))}
                    multiline
                    rows={2}
                    fullWidth
                />

                <TextField
                    label={dictionary.forms.nextSms.common.message}
                    {...register("text")}
                    error={!!errors.text}
                    helperText={errors.text?.message || dictionary.forms.nextSms.singleMulti.messageHelper.replace('{chars}', String(watch('text')?.length || 0)).replace('{sms}', String(Math.ceil((watch('text')?.length || 0) / 160)))}
                    multiline 
                    rows={4}
                    fullWidth
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        {dictionary.forms.nextSms.singleMulti.totalEstimated.replace('{count}', String(estimatedSmsCount))}
                    </Typography>
                    
                    <LoadingButton 
                        type="submit" 
                        variant="contained" 
                        loading={mutation.isPending}
                    >
                        {dictionary.forms.nextSms.singleMulti.sendTo.replace('{count}', String(recipientCount))}
                    </LoadingButton>
                </Box>
            </Box>

            {responseData && responseData.messages && (
                <Card variant="outlined">
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            {dictionary.forms.nextSms.singleMulti.deliveryStatusTitle.replace('{count}', String(responseData.messages.length))}
                        </Typography>
                        
                        <Grid container spacing={2}>
                            {responseData.messages.map((message, index) => (
                                <Grid size={{xs: 12, md: 6}} key={index}>
                                    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, height: '100%' }}>
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
                                            {message.status.description}
                                        </Typography>
                                        
                                        <Typography variant="body2">
                                            {dictionary.forms.nextSms.common.smsCountValue.replace('{count}', String(message.smsCount))}
                                        </Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>

                        {/* Summary Statistics */}
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                {dictionary.forms.nextSms.common.summary}
                            </Typography>
                            <Typography variant="body2">
                                {dictionary.forms.nextSms.singleMulti.totalRecipients.replace('{count}', String(responseData.messages.length))}
                            </Typography>
                            <Typography variant="body2">
                                {dictionary.forms.nextSms.singleMulti.totalSmsSent.replace('{count}', String(responseData.messages.reduce((total, msg) => total + msg.smsCount, 0)))}
                            </Typography>
                            <Typography variant="body2">
                                {dictionary.forms.nextSms.common.currentStatus.replace('{status}', responseData.messages.every(msg => msg.status.name === 'DELIVERED') 
                                    ? dictionary.forms.nextSms.common.allDelivered 
                                    : responseData.messages.some(msg => msg.status.name === 'PENDING_ENROUTE')
                                    ? dictionary.forms.nextSms.common.inProgress
                                    : dictionary.forms.nextSms.common.mixedStatus
                                )}
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
}