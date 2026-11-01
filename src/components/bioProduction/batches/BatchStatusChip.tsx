import React from 'react';
import { Chip } from '@mui/material';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { Batch } from './batchTypes';

const BatchStatusChip = ({ status }: { status: Batch['status'] }) => {
  const text = useDictionary().bioProduction.batches;

  return <Chip size='small' variant='outlined' label={text.status[status]} color={status === 'closed' ? 'default' : 'primary'} />;
};

export default BatchStatusChip;
