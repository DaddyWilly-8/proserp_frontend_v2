'use client';

import { Chip, Divider, Grid, Tooltip, Typography } from '@mui/material';
import { NextOfKinType } from './NextOfKinType';
import NextOfKinItemAction from './NextOfKinItemAction';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const NextOfKinsListItem = ({
  nextOfKin,
}: {
  nextOfKin: NextOfKinType;
}) => {
  const dictionary = useDictionary();
  return (
    <>
      <Divider />
      <Grid
        mt={1}
        mb={1}
        sx={{
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
        paddingLeft={2}
        paddingRight={2}
        columnSpacing={1}
        alignItems={'center'}
        container
      >
        <Grid size={{ xs: 12, md: 3.5 }}>
          <Tooltip title={dictionary.tooltips.name}>
            <Typography>{nextOfKin.name}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 3.0 }}>
          <Tooltip title={dictionary.tooltips.relationship}>
            <Typography>{nextOfKin.relationship}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2.0 }}>
          <Tooltip title={dictionary.tooltips.phone}>
            <Typography>{nextOfKin.phone || '-'}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 10, md: 2.5 }}>
          {nextOfKin.is_primary ? (
            <Chip label={dictionary.humanResources.nextOfKins.list.primary} size='small' color='success' variant='outlined' />
          ) : (
            <Chip label={dictionary.humanResources.nextOfKins.list.secondary} size='small' variant='outlined' />
          )}
        </Grid>

        <Grid size={{ xs: 2, md: 1 }} textAlign={'end'}>
          <NextOfKinItemAction nextOfKin={nextOfKin} />
        </Grid>
      </Grid>
    </>
  );
};

export default NextOfKinsListItem;
