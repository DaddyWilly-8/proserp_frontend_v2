import React from 'react';
import { Divider, Grid, Tooltip, Typography } from '@mui/material';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import BioItemActions from '../BioItemActions';
import BioStatusChip from '../BioStatusChip';
import { unitGroupServices } from '../bio-production-services';
import { useBioAccess } from '../useBioAccess';
import { BioUnitGroup } from '../types';
import UnitGroupForm from './UnitGroupForm';

const UnitGroupListItem = ({ group }: { group: BioUnitGroup }) => {
  const text = useDictionary().bioProduction.unitGroups;
  const access = useBioAccess().master('unitGroups');

  return (
    <React.Fragment>
      <Divider />
      <Grid container mt={1} mb={1} px={2} columnSpacing={1} alignItems='center' sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
        <Grid size={{ xs: 12, md: 4.5 }}>
          <Tooltip title={group.path}>
            <Typography variant='h5' fontSize={14} lineHeight={1.25} mb={0} noWrap sx={{ pl: group.depth * 2.5 }}>
              {group.depth > 0 ? '↳ ' : ''}{group.name}{group.code ? ` (${group.code})` : ''}
            </Typography>
          </Tooltip>
          {group.depth > 0 && (
            <Typography variant='caption' color='text.secondary' display='block' noWrap sx={{ pl: group.depth * 2.5 }}>{group.path}</Typography>
          )}
        </Grid>
        <Grid size={{ xs: 12, md: 2.5 }}>
          <Tooltip title={text.labels.farm}>
            <Typography noWrap>{group.farm?.name}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 6, md: 1.5 }}>
          <Tooltip title={text.labels.units}>
            <Typography>{(group.units_count ?? 0).toLocaleString()} {text.labels.unitsShort}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 6, md: 1.5 }}>
          <Tooltip title={text.labels.groups}>
            <Typography>{(group.children_count ?? 0).toLocaleString()} {text.labels.groupsShort}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 8, md: 1 }}>
          <BioStatusChip status={group.status} />
        </Grid>
        <Grid size={{ xs: 4, md: 1.5 }} textAlign='end'>
          <BioItemActions<BioUnitGroup>
            canEdit={access.edit}
            canDelete={access.delete}
            item={group}
            queryKey='bioUnitGroups'
            deleteService={unitGroupServices.delete}
            deleteContent={text.messages.deleteContent}
            Form={UnitGroupForm}
          />
        </Grid>
      </Grid>
    </React.Fragment>
  );
};

export default UnitGroupListItem;
