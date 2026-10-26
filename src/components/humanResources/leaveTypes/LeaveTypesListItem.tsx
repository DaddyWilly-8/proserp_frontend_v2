'use client';

import { Divider, Grid, Tooltip, Typography } from '@mui/material';
import LeaveTypeItemAction from './LeaveTypeItemAction';
import { LeaveType } from './LeaveTypesType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const LeaveTypesListItem = ({ leaveType }: { leaveType: LeaveType }) => {
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
        <Grid size={{ xs: 6, md: 8 }}>
          <Tooltip title={dictionary.tooltips.leaveTypeName}>
            <Typography
              variant='h5'
              fontSize={14}
              lineHeight={1.25}
              mb={0}
              noWrap
            >
              {leaveType.name}
            </Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 5, md: 2 }}>
          <Tooltip title={dictionary.tooltips.daysPerYear}>
            <Typography>{leaveType.days_per_year}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 1, md: 2 }} textAlign={'end'}>
          <LeaveTypeItemAction leaveType={leaveType} />
        </Grid>
      </Grid>
    </>
  );
};

export default LeaveTypesListItem;
