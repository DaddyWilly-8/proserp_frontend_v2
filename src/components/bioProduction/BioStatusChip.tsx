import React from 'react';
import { Chip } from '@mui/material';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { BioStatus } from './types';

const BioStatusChip = ({ status }: { status: BioStatus }) => {
  const common = useDictionary().bioProduction.common;

  return (
    <Chip
      size='small'
      label={status === 'active' ? common.active : common.inactive}
      color={status === 'active' ? 'success' : 'default'}
      variant='outlined'
    />
  );
};

export default BioStatusChip;
