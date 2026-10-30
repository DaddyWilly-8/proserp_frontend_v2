'use client';
import { 
  Box, 
  Typography, 
  TextField, 
  Button,
  IconButton,
  Grid,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import * as yup from "yup";
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation } from '@tanstack/react-query';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import smsServices from './smsServices';
import { useSnackbar } from 'notistack';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface MessageData {
  to: string;
  text: string;
}

interface MultiMessagesFormData {
  messages: MessageData[];
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

export default function MultiTextMultiUsersForm() {
    const dictionary = useDictionary();
    const { enqueueSnackbar } = useSnackbar();
    const [responseData, setResponseData] = useState<SmsResponse | null>(null);

    const schema = yup.object({
        messages: yup.array().of(
            yup.object().shape({
                to: yup.string()
                    .required(dictionary.forms.nextSms.multiMulti.recipientRequired)
                    .matches(/^255\d{9}$/, dictionary.forms.nextSms.multiMulti.recipientPattern),
                text: yup.string().required(dictionary.forms.nextSms.common.messageRequired)
            })
        ).min(1, dictionary.forms.nextSms.multiMulti.atLeastOne)
    });

    const { control, handleSubmit, formState: { errors }, reset } = useForm<MultiMessagesFormData>({
        resolver: yupResolver(schema) as any,
        defaultValues: {
            messages: [{ to: "", text: "" }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "messages"
    });

    const mutation = useMutation({
        mutationFn: smsServices.sendMultiTextMultiUsers,
        onSuccess: (data: SmsResponse) => {
            enqueueSnackbar(dictionary.forms.nextSms.multiMulti.success.replace('{count}', String(data.messages?.length || 0)), { variant: 'success' });
            setResponseData(data);
            reset();
        },
        onError: (err: any) => {
            enqueueSnackbar(err?.response?.data?.message || dictionary.forms.nextSms.multiMulti.failedToSend, { variant: 'error' });
            setResponseData(null);
        }
    });

    const onSubmit = (data: MultiMessagesFormData) => {
        mutation.mutate({ messages: data.messages });
    };

    const addMessage = () => {
        append({ to: "", text: "" });
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

    const totalRecipients = fields.length;
    const totalMessages = fields.reduce((total, field) => total + (field.text ? Math.ceil(field.text.length / 160) : 0), 0);

    return (
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6">{dictionary.forms.nextSms.multiMulti.title}</Typography>

            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                {fields.map((field, index) => (
                    <Card key={field.id} variant="outlined" sx={{ mb: 2 }}>
                        <CardContent>
                            <Grid container spacing={2} alignItems="center">
                                <Grid size={{xs: 12, md: 5}}>
                                    <TextField
                                        label={dictionary.forms.nextSms.multiMulti.recipientLabel}
                                        fullWidth
                                        size="small"
                                        {...control.register(`messages.${index}.to` as const)}
                                        error={!!errors.messages?.[index]?.to}
                                        helperText={errors.messages?.[index]?.to?.message}
                                        placeholder="255712345678"
                                    />
                                </Grid>
                                
                                <Grid size={{xs: 12, md: 6}}>
                                    <TextField
                                        label={dictionary.forms.nextSms.common.message}
                                        fullWidth
                                        size="small"
                                        multiline
                                        rows={2}
                                        {...control.register(`messages.${index}.text` as const)}
                                        error={!!errors.messages?.[index]?.text}
                                        helperText={errors.messages?.[index]?.text?.message || 
                                            dictionary.forms.nextSms.multiMulti.messageHelper.replace('{chars}', String(field.text?.length || 0)).replace('{sms}', String(Math.ceil((field.text?.length || 0) / 160)))}
                                    />
                                </Grid>
                                
                                <Grid size={{xs: 12, md: 1}}>
                                    <IconButton
                                        onClick={() => remove(index)}
                                        color="error"
                                        disabled={fields.length === 1}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                ))}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', mt: 2 }}>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" color="text.secondary">
                            {dictionary.forms.nextSms.multiMulti.summaryLine.replace('{recipients}', String(totalRecipients)).replace('{sms}', String(totalMessages))}
                        </Typography>
                    </Box>
                    <Button
                        onClick={addMessage}
                        startIcon={<AddIcon />}
                        variant="outlined"
                        size="small"
                    >
                        {dictionary.forms.nextSms.multiMulti.addAnother}
                    </Button>
                </Box>

                <LoadingButton 
                    type="submit" 
                    variant="contained" 
                    loading={mutation.isPending}
                    sx={{ mt: 2 }}
                    fullWidth
                >
                    {dictionary.forms.nextSms.multiMulti.sendMessages.replace('{count}', String(totalRecipients))}
                </LoadingButton>
            </Box>

            {responseData && responseData.messages && (
                <Card variant="outlined" sx={{ mt: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            {dictionary.forms.nextSms.multiMulti.deliveryStatusTitle.replace('{count}', String(responseData.messages.length))}
                        </Typography>
                        
                        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>{dictionary.forms.nextSms.common.to}</TableCell>
                                        <TableCell>{dictionary.forms.nextSms.common.status}</TableCell>
                                        <TableCell>{dictionary.forms.nextSms.common.description}</TableCell>
                                        <TableCell>{dictionary.forms.nextSms.common.smsCount}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {responseData.messages.map((message, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{message.to}</TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={message.status.name} 
                                                    color={getStatusColor(message.status.name)}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>{message.status.description}</TableCell>
                                            <TableCell>{message.smsCount}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Summary Statistics */}
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                {dictionary.forms.nextSms.common.summary}
                            </Typography>
                            <Typography variant="body2">
                                {dictionary.forms.nextSms.multiMulti.totalMessagesSent.replace('{count}', String(responseData.messages.length))}
                            </Typography>
                            <Typography variant="body2">
                                {dictionary.forms.nextSms.common.totalSms.replace('{count}', String(responseData.messages.reduce((total, msg) => total + msg.smsCount, 0)))}
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