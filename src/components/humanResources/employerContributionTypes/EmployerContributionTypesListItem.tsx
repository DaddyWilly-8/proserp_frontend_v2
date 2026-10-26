'use client';

import { Chip, Divider, Grid, Tooltip, Typography } from '@mui/material';
import { EmployerContributionType } from './EmployerContributionType';
import EmployerContributionTypeItemAction from './EmployerContributionTypeItemAction';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const EmployerContributionTypesListItem = ({
  contributionType,
}: {
  contributionType: EmployerContributionType;
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
        rowSpacing={1}
        alignItems={'center'}
        container
      >
        <Grid
          size={{ xs: 6, md: 2.2 }}
        >
          <Tooltip title={dictionary.tooltips.name}>
            <Typography variant='h6' fontSize={14} lineHeight={1.25} mb={0}>
              {contributionType.name}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid
          size={{ xs: 6, md: 1.4 }}
          textAlign={{ xs: 'start', md: 'center' }}
        >
          <Tooltip title={dictionary.tooltips.code}>
            <Typography>{contributionType.code || '-'}</Typography>
          </Tooltip>
        </Grid>

        <Grid
          size={{ xs: 6, md: 1.6 }}
          textAlign={{ xs: 'start', md: 'center' }}
        >
          <Chip
            label={
              contributionType.category === 'statutory'
                ? dictionary.humanResources.employerContributionTypes.list.statutory
                : dictionary.humanResources.employerContributionTypes.list.voluntary
            }
            size='small'
            color={
              contributionType.category === 'statutory' ? 'warning' : 'default'
            }
            variant='outlined'
          />
        </Grid>

        <Grid
          size={{ xs: 6, md: 2.1 }}
          textAlign={{ xs: 'start', md: 'center' }}
        >
          <Tooltip title={dictionary.tooltips.method}>
            <Typography textTransform='capitalize'>
              {dictionary.humanResources.employerContributionTypes.list.computationMethods[
                contributionType.computation_method as keyof typeof dictionary.humanResources.employerContributionTypes.list.computationMethods
              ] ?? contributionType.computation_method.replaceAll('_', ' ')}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid
          size={{ xs: 5, md: 1.2 }}
          textAlign={{ xs: 'start', md: 'center' }}
        >
          <Tooltip title={dictionary.tooltips.defaultValue}>
            <Typography>
              {Number(contributionType.default_value || 0).toLocaleString(
                'en-US'
              )}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid
          size={{ xs: 5, md: 2.5 }}
          textAlign={{ xs: 'start', md: 'center' }}
        >
          <Tooltip title={dictionary.tooltips.description}>
            <Typography noWrap>
              {contributionType.description || '-'}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 2, md: 1.0 }} textAlign={'end'}>
          <EmployerContributionTypeItemAction
            contributionType={contributionType}
          />
        </Grid>
      </Grid>
    </>
  );
};

export default EmployerContributionTypesListItem;
