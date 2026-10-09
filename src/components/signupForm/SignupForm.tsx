'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  TextField,
  IconButton,
  InputAdornment,
  Link,
} from '@mui/material';
import { lighten, darken } from '@mui/material/styles';
import {
  Visibility,
  VisibilityOff,
  PersonOutline,
  EmailOutlined,
  PhoneOutlined,
  LockOutlined,
} from '@mui/icons-material';
import GroupAddOutlined from '@mui/icons-material/GroupAddOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import InsightsOutlined from '@mui/icons-material/InsightsOutlined';
import LoadingButton from '@mui/lab/LoadingButton';
import {
  useForm,
  FormProvider,
  useFormContext,
} from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useSnackbar } from 'notistack';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { ASSET_IMAGES } from '@/utilities/constants/paths';
import { ThemeModeOption } from '@/components/header/themeModeOptions/ThemeModeOption';
import { BackdropSpinner } from '@/shared/ProgressIndicators/BackdropSpinner';
import { validationSchema } from './validation';

type SignupFormValues = {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
};

const FEATURES = [
  {
    icon: ShieldOutlined,
    title: 'All your business, one place',
    description: 'Accounts, procurement, HR, POS and more, unified.',
  },
  {
    icon: GroupAddOutlined,
    title: 'Invite your team',
    description: 'Add teammates and manage access by role.',
  },
  {
    icon: InsightsOutlined,
    title: 'Real-time insights',
    description: 'Dashboards and reports that stay current.',
  },
];

const ConfirmPasswordError = () => {
  const {
    formState: { errors, touchedFields },
  } = useFormContext<SignupFormValues>();

  if (!touchedFields.password_confirmation) return null;
  if (!errors.password_confirmation) return null;

  return (
    <Typography
      variant="body2"
      color="error"
      sx={{ mb: 0.5, fontWeight: 500 }}
    >
      {errors.password_confirmation.message}
    </Typography>
  );
};

