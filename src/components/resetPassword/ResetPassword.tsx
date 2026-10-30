'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import axios from '@/lib/services/config';
import { ASSET_IMAGES } from '@/utilities/constants/paths';
import { Div } from '@jumbo/shared';
import { LoadingButton } from '@mui/lab';
import {
  Card,
  CardContent,
  TextField,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useSnackbar } from 'notistack';
import ResetPasswordForm from '@/components/forgotPassword/ResetPasswordForm';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

export default function ResetPassword() {
  const dictionary = useDictionary();
  const { enqueueSnackbar } = useSnackbar();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const token = searchParams.get('token');

  const mutation = useMutation({
    mutationFn: async (email: string) => {
      return axios
        .post('/api/auth/recover-email', { email })
        .then((response) => {
          if (response.status === 200) {
            return response.data;
          }
          throw new Error('Unexpected response status');
        })
        .catch((err) => {
          throw err;
        });
    },
    onSuccess: (data) => {
      enqueueSnackbar(data?.message || dictionary.forms.resetPassword.recover.success, {
        variant: 'success',
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || dictionary.forms.resetPassword.recover.failed;
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const handleSubmit = async () => {
    if (!email.trim()) {
      enqueueSnackbar(dictionary.forms.resetPassword.recover.emailRequired, { variant: 'warning' });
      return;
    }
    mutation.mutate(email);
  };

  // If token is present in URL, show the password reset form
  if (token) {
    return <ResetPasswordForm />;
  }

  return (
    <Div
      sx={{
        flex: 1,
        flexWrap: 'wrap',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: theme => theme.spacing(4),
      }}
    >
      <Div sx={{mb: 3, display: 'inline-flex'}}>
          <img width={200} src={`${ASSET_IMAGES}/logos/proserp-blue.png`} alt="ProsERP"/>
      </Div>
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent>
          <Typography variant="h5" align="center" mb={2}>
            {dictionary.forms.resetPassword.recover.title}
          </Typography>

          <TextField
            fullWidth
            id="email"
            label={dictionary.forms.resetPassword.recover.emailLabel}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 3 }}
          />

          <LoadingButton
            onClick={handleSubmit}
            loading={mutation.isPending}
            fullWidth
            variant="contained"
            size="large"
            sx={{ mb: 3 }}
          >
            {dictionary.forms.resetPassword.recover.submit}
          </LoadingButton>

          <Typography align="center" variant="body2" mb={1}>
            {dictionary.forms.resetPassword.links.havePassword}{' '}
            <Link href="/auth/signin" style={{ color: '#0267a0', fontWeight: 600 }}>
              {dictionary.forms.resetPassword.links.proceedToSignIn}
            </Link>
          </Typography>

          <Typography align="center" variant="body2">
            {dictionary.forms.resetPassword.links.forgotEmail}{' '}
            <Link href="/support" style={{ color: '#00a8ff' }}>
              {dictionary.forms.resetPassword.links.contactSupport}
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Div>
  );
}
