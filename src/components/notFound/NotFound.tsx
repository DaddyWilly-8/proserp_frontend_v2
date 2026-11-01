'use client';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { ThemeModeOption } from '@/components/header/themeModeOptions/ThemeModeOption';
import { Link } from '@/components/nextLink';
import { ASSET_IMAGES } from '@/utilities/constants/paths';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import ExploreOutlined from '@mui/icons-material/ExploreOutlined';
import HomeOutlined from '@mui/icons-material/HomeOutlined';
import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { lighten } from '@mui/material/styles';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';

export const NotFound = () => {
  const lang = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useJumboTheme();
  const { palette } = theme;
  const isDark = theme.type === 'dark';

  const brandLight = lighten(palette.primary.main, isDark ? 0.45 : 0.3);
  const cardShadow = isDark
    ? '0 20px 60px rgba(0,0,0,0.5)'
    : '0 20px 60px rgba(0,0,0,0.1)';

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        overflow: 'auto',
        p: { xs: 2, sm: 3, md: 4 },
        display: 'flex',
        alignItems: { xs: 'flex-start', md: 'center' },
        justifyContent: 'center',
        background: palette.background.default,
      }}
    >
      <Box sx={{ position: 'absolute', top: 12, right: 16 }}>
        <ThemeModeOption />
      </Box>

      <Card
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          borderRadius: 4,
          overflow: 'hidden',
          border: isDark ? `1px solid ${palette.divider}` : 'none',
          boxShadow: cardShadow,
          maxWidth: 920,
          width: '100%',
          mx: 'auto',
          mt: { xs: 5, md: 0 },
          backgroundColor: palette.background.default,
        }}
      >
        {/* Brand panel: the 404 itself is the artwork */}
        <CardContent
          sx={{
            position: 'relative',
            overflow: 'hidden',
            flex: { xs: '0 1 auto', md: '0 1 380px' },
            background: `linear-gradient(135deg, ${palette.primary.main} 0%, ${brandLight} 100%)`,
            color: palette.primary.contrastText,
            p: { xs: 3, md: 5 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: { xs: 2, md: 4 },
            minHeight: { md: 460 },
            '& .MuiTypography-root': { color: 'inherit' },
          }}
        >
          {/* Soft decorative rings */}
          {[220, 340, 460].map((size) => (
            <Box
              key={size}
              sx={{
                position: 'absolute',
                width: size,
                height: size,
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.14)',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
              }}
            />
          ))}

          <Image
            width={150}
            height={48}
            src={`${ASSET_IMAGES}/logos/proserp-white.png`}
            alt='ProsERP'
            style={{ position: 'relative' }}
          />

          <Box sx={{ position: 'relative', textAlign: 'center' }}>
            <Typography
              component='div'
              fontWeight={800}
              aria-hidden
              sx={{
                fontSize: { xs: '5.5rem', md: '8rem' },
                lineHeight: 1,
                letterSpacing: { xs: 4, md: 8 },
                textShadow: '0 8px 30px rgba(0,0,0,0.25)',
              }}
            >
              404
            </Typography>
            <Typography
              variant='overline'
              sx={{ opacity: 0.85, letterSpacing: 4, display: 'block', mt: 1 }}
            >
              Page not found
            </Typography>
          </Box>

          <Typography
            variant='body2'
            sx={{
              position: 'relative',
              opacity: 0.8,
              textAlign: 'center',
              display: { xs: 'none', md: 'block' },
            }}
          >
            Let&apos;s get you back on track.
          </Typography>
        </CardContent>

        {/* Message and actions */}
        <CardContent
          sx={{
            flex: 1,
            p: { xs: 3, md: 6 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 3,
            backgroundColor: palette.background.paper,
          }}
        >
          <Box>
            <Typography
              component='h1'
              variant='h3'
              fontWeight={700}
              sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}
            >
              We can&apos;t find that page
            </Typography>
            <Typography color='text.secondary' sx={{ mt: 1.5 }}>
              The page you&apos;re looking for may have been moved or renamed,
              or the link may be mistyped. Check the address, or head back to
              somewhere familiar.
            </Typography>
          </Box>

          {pathname && (
            <Box
              sx={{
                px: 2,
                py: 1.25,
                borderRadius: 2,
                bgcolor: 'action.hover',
                border: '1px dashed',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                minWidth: 0,
              }}
            >
              <ExploreOutlined fontSize='small' color='primary' />
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{
                  fontFamily: 'monospace',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={pathname}
              >
                {pathname}
              </Typography>
            </Box>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              component={Link}
              href={`/${lang}/dashboard`}
              variant='contained'
              size='large'
              startIcon={<HomeOutlined />}
              sx={{ textDecoration: 'none' }}
            >
              Go to dashboard
            </Button>
            <Button
              variant='outlined'
              size='large'
              startIcon={<ArrowBackOutlined />}
              onClick={() => router.back()}
            >
              Go back
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
