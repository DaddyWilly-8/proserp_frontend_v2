'use client';

import { Box, Skeleton, Stack } from '@mui/material';
import React from 'react';

// Used as the Next.js route-level `loading.tsx` fallback for page
// navigations. Unlike BackdropSpinner (a full-screen dark overlay meant for
// dialogs/form submissions), this only fills the content slot - the
// header/sidebar/footer are part of the persistent layout and are already
// rendered and stable during a route transition, so there's no reason to
// hide them behind a backdrop on every single page change.
//
// The shape here (title bar, toolbar, list rows) approximates the dominant
// page layout across the app (JumboListToolbar + JumboRqList). It won't be
// a pixel-perfect match for every page (e.g. the dashboard's card grid),
// but it reads as "this page is loading" instead of blacking out the whole
// viewport, and avoids a jarring swap to very differently-shaped content.
export default function PageLoadingSkeleton() {
  return (
    <Box sx={{ width: '100%', p: { xs: 1, sm: 0 } }}>
      <Skeleton variant='text' width={220} height={40} sx={{ mb: 2 }} />

      <Stack direction='row' spacing={1.5} sx={{ mb: 3 }}>
        <Skeleton
          variant='rounded'
          height={40}
          sx={{ width: '100%', maxWidth: 320 }}
        />
        <Skeleton variant='rounded' width={110} height={40} />
      </Stack>

      <Stack spacing={1.5}>
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} variant='rounded' width='100%' height={64} />
        ))}
      </Stack>
    </Box>
  );
}
