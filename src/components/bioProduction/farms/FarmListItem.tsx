import React from 'react';
import { Divider, Grid, Tooltip, Typography } from '@mui/material';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import BioItemActions from '../BioItemActions';
import { useBioAccess } from '../useBioAccess';
import BioStatusChip from '../BioStatusChip';
import { farmServices } from '../bio-production-services';
import { BioFarm } from '../types';
import FarmForm from './FarmForm';

const FarmListItem = ({ farm }: { farm: BioFarm }) => {
  const dictionary = useDictionary();
  const access = useBioAccess().master('farms');
  const text = dictionary.bioProduction.farms;

  return (
    <React.Fragment>
      <Divider />
      <Grid
        container
        mt={1}
        mb={1}
        px={2}
        columnSpacing={1}
        alignItems='center'
        sx={{ '&:hover': { bgcolor: 'action.hover' } }}
      >
        <Grid size={{ xs: 12, md: 2.5 }}>
          <Tooltip title={text.labels.name}>
            <Typography variant='h5' fontSize={14} lineHeight={1.25} mb={0} noWrap>{farm.name}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 12, md: 2.5 }}>
          <Tooltip title={text.labels.address}>
            <Typography noWrap>{farm.address}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 12, md: 2.5 }}>
          <Tooltip title={text.labels.costCenter}>
            <Typography noWrap>{farm.cost_center?.name}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 3, md: 1.2 }}>
          <Tooltip title={text.labels.productionUnits}>
            <Typography>{farm.production_units_count ?? 0}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 3, md: 1.3 }}>
          <Tooltip title={(farm.users ?? []).map((user) => user.name).join(', ') || text.labels.users}>
            <Typography>{(farm.users ?? []).length}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 4, md: 1.5 }}>
          <BioStatusChip status={farm.status} />
        </Grid>
        <Grid size={{ xs: 2, md: 0.5 }} textAlign='end'>
          <BioItemActions<BioFarm>
            canEdit={access.edit}
            canDelete={access.delete}
            item={farm}
            queryKey='bioFarms'
            deleteService={farmServices.delete}
            deleteContent={text.messages.deleteContent}
            Form={FarmForm}
          />
        </Grid>
      </Grid>
    </React.Fragment>
  );
};

export default FarmListItem;
