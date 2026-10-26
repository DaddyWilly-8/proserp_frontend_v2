'use client';

import { Chip, Divider, Grid, Tooltip, Typography } from '@mui/material';
import { NextOfKinType } from '../../employees/profile/nextOfKins/NextOfKinType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const NextOfKinsListItem = ({ nextOfKin }: { nextOfKin: NextOfKinType }) => {
  const dictionary = useDictionary();
  const t = dictionary.humanResources.myHr.nextOfKin;
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

        <Grid size={{ xs: 12, md: 3 }} textAlign={'right'}>
          {nextOfKin.is_primary ? (
            <Chip
              label={t.primary}
              size='small'
              color='success'
              variant='outlined'
            />
          ) : (
            <Chip label={t.secondary} size='small' variant='outlined' />
          )}
        </Grid>
      </Grid>
    </>
  );
};

export default NextOfKinsListItem;
