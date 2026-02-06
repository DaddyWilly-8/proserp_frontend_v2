'use client';

import { ASSET_IMAGES } from '@/utilities/constants/paths';
import { keyframes } from '@emotion/react';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Div } from '@jumbo/shared';
import { Backdrop, Button, Typography } from '@mui/material';
import Image from 'next/image';
import { useEffect, useRef } from 'react';

const spiralRotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { theme } = useJumboTheme();
  const redirected = useRef(false);

  useEffect(() => {
    if (redirected.current) return;
    redirected.current = true;

    try {
      localStorage.removeItem('authData');
      sessionStorage.clear();
    } catch {
    }
  }, []);

  return (
    <Backdrop
      open
      role='alert'
      aria-live='assertive'
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        flexDirection: 'column',
        backgroundColor: 'rgba(0,0,0,0.75)',
        color: '#fff',
        gap: 3,
      }}
    >
      <Div
        sx={{
          position: 'relative',
          width: 150,
          height: 150,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Div
          sx={{
            position: 'absolute',
            width: 140,
            height: 140,
            border: '5px solid transparent',
            borderTopColor: '#2113AD',
            borderRadius: '50%',
            animation: `${spiralRotate} 2s linear infinite`,
            boxShadow: `0 0 10px ${'#2113AD'}80`,
            clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)',
          }}
        />
        <Div
          sx={{
            position: 'absolute',
            width: 120,
            height: 120,
            border: '5px solid transparent',
            borderBottomColor: '#bec5da',
            borderRadius: '50%',
            animation: `${spiralRotate} 2s linear infinite 0.3s`,
            boxShadow: `0 0 10px ${'#bec5da'}80`,
            clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)',
          }}
        />
        <Div
          sx={{
            position: 'absolute',
            width: 100,
            height: 100,
            border: '5px solid transparent',
            borderTopColor: '#FFFFFF',
            borderRadius: '50%',
            animation: `${spiralRotate} 2s linear infinite 0.6s`,
            boxShadow: `0 0 10px ${'#FFFFFF'}80`,
            clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)',
          }}
        />
        <Div
          sx={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 10px ${'#2113AD'}30`,
            zIndex: 1,
          }}
        >
          <Image
            src={
              theme?.type === 'light'
                ? `${ASSET_IMAGES}/logos/proserp-blue.png`
                : `${ASSET_IMAGES}/logos/proserp-white.png`
            }
            alt='ProsERP'
            width={85}
            height={85}
            style={{ objectFit: 'contain' }}
            unoptimized
          />
        </Div>
      </Div>

      <Typography variant='h6' textAlign='center'>
        Something went wrong
      </Typography>

      <Typography
        variant='body2'
        textAlign='center'
        sx={{ opacity: 0.75, maxWidth: 360 }}
      >
        We ran into an unexpected problem. You can try again or return to the
        sign-in page.
      </Typography>

      <Div sx={{ display: 'flex', gap: 2 }}>
        <Button variant='contained' color='primary' onClick={() => reset()}>
          Try Again
        </Button>

        <Button
          variant='outlined'
          color='inherit'
          onClick={() => {
            window.location.href = '/auth/signin';
          }}
        >
          Sign In
        </Button>
      </Div>
    </Backdrop>
  );
}
