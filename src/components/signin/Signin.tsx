'use client';

import { Link } from '@/components/nextLink';
import { ASSET_IMAGES } from '@/utilities/constants/paths';
import { Card, CardContent, Typography, Box, Stack } from '@mui/material';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import GroupAddOutlined from '@mui/icons-material/GroupAddOutlined';
import InsightsOutlined from '@mui/icons-material/InsightsOutlined';
import Image from 'next/image';
import React from 'react';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { LoginForm } from '../loginForm';
import { ThemeModeOption } from '@/components/header/themeModeOptions/ThemeModeOption';

const FEATURES = [
  {
    icon: ShieldOutlined,
    title: 'All your business, one place',
    description:
      'Accounts, procurement, HR, POS and more - unified in a single, secure workspace.',
  },
  {
    icon: GroupAddOutlined,
    title: 'Multi-organization support',
    description:
      'Switch between organizations instantly without signing out.',
  },
  {
    icon: InsightsOutlined,
    title: 'Real-time insights',
    description:
      'Dashboards and reports that stay current as your business moves.',
  },
];

export const Signin = () => {
  const dictionary = useDictionary();
  const lang = useLanguage();
  const { theme } = useJumboTheme();
  const isDark = theme.type === 'dark';

  const pageBg = isDark ? '#11162a' : '#f5f7fb';
  const cardBg = pageBg;
  const cardBorder = isDark ? '1px solid rgba(255,255,255,0.08)' : 'none';
  const cardShadow = isDark
    ? '0 20px 60px rgba(0,0,0,0.5)'
    : '0 20px 60px rgba(0,0,0,0.1)';
  const heading = isDark ? '#fff' : 'text.primary';
  const subtext = isDark ? 'rgba(255,255,255,0.6)' : 'text.secondary';
  const linkColor = isDark ? '#8FB4FF' : '#2113AD';
  const linkHover = isDark ? '#567FFB' : '#1a0f8a';

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        overflow: 'auto',
        p: { xs: 2, sm: 3, md: 4 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: pageBg,
      }}
    >
      <Card
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          borderRadius: 4,
          overflow: 'hidden',
          border: cardBorder,
          boxShadow: cardShadow,
          maxWidth: 920,
          width: '100%',
          mx: 'auto',
          backgroundColor: cardBg,
        }}
      >
        {/* Left brand panel */}
        <CardContent
          sx={{
            flex: { xs: '0 1 auto', md: '0 1 360px' },
            background: 'linear-gradient(135deg, #2113AD 0%, #567FFB 100%)',
            color: 'common.white',
            p: { xs: 2.5, md: 5 },
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: 2, md: 4 },
            '& .MuiTypography-root': { color: 'inherit' },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Image
              width={150}
              height={48}
              src={`${ASSET_IMAGES}/logos/proserp-white.png`}
              alt='ProsERP'
              style={{ verticalAlign: 'middle' }}
            />
          </Box>

          <Box>
            <Typography variant='h3' fontWeight={700} sx={{ fontSize: { xs: '1.4rem', md: '2.2rem' } }}>
              Welcome
            </Typography>
            <Typography
              variant='body2'
              sx={{ opacity: 0.85, letterSpacing: 0.5, mt: 0.5 }}
            >
              Simplified Management and Control
            </Typography>
          </Box>

          {/* Hidden on mobile so the form is reachable without scrolling
              past marketing copy first. */}
          <Stack spacing={2.5} sx={{ display: { xs: 'none', md: 'flex' } }}>
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <Stack direction='row' spacing={1.5} key={title}>
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
                  <Typography variant='body2' fontWeight={700}>
                    {title}
                  </Typography>
                  <Typography variant='body2' sx={{ opacity: 0.8 }}>
                    {description}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        </CardContent>

        {/* Form panel */}
        <CardContent
          sx={{
            flex: 1,
            p: { xs: 3, md: 5 },
            position: 'relative',
            backgroundColor: cardBg,
          }}
        >
          <Stack
            direction='row'
            justifyContent='flex-end'
            alignItems='center'
            sx={{ mb: 2 }}
          >
            <ThemeModeOption />
          </Stack>

          <Typography variant='h5' fontWeight={700} sx={{ color: heading, mb: 0.5 }}>
            {dictionary.signin.form.title}
          </Typography>
          <Typography variant='body2' sx={{ color: subtext, mb: 3 }}>
            Use your ProsERP account to continue.
          </Typography>

          <LoginForm />

          <Box sx={{ mt: 3 }}>
            <Typography variant='body1' mb={2} align='center'>
              <Link
                underline='none'
                href={`/${lang}/auth/reset-password`}
                sx={{ color: linkColor }}
              >
                {dictionary.signin.forgotPassword.text}
              </Link>
            </Typography>

            <Typography variant='body1' align='center'>
              <Box component='span' sx={{ color: subtext, mr: 1 }}>
                {dictionary.signin.accountPrompt.text}
              </Box>
              <Link
                underline='none'
                href={`/${lang}/auth/signup`}
                sx={{
                  color: linkColor,
                  fontWeight: 600,
                  '&:hover': { color: linkHover },
                }}
              >
                {dictionary.signin.accountPrompt.action}
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
