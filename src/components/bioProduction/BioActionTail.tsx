'use client'

import React from 'react';
import { AddOutlined } from '@mui/icons-material';
import { ButtonGroup, IconButton, Tooltip } from '@mui/material';

/** The list's "new" button, in the same outlined button group every other list uses. */
const BioActionTail = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <ButtonGroup variant='outlined' size='small' disableElevation sx={{ '& .MuiButton-root': { px: 1 } }}>
    <Tooltip title={label}>
      <IconButton onClick={onClick}>
        <AddOutlined />
      </IconButton>
    </Tooltip>
  </ButtonGroup>
);

export default BioActionTail;
