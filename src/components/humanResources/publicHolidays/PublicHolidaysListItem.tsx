'use client';

import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { Chip, Divider, Grid, Tooltip, Typography } from '@mui/material';
import { PublicHolidaysType } from './PublicHOlidaysType';
import PublicHolidaysItemAction from './PublicHolidaysItemAction';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface PublicHolidaysListItemProps {
  publicHoliday: PublicHolidaysType;
}
const PublicHolidaysListItem = ({
  publicHoliday,
}: PublicHolidaysListItemProps) => {
  const dictionary = useDictionary();
  return (
    <>
      <Divider />
      <Grid
        mt={1}
        mb={1}
        py={1}
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
        <Grid size={{ xs: 12, md: 5 }}>
          <Tooltip title={dictionary.tooltips.holidayName}>
            <Typography
              variant='h5'
              fontSize={14}
              lineHeight={1.25}
              mb={0}
              noWrap
            >
              {publicHoliday.name}
            </Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Tooltip title={dictionary.tooltips.date}>
            <Typography>{readableDate(publicHoliday.date, false)}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Tooltip title={dictionary.tooltips.isPaid}>
            <Chip
              size='small'
              label={
                publicHoliday.is_paid
                  ? dictionary.humanResources.publicHolidays.list.isPaid
                  : dictionary.humanResources.publicHolidays.list.notPaid
              }
              color={publicHoliday.is_paid ? 'primary' : 'default'}
            />
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 1, md: 0.5, lg: 1 }} textAlign={'end'}>
          <PublicHolidaysItemAction publicHoliday={publicHoliday} />
        </Grid>
      </Grid>
    </>
  );
};

export default PublicHolidaysListItem;
