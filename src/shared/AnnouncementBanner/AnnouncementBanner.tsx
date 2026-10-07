'use client';

import { useEffect, useState } from 'react';
import { Box, Typography, alpha } from '@mui/material';
import { keyframes } from '@mui/material/styles';
import CelebrationIcon from '@mui/icons-material/CelebrationOutlined';
import dayjs from 'dayjs';

const pulseOnce = keyframes`
  0% { transform: scale(0.85); opacity: 0.6; }
  60% { transform: scale(1.08); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`;

export interface AnnouncementBannerProps {
  /** Stable key, kept for consumers that still pass it (unused internally
   * now that the banner can't be dismissed - date range alone decides
   * whether it shows). */
  id: string;
  message: React.ReactNode;
  /** ISO date (YYYY-MM-DD); banner shows from the start of this day. */
  startDate: string;
  /** ISO date (YYYY-MM-DD); banner shows through the end of this day. */
  endDate: string;
}

export function AnnouncementBanner({
  message,
  startDate,
  endDate,
}: AnnouncementBannerProps) {
  const [visible, setVisible] = useState(false); // default hidden until checked client-side

  useEffect(() => {
    const inRange =
      dayjs().isAfter(dayjs(startDate).startOf('day')) &&
      dayjs().isBefore(dayjs(endDate).endOf('day'));
    setVisible(inRange);
  }, [startDate, endDate]);

  if (!visible) return null;

  return (
    <Box
      sx={(theme) => ({
        my: 1,
        p: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        borderRadius: 1.5,
        borderLeft: `4px solid ${theme.palette.primary.main}`,
        backgroundColor: alpha(theme.palette.primary.main, 0.08),
      })}
    >
      <Box
        sx={(theme) => ({
          width: 36,
          height: 36,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          backgroundColor: alpha(theme.palette.primary.main, 0.15),
          animation: `${pulseOnce} 0.5s ease-out`,
        })}
      >
        <CelebrationIcon color='primary' sx={{ fontSize: 20 }} />
      </Box>

      <Typography variant='body2' color='text.primary' sx={{ lineHeight: 1.5 }}>
        {message}
      </Typography>
    </Box>
  );
}
