'use client'

import React from 'react';
import { Alert, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { batchServices } from '../../bio-production-services';
import { FeedProjectionData } from '../../FeedProjection';
import { fromGrams, normalizeUnit } from '../../weightUnit';
import { Batch } from '../batchTypes';

const num = (value: number, digits = 1) => Number(value).toLocaleString(undefined, { maximumFractionDigits: digits });

/**
 * What the species template's feeding table recommends feeding the batch for a day, from its animals, their weight
 * and the rate for that weight, so whoever feeds has the figure beside the form. Shows nothing when the template
 * has no table or the batch has no weight to work from.
 */
const FeedGuide = ({ batch }: { batch: Batch }) => {
  const t = useDictionary().bioProduction.batches.dialogs.input;
  const { data } = useQuery<FeedProjectionData>({
    queryKey: ['bioFeedGuide', batch.id, batch.current_quantity],
    queryFn: () => batchServices.getFeedProjection(batch.id, { days: 1 }),
    retry: false,
  });

  const plan = data?.batches?.[0];
  if (!data || !plan || data.total_kg <= 0) return null;
  const unit = normalizeUnit(batch.species_template?.weight_unit);
  const feeds = data.feeds.map((feed) => `${num(feed.kg, 2)} kg ${feed.key === 'unassigned' || !feed.name ? '' : feed.name}`.trim()).join(' + ');
  const rate = plan.stages[0]?.rate_pct;

  return (
    <Alert severity='info' sx={{ alignItems: 'center' }}>
      <Typography variant='body2' fontWeight={600}>{t.feedGuide.replace('{feeds}', feeds)}</Typography>
      {rate != null && (
        <Typography variant='caption' display='block'>
          {t.feedGuideBasis.replace('{rate}', num(rate, 2)).replace('{weight}', `${num(fromGrams(plan.weight_now_g, unit), 2)} ${unit}`).replace('{count}', num(Number(batch.current_quantity), 0))}
        </Typography>
      )}
    </Alert>
  );
};

export default FeedGuide;
