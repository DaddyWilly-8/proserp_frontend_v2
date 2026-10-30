import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { Box, Chip, Grid, Tooltip, Typography } from '@mui/material';
import { useContext } from 'react';
import { StationFormContext } from './SalesShifts';
import SalesShiftsItemAction from './SalesShiftsItemAction';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const SalesShiftsListItem = ({ ClosedShift }) => {
  const dictionary = useDictionary();
  const { activeStation } = useContext(StationFormContext);
  const { shifts } = activeStation;

  return (
    <Grid
      container
      columnSpacing={2}
      alignItems={'center'}
      sx={{
        cursor: 'pointer',
        borderTop: 1,
        borderColor: 'divider',
        '&:hover': {
          bgcolor: 'action.hover',
        },
        paddingTop: 2,
        paddingLeft: 3,
        paddingRight: 2,
      }}
    >
      <Grid size={{ xs: 6, md: 3 }}>
        <Tooltip title={dictionary.tooltips.shiftStart}>
          <Typography>{readableDate(ClosedShift.shift_start, true)}</Typography>
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 6, md: 3 }}>
        <Tooltip title={dictionary.tooltips.shiftEnd}>
          <Typography fontWeight={'bold'}>
            {readableDate(ClosedShift.shift_end, true)}
          </Typography>
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 6, md: 2 }}>
        <Tooltip title={dictionary.tooltips.shiftTeam}>
          <Typography>
            {
              shifts?.find(
                (team) => team.id === ClosedShift.sales_outlet_shift_id
              )?.name
            }
          </Typography>
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 6, md: 2 }}>
        <Tooltip title={dictionary.tooltips.shiftNo}>
          <Typography fontWeight={'bold'}>{ClosedShift.shiftNo}</Typography>
        </Tooltip>
      </Grid>

      <Grid size={{ xs: 6, md: 1 }}>
        <Tooltip title={dictionary.tooltips.status}>
          <Chip
            size='small'
            label={ClosedShift.status}
            color={ClosedShift.status === 'closed' ? 'success' : 'primary'}
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 6, md: 1 }}>
        <Box display={'flex'} flexDirection={'row'} justifyContent={'flex-end'}>
          <SalesShiftsItemAction ClosedShift={ClosedShift} />
        </Box>
      </Grid>
    </Grid>
  );
};

export default SalesShiftsListItem;