const SignupForm = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { signUp, stopAuthLoading } = useJumboAuth();
  const router = useRouter();
  const lang = useLanguage();
  // The app's actual theme (src/themes/main/{default,dark}.ts) - not a
  // custom hardcoded palette, so this page matches whatever the rest of
  // the app looks like once logged in, light or dark.
  const { theme } = useJumboTheme();
  const { palette } = theme;
  const isDark = theme.type === 'dark';

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const methods = useForm<SignupFormValues>({
    resolver: yupResolver(validationSchema),
    mode: 'onChange',
  });

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors, isSubmitting, touchedFields },
  } = methods;

  const password = watch('password');

  useEffect(() => {
    if (touchedFields.password_confirmation) {
      trigger('password_confirmation');
    }
  }, [password, touchedFields.password_confirmation, trigger]);

  const onSubmit = async (data: SignupFormValues) => {
    try {
      await signUp(
        data as any,
        () => {
          router.push(`/${lang}/auth/verifyEmail`);
        },
        (error: any) => {
          stopAuthLoading();
          enqueueSnackbar(
            error?.response?.data?.message ||
              'Signup failed. Please try again.',
            { variant: 'error' }
          );
        }
      );
    } catch (e: any) {
      stopAuthLoading();
      enqueueSnackbar(
        e?.message || 'Signup failed. Please try again.',
        { variant: 'error' }
      );
    }
  };

  const pageBg = palette.background.default;
  const cardShadow = isDark
    ? '0 20px 60px rgba(0,0,0,0.5)'
    : '0 20px 60px rgba(0,0,0,0.1)';
  // The dark theme's own primary.light/dark (#A67FFB/#5E3BB7) are purple,
  // not blue shades - using them for the brand gradient made dark mode
  // look purple instead of ProsERP's blue. Lighten/darken primary.main
  // itself instead, which stays in the blue family in both themes.
  const brandLight = lighten(palette.primary.main, isDark ? 0.45 : 0.3);
  const brandDark = darken(palette.primary.main, 0.3);
  const brandGradient = `linear-gradient(135deg, ${palette.primary.main} 0%, ${brandLight} 100%)`;

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
  };
  const iconSx = { color: palette.text.secondary, fontSize: 20 };

  return (
    <FormProvider {...methods}>
      {isSubmitting && <BackdropSpinner />}
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          overflow: 'auto',
          display: 'flex',
          // Centering a child taller than the viewport (this form, once all
          // fields are visible on a phone) clips its top out of scroll
          // range - only the bottom stays reachable. Top-align on mobile
          // instead so the whole card scrolls into view normally.
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'center',
          backgroundColor: pageBg,
          p: 2,
        }}
      >
        <Card
          sx={{
            width: 960,
            maxWidth: '100%',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            borderRadius: 4,
            overflow: 'hidden',
            border: isDark ? `1px solid ${palette.divider}` : 'none',
            boxShadow: cardShadow,
            backgroundColor: pageBg,
          }}
        >
          {/* LEFT PANEL */}
          <CardContent
            sx={{
              flex: { xs: '0 1 auto', md: 0.55 },
              color: palette.primary.contrastText,
              background: brandGradient,
              display: 'flex',
              flexDirection: 'column',
              gap: { xs: 2, md: 4 },
              p: { xs: 2.5, md: 5 },
              '& .MuiTypography-root': { color: 'inherit' },
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Image
                width={150}
                height={48}
                src={`${ASSET_IMAGES}/logos/proserp-white.png`}
                alt="ProsERP"
                style={{ verticalAlign: 'middle' }}
              />
            </Box>

            <Box>
              <Typography variant="h3" fontWeight={700} sx={{ fontSize: { xs: '1.4rem', md: '2.2rem' } }}>
                Get started
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.85, letterSpacing: 0.5, mt: 0.5 }}>
                Simplified Management and Control
              </Typography>
            </Box>

            {/* Hidden on mobile so the form is reachable without scrolling
                past marketing copy first. */}
            <Stack spacing={2.5} sx={{ display: { xs: 'none', md: 'flex' } }}>
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <Stack direction="row" spacing={1.5} key={title}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1,
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon sx={{ fontSize: 18 }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight={700}>
                      {title}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      {description}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          </CardContent>

          {/* RIGHT PANEL */}
          <CardContent sx={{ flex: 0.6, p: { xs: 3, md: 5 }, backgroundColor: pageBg }}>
            <Stack direction="row" justifyContent="flex-end" alignItems="center" sx={{ mb: 1 }}>
              <ThemeModeOption />
            </Stack>

            <Typography variant="h5" fontWeight={700} sx={{ color: palette.text.primary, mb: 0.5 }}>
              Create your account
            </Typography>
            <Typography variant="body2" sx={{ color: palette.text.secondary, mb: 3 }}>
              Fill in the details below to get started.
            </Typography>

            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <Stack spacing={2.2}>
                <Box>
                  <Typography sx={fieldLabelSx}>Full Name</Typography>
                  <TextField
                    fullWidth
                    placeholder="Jane Doe"
                    {...register('name')}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonOutline sx={iconSx} />
                        </InputAdornment>
                      ),
                    }}
                    sx={fieldSx}
                  />
                </Box>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography sx={fieldLabelSx}>Email Address</Typography>
                    <TextField
                      fullWidth
                      placeholder="you@example.com"
                      {...register('email')}
                      error={!!errors.email}
                      helperText={errors.email?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailOutlined sx={iconSx} />
                          </InputAdornment>
                        ),
                      }}
                      sx={fieldSx}
                    />
                  </Box>

                  <Box>
                    <Typography sx={fieldLabelSx}>Phone Number</Typography>
                    <TextField
                      fullWidth
                      placeholder="+255 ..."
                      {...register('phone')}
                      error={!!errors.phone}
                      helperText={errors.phone?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneOutlined sx={iconSx} />
                          </InputAdornment>
                        ),
                      }}
                      sx={fieldSx}
                    />
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography sx={fieldLabelSx}>Password</Typography>
                    <TextField
                      type={showPassword ? 'text' : 'password'}
                      fullWidth
                      {...register('password')}
                      error={!!errors.password}
                      helperText={errors.password?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockOutlined sx={iconSx} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword((s) => !s)}
                              edge="end"
                              sx={{ color: palette.text.secondary }}
                            >
                              {showPassword ? <Visibility /> : <VisibilityOff />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={fieldSx}
                    />
                  </Box>

                  <Box>
                    <Typography sx={fieldLabelSx}>Confirm Password</Typography>
                    <TextField
                      type={showPasswordConfirm ? 'text' : 'password'}
                      fullWidth
                      {...register('password_confirmation')}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockOutlined sx={iconSx} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPasswordConfirm((s) => !s)}
                              edge="end"
                              sx={{ color: palette.text.secondary }}
                            >
                              {showPasswordConfirm ? (
                                <Visibility />
                              ) : (
                                <VisibilityOff />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={fieldSx}
                    />
                  </Box>
                </Box>

                <ConfirmPasswordError />

                <LoadingButton
                  type="submit"
                  fullWidth
                  size="large"
                  variant="contained"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  sx={{
                    mt: 1,
                    height: 48,
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontWeight: 700,
                    background: brandGradient,
                    boxShadow: `0 4px 15px 0 ${palette.primary.main}66`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${brandDark} 0%, ${palette.primary.main} 100%)`,
                    },
                  }}
                >
                  Create account
                </LoadingButton>
              </Stack>
            </Box>

            <Typography textAlign="center" mt={3} variant="body2" sx={{ color: palette.text.secondary }}>
              Already have an account?{' '}
              <Link href={`/${lang}/auth/signin`} underline="hover" sx={{ color: palette.primary.main }}>
                Sign in
              </Link>
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </FormProvider>
  );
};

export default SignupForm;
