import React from 'react';
import { Divider, Grid, Tooltip, Typography } from '@mui/material';
import { Station } from './StationType';
import StationItemAction from './StationItemAction';

interface StationListItemProps {
  station: Station;
  onClick?: (station: Station) => void;
}

const StationListItem = React.memo(({ station, onClick }: StationListItemProps) => {
  return (
    <>
      <Divider />
      <Grid
        sx={{
          mt: 1,
          mb: 1,
          cursor: onClick ? 'pointer' : 'default',
          '&:hover': {
            bgcolor: onClick ? 'action.hover' : 'transparent',
          },
          pl: 2,
          pr: 2,
        }}
        columnSpacing={1}
        alignItems="center"
        container
        onClick={() => onClick?.(station)}
      >
        <Grid size={{ xs: 12, md: 5 }}>
          <Tooltip title="Station Name">
            <Typography sx={{ fontSize: 14, lineHeight: 1.25, mb: 0 }} noWrap>
              {station.name}
            </Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Tooltip title="Address">
            <Typography>{station.address || '-'}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 12, md: 1 }} textAlign="end">
          <StationItemAction station={station} />
        </Grid>
      </Grid>
    </>
  );
});

export default StationListItem;