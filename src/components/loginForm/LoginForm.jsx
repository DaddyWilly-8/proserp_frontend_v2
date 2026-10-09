'use client';

import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import {
  JumboCheckbox,
  JumboForm,
  JumboInput,
  JumboOutlinedInput,
} from '@jumbo/vendors/react-hook-form';
import { Visibility, VisibilityOff, PersonOutline, LockOutlined } from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  Typography,
} from '@mui/material';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { lighten, darken } from '@mui/material/styles';
import { BackdropSpinner } from '@/shared/ProgressIndicators/BackdropSpinner';
import { getSession, signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import React, { useTransition } from 'react';
import * as yup from 'yup';
import organizationServices from '../organizations/organizationServices';

const LoginForm = () => {
  const lang = useLanguage();
  const dictionary = useDictionary();
  // The app's actual theme (src/themes/main/{default,dark}.ts) - not a
  // custom hardcoded palette, so this page matches whatever the rest of
  // the app looks like once logged in, light or dark.
  const { theme } = useJumboTheme();
  const { palette } = theme;
  // The dark theme's own primary.light/dark (#A67FFB/#5E3BB7) are purple,
  // not blue shades - using them for the brand gradient made dark mode
  // look purple instead of ProsERP's blue. Lighten/darken primary.main
  // itself instead, which stays in the blue family in both themes.
  const brandLight = lighten(palette.primary.main, theme.type === 'dark' ? 0.45 : 0.3);
  const brandDark = darken(palette.primary.main, 0.3);

  const [loading, setLoading] = React.useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { update } = useSession();
  const { setAuthValues, configAuth } = useJumboAuth();
  const router = useRouter();
  const [values, setValues] = React.useState({
    password: '',
    showPassword: false,
  });

  const validationSchema = yup.object().shape({
    email: yup
      .string()
      .email(dictionary.signin.form.errors.email.invalid)
      .required(dictionary.signin.form.errors.email.required),
    password: yup
      .string()
      .required(dictionary.signin.form.errors.password.required),
  });

  const [isPending, startTransition] = useTransition();

  const handleLogin = async (data) => {
    setLoading(true);
    try {
      const signInResponse = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
        callbackUrl: `/${lang}/dashboard`,
      });

      if (signInResponse?.error) {
        throw new Error(signInResponse.error);
      }

      await update();

      const session = await getSession();
      if (!session || !session.user) {
        throw new Error('Failed to retrieve session');
      }

      let targetUrl = `/${lang}/dashboard`;

      if (!session.organization_id) {
        targetUrl = `/${lang}/organizations`;
        setAuthValues(
          {
            authUser: {
              user: session.user,
              permissions: session.permissions || [],
            },
            authOrganization: { permissions: [] },
            isAuthenticated: true,
            isLoading: false,
          },
          { persist: true }
        );
      } else {
        const orgResponse = await organizationServices.loadOrganization({
          organization_id: session.organization_id,
        });

        if (
          !orgResponse?.data?.authUser ||
          !orgResponse?.data?.authOrganization
        ) {
          throw new Error('Failed to load organization');
        }

        configAuth({
          currentUser: orgResponse.data.authUser,
          currentOrganization: orgResponse.data.authOrganization,
        });

        setAuthValues(
          {
            authUser: orgResponse.data.authUser,
            authOrganization: orgResponse.data.authOrganization,
            isAuthenticated: true,
            isLoading: false,
          },
          { persist: true }
        );
      }

      startTransition(() => {
        router.push(targetUrl);
      });
    } catch (error) {
      setLoading(false);
      enqueueSnackbar(
        dictionary.signin.form.messages.loginError ||
          'Login failed. Please try again.',
        { variant: 'error' }
      );
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setValues({
      ...values,
      showPassword: !values.showPassword,
    });
  };

  const fieldLabelSx = { color: palette.text.secondary, fontWeight: 600, fontSize: '0.8rem', mb: 0.75 };
  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '10px',
      backgroundColor: palette.background.paper,
      color: palette.text.primary,
      '& fieldset': { borderColor: palette.divider },
      '&:hover fieldset': { borderColor: palette.primary.main },
      '&.Mui-focused fieldset': { borderColor: palette.primary.main, borderWidth: '2px' },
    },
    '& .MuiInputBase-input::placeholder': { color: palette.text.secondary, opacity: 1 },
  };

  return (
    <Box>
      {(loading || isPending) && <BackdropSpinner />}
      <JumboForm
        validationSchema={validationSchema}
        onSubmit={handleLogin}
        onChange={() => {}}
      >
        <Stack spacing={2.5} mb={3}>
          <Box>
            <Typography sx={fieldLabelSx}>
              {dictionary.signin.form.fields.email.label}
            </Typography>
            <JumboInput
              fullWidth
              fieldName={'email'}
              placeholder={dictionary.signin.form.fields.email.placeholder}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <PersonOutline sx={{ color: palette.text.secondary, fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={fieldSx}
            />
          </Box>

          <Box sx={{ '& .MuiFormControl-root': { width: '100%' } }}>
            <Typography sx={fieldLabelSx}>
              {dictionary.signin.form.fields.password.label}
            </Typography>
            <JumboOutlinedInput
              fieldName={'password'}
              placeholder={dictionary.signin.form.fields.password.placeholder}
              type={values.showPassword ? 'text' : 'password'}
              fullWidth
              margin='none'
              startAdornment={
                <InputAdornment position='start'>
                  <LockOutlined sx={{ color: palette.text.secondary, fontSize: 20 }} />
                </InputAdornment>
              }
              endAdornment={
                <InputAdornment position='end'>
                  <IconButton
                    aria-label={
                      values.showPassword ? 'Hide password' : 'Show password'
                    }
                    onClick={handleClickShowPassword}
                    edge='end'
                    sx={{ color: palette.text.secondary }}
                  >
                    {values.showPassword ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </InputAdornment>
              }
              sx={{
                borderRadius: '10px',
                backgroundColor: palette.background.paper,
                color: palette.text.primary,
                '& fieldset': { borderColor: palette.divider },
                '&:hover fieldset': { borderColor: palette.primary.main },
                '&.Mui-focused fieldset': { borderColor: palette.primary.main, borderWidth: '2px' },
              }}
            />
          </Box>

          <Stack
            direction={'row'}
            justifyContent={'space-between'}
            alignItems={'center'}
            sx={{ px: 0.5 }}
          >
            <JumboCheckbox
              fieldName='rememberMe'
              label={dictionary.signin.form.fields.rememberMe}
              defaultChecked
              sx={{
                color: palette.text.secondary,
                '&.Mui-checked': { color: palette.primary.main },
                '& + .MuiFormControlLabel-label': { color: palette.text.secondary },
              }}
            />
          </Stack>

          <Button
            fullWidth
            type='submit'
            variant='contained'
            size='large'
            disabled={loading || isPending}
            sx={{
              background: `linear-gradient(135deg, ${palette.primary.main} 0%, ${brandLight} 100%)`,
              borderRadius: '10px',
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 700,
              textTransform: 'none',
              boxShadow: `0 4px 15px 0 ${palette.primary.main}66`,
              '&:hover': {
                background: `linear-gradient(135deg, ${brandDark} 0%, ${palette.primary.main} 100%)`,
                boxShadow: `0 6px 20px 0 ${palette.primary.main}80`,
              },
              transition: 'all 0.3s ease',
            }}
          >
            {loading || isPending ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : (
              dictionary.signin.form.submit
            )}
          </Button>
        </Stack>
      </JumboForm>
    </Box>
  );
};

export { LoginForm };
