'use client';

import { Chip, Divider, Grid, Tooltip, Typography } from '@mui/material';
import { AllowanceType } from './AllowanceType';
import AllowanceTypeItemAction from './AllowanceTypeItemAction';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const AllowanceTypesListItem = ({
  allowanceType,
}: {
  allowanceType: AllowanceType;
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
        <Grid size={{ xs: 6, md: 2.5 }}>
          <Tooltip title={dictionary.tooltips.name}>
            <Typography variant='h6' fontSize={14} lineHeight={1.25} mb={0}>
              {allowanceType.name}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 6, md: 2 }}>
          <Tooltip title={dictionary.tooltips.code}>
            <Typography>{allowanceType.code || '-'}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 5, md: 2 }}>
          {allowanceType.is_taxable ? (
            <Chip
              label={dictionary.humanResources.allowanceTypes.list.taxable}
              size='small'
              color='warning'
              variant='outlined'
            />
          ) : (
            <Chip
              label={dictionary.humanResources.allowanceTypes.list.nonTaxable}
              size='small'
              color='success'
              variant='outlined'
            />
          )}
        </Grid>

        <Grid
          size={{ xs: 5, md: 1.5 }}
          textAlign={{ xs: 'start', md: 'center' }}
        >
          <Tooltip title={dictionary.tooltips.defaultValue}>
            <Typography>
              {Number(allowanceType.default_value || 0).toLocaleString(
                'en-US'
              )}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 5, md: 3 }}>
          <Tooltip title={dictionary.tooltips.description}>
            <Typography noWrap>{allowanceType.description || '-'}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 2, md: 1 }} textAlign={'end'}>
          <AllowanceTypeItemAction allowanceType={allowanceType} />
        </Grid>
      </Grid>
    </>
  );
};

export default AllowanceTypesListItem;
