'use client';

import { ASSET_IMAGES } from '@/utilities/constants/paths';
import { yupResolver } from '@hookform/resolvers/yup';
import { LoadingButton } from '@mui/lab';
import {
  Card,
  CardContent,
  Box as Div,
  Link,
  TextField,
  Typography,
} from '@mui/material';
import axios from 'axios';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { FC } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface ResetPasswordFormValues {
  email: string;
  password: string;
  password_confirmation: string;
}

interface ResetPasswordPayload extends ResetPasswordFormValues {
  token: string;
}

const ResetPasswordForm: FC = () => {
  const dictionary = useDictionary();
  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter();
  const params = useParams<{ lang?: string }>();
  const searchParams = useSearchParams();
  const lang = params?.lang || 'en-US';
  const token = (searchParams.get('token') || '').trim();

  const validationSchema = yup.object({
    email: yup
      .string()
      .email(dictionary.forms.resetPassword.errors.emailInvalid)
      .required(dictionary.forms.resetPassword.errors.emailRequired),
    password: yup
      .string()
      .required(dictionary.forms.resetPassword.errors.passwordRequired)
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/,
        dictionary.forms.resetPassword.errors.complexity
      ),
    password_confirmation: yup
      .string()
      .required(dictionary.forms.resetPassword.errors.confirmationRequired)
      .oneOf([yup.ref('password')], dictionary.forms.resetPassword.errors.mismatch),
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      email: '',
      password: '',
      password_confirmation: '',
    },
  });

  const resetPassword = async (data: ResetPasswordPayload): Promise<void> => {
    try {
      const response = await axios.post('/api/auth/reset-password', data);

      if (response.status === 200) {
        enqueueSnackbar(response.data.message, {
          variant: 'success',
        });
        router.push(`/${lang}/auth/signin`);
      }
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data?.message || dictionary.forms.resetPassword.messages.genericError, {
        variant: 'error',
      });
      throw err;
    }
  };

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) {
      enqueueSnackbar(dictionary.forms.resetPassword.messages.tokenMissing, {
        variant: 'error',
      });
      return;
    }

    await resetPassword({ ...data, token });
  };

  return (
    <Div
      sx={{
        flex: 1,
        flexWrap: 'wrap',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: (theme) => theme.spacing(4),
      }}
    >
      <Div sx={{ mb: 3, display: 'inline-flex' }}>
        <Link href='/' underline='none' sx={{ display: 'inline-flex' }}>
          <img
            width={200}
            src={`${ASSET_IMAGES}/logos/proserp-blue.png`}
            alt='ProsERP'
          />
        </Link>
      </Div>
      <Card sx={{ maxWidth: '100%', width: 360, mb: 4 }}>
        <CardContent>
          <Typography textAlign={'center'} sx={{ mb: 2 }} variant={'h4'}>
            {dictionary.forms.resetPassword.title}
          </Typography>
          <Div sx={{ mb: 3, mt: 1 }}>
            <form
              onSubmit={handleSubmit(onSubmit)}
              style={{ textAlign: 'left' }}
              noValidate
              autoComplete='off'
            >
              <Div sx={{ mt: 1, mb: 3 }}>
                <Controller
                  name='email'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label={dictionary.forms.resetPassword.labels.email}
                      error={!!errors.email}
                      helperText={errors.email?.message}
                    />
                  )}
                />
              </Div>
              <Div sx={{ mt: 1, mb: 2 }}>
                <Controller
                  name='password'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label={dictionary.forms.resetPassword.labels.newPassword}
                      type='password'
                      error={!!errors.password}
                      helperText={errors.password?.message}
                    />
                  )}
                />
              </Div>
              <Div sx={{ mt: 1, mb: 2 }}>
                <Controller
                  name='password_confirmation'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label={dictionary.forms.resetPassword.labels.confirmPassword}
                      type='password'
                      error={!!errors.password_confirmation}
                      helperText={errors.password_confirmation?.message}
                    />
                  )}
                />
              </Div>
              <LoadingButton
                fullWidth
                type='submit'
                variant='contained'
                sx={{ mb: 2 }}
                loading={isSubmitting}
                disabled={!token}
              >
                {dictionary.forms.resetPassword.buttons.submit}
              </LoadingButton>
            </form>
          </Div>
          <Typography textAlign={'center'} variant={'body1'} mb={1}>
            {dictionary.forms.resetPassword.links.havePassword}{' '}
            <Link
              color={'inherit'}
              underline='none'
              href={`/${lang}/auth/signin`}
            >
              {dictionary.forms.resetPassword.links.proceedToSignIn}
            </Link>
          </Typography>
          <Typography textAlign={'center'} variant={'body1'} mb={1}>
            {dictionary.forms.resetPassword.links.forgotEmail}{' '}
            <Link underline='none' href='#'>
              {dictionary.forms.resetPassword.links.contactSupport}
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Div>
  );
};
export default ResetPasswordForm;
