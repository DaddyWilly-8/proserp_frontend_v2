'use client';

import { Chip, Divider, Grid, Tooltip, Typography } from '@mui/material';
import { OvertimeType } from './OvertimeType';
import OvertimeTypeItemAction from './OvertimeTypeItemAction';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const OvertimeTypesListItem = ({
  overtimeType,
}: {
  overtimeType: OvertimeType;
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
        <Grid size={{ xs: 12, md: 4 }}>
          <Tooltip title={dictionary.tooltips.name}>
            <Typography variant='h6' fontSize={14} lineHeight={1.25} mb={0}>
              {overtimeType.name}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2 }}>
          <Tooltip title={dictionary.tooltips.code}>
            <Typography>{overtimeType.code || '-'}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2 }}>
          <Tooltip title={dictionary.tooltips.multiplier}>
            <Typography>{Number(overtimeType.multiplier).toFixed(2)}x</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2.8 }}>
          {overtimeType.is_taxable ? (
            <Chip label={dictionary.humanResources.overtimeTypes.list.taxable} size='small' color='warning' variant='outlined' />
          ) : (
            <Chip label={dictionary.humanResources.overtimeTypes.list.nonTaxable} size='small' color='success' variant='outlined' />
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 1.2 }} textAlign={'end'}>
          <OvertimeTypeItemAction overtimeType={overtimeType} />
        </Grid>
      </Grid>
    </>
  );
};

export default OvertimeTypesListItem;
