'use client'

import React, { useState } from 'react';
import { InfoOutlined } from '@mui/icons-material';
import { ClickAwayListener, IconButton, Tooltip } from '@mui/material';

/** An info icon that shows a longer explanation in a tooltip when it is clicked (or hovered), so forms stay short. */
const InfoHint = ({ text }: { text: string }) => {
  const [open, setOpen] = useState(false);

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <span>
        <Tooltip
          open={open}
          onClose={() => setOpen(false)}
          onOpen={() => setOpen(true)}
          title={text}
          placement='top-end'
          arrow
          disableFocusListener
          slotProps={{ tooltip: { sx: { maxWidth: 'min(320px, calc(100vw - 32px))', fontSize: 13 } } }}
        >
          <IconButton size='small' color='info' aria-label={text} onClick={() => setOpen((current) => !current)}>
            <InfoOutlined fontSize='small' />
          </IconButton>
        </Tooltip>
      </span>
    </ClickAwayListener>
  );
};

export default InfoHint;
