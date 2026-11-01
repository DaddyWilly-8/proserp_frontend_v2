import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Divider, Grid, Tooltip, Typography } from '@mui/material';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { stamp } from '../dateTime';
import BatchStatusChip from './BatchStatusChip';
import { Batch } from './batchTypes';

const BatchListItem = ({ batch }: { batch: Batch }) => {
  const text = useDictionary().bioProduction.batches;
  const { lang } = useParams<{ lang: string }>();

  return (
    <React.Fragment>
      <Divider />
      <Link href={`/${lang}/bioProduction/batches/${batch.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
        <Grid
          container
          mt={1}
          mb={1}
          px={2}
          columnSpacing={1}
          alignItems='center'
          sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
        >
          <Grid size={{ xs: 6, md: 1.5 }}>
            <Tooltip title={text.labels.batchNo}>
              <Typography variant='h5' fontSize={14} lineHeight={1.25} mb={0} noWrap>{batch.batchNo}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <Tooltip title={text.labels.species}>
              <Typography noWrap>{batch.species_template?.name}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{ xs: 12, md: 2.5 }}>
            <Tooltip title={`${text.labels.farm} / ${text.labels.unit}`}>
              <Typography noWrap>{batch.farm?.name} · {batch.production_unit?.name}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{ xs: 6, md: 1.5 }}>
            <Tooltip title={text.labels.stage}>
              <Typography noWrap>{batch.current_stage?.name ?? '—'}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <Tooltip title={text.labels.currentQuantity}>
              <Typography noWrap>{batch.current_quantity.toLocaleString()} / {batch.initial_quantity.toLocaleString()}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{ xs: 6, md: 1.5 }}>
            <Tooltip title={text.labels.startDate}>
              <Typography noWrap>{stamp(batch.start_date)}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{ xs: 6, md: 1 }} textAlign='end'>
            <BatchStatusChip status={batch.status} />
          </Grid>
        </Grid>
      </Link>
    </React.Fragment>
  );
};

export default BatchListItem;
