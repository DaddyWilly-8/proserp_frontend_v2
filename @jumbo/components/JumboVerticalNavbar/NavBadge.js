'use client';

import React from 'react';
import { Chip } from '@mui/material';

// Pending-count pill shown on a menu item (e.g. approvals awaiting the user).
const NavBadge = ({ count, dot = false }) => {
  if (!count || count <= 0) return null;

  if (dot) {
    return (
      <span
        aria-label={`${count} pending`}
        style={{
          position: 'absolute', top: 4, right: 4, width: 8, height: 8,
          borderRadius: '50%', backgroundColor: '#d32f2f',
        }}
      />
    );
  }

  return (
    <Chip
      size="small"
      color="error"
      label={count > 99 ? '99+' : count}
      sx={{ height: 18, ml: 1, fontSize: '0.65rem', '& .MuiChip-label': { px: 0.75 } }}
    />
  );
};

export default NavBadge;
