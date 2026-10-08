'use client';

import { useEffect, useMemo, useState } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { keyframes } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import CelebrationIcon from '@mui/icons-material/CelebrationOutlined';
import dayjs from 'dayjs';

const SPARKLE_COLORS = ['#FFD54F', '#FFFFFF', '#8FB4FF'];
const SPARKLES_PER_CORNER = 4;

const twinkle = keyframes`
  0%, 100% { transform: scale(0.6); opacity: 0; }
  50% { transform: scale(1); opacity: 1; }
`;

interface CornerSparklesProps {
  corner: 'top-left' | 'bottom-right';
}

// Small twinkling dots confined to one corner - a cheap scale/opacity pulse
// (same approach as BackdropSpinner), used as an accent instead of a full
// strip of moving pieces so the banner reads as designed, not busy.
function CornerSparkles({ corner }: CornerSparklesProps) {
  const sparkles = useMemo(
    () =>
      Array.from({ length: SPARKLES_PER_CORNER }, (_, i) => ({
        top: Math.random() * 70,
        left: Math.random() * 70,
        delay: Math.random() * 2,
        duration: 1.4 + Math.random() * 1,
        color: SPARKLE_COLORS[i % SPARKLE_COLORS.length],
        size: 4 + Math.random() * 4,
      })),
    []
  );

  const positionSx =
    corner === 'top-left'
      ? { top: 0, left: 0 }
      : { bottom: 0, right: 0 };

  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        width: 72,
        height: 72,
        pointerEvents: 'none',
        ...positionSx,
      }}
    >
      {sparkles.map((s, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            borderRadius: '50%',
            backgroundColor: s.color,
            animation: `${twinkle} ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </Box>
  );
}

export interface AnnouncementBannerProps {
  /** Stable key for this announcement - used to remember dismissal and to
   * tell one campaign's "dismissed" state apart from the next one's. */
  id: string;
  message: React.ReactNode;
  /** ISO date (YYYY-MM-DD); banner shows from the start of this day. */
  startDate: string;
  /** ISO date (YYYY-MM-DD); banner shows through the end of this day. */
  endDate: string;
}

const DISMISSED_KEY_PREFIX = 'announcement-dismissed:';

export function AnnouncementBanner({
  id,
  message,
  startDate,
  endDate,
}: AnnouncementBannerProps) {
  const [dismissed, setDismissed] = useState(true); // default hidden until checked client-side

  useEffect(() => {
    const inRange =
      dayjs().isAfter(dayjs(startDate).startOf('day')) &&
      dayjs().isBefore(dayjs(endDate).endOf('day'));
    if (!inRange) return;

    try {
      const alreadyDismissed =
        localStorage.getItem(DISMISSED_KEY_PREFIX + id) === 'true';
      setDismissed(alreadyDismissed);
    } catch {
      // localStorage unavailable (private browsing, etc.) - default to showing it
      setDismissed(false);
    }
  }, [id, startDate, endDate]);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY_PREFIX + id, 'true');
    } catch {
      // ignore - worst case it reappears next visit
    }
  };

  if (dismissed) return null;

  return (
    <Box
      sx={{
        my: 1,
        p: 2.5,
        pr: 6,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 3,
        boxShadow: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        background: 'linear-gradient(135deg, #2113AD 0%, #567FFB 100%)',
        color: '#fff',
      }}
    >
      <CornerSparkles corner='top-left' />
      <CornerSparkles corner='bottom-right' />

      <CelebrationIcon
        sx={{ fontSize: 36, flexShrink: 0, position: 'relative', zIndex: 1 }}
      />

      <Typography
        variant='body1'
        sx={{ position: 'relative', zIndex: 1, lineHeight: 1.5 }}
      >
        {message}
      </Typography>

      <IconButton
        size='small'
        onClick={handleDismiss}
        aria-label='Dismiss'
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          color: '#fff',
          zIndex: 1,
        }}
      >
        <CloseIcon fontSize='small' />
      </IconButton>
    </Box>
  );
}
