import React, { useState } from 'react';
import { MonitorHeartOutlined } from '@mui/icons-material';
import { Chip, Divider, Grid, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import BioItemActions from '../BioItemActions';
import { useBioAccess } from '../useBioAccess';
import BioStatusChip from '../BioStatusChip';
import { productionUnitServices } from '../bio-production-services';
import { BioProductionUnit } from '../types';
import { unitOccupancy } from '../unitOccupancy';
import ProductionUnitForm from './ProductionUnitForm';
import UnitEnvironment from './UnitEnvironment';

const ProductionUnitListItem = ({ unit }: { unit: BioProductionUnit }) => {
  const text = useDictionary().bioProduction.productionUnits;
  const access = useBioAccess().master('productionUnits');
  const { held, max, full, names } = unitOccupancy(unit);
  const [showEnvironment, setShowEnvironment] = useState(false);
  const capacity = unit.capacity != null && unit.capacity !== ''
    ? `${Number(unit.capacity).toLocaleString()} ${unit.capacity_unit ?? ''}`.trim()
    : '';

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
            <Typography variant='h5' fontSize={14} lineHeight={1.25} mb={0} noWrap>{unit.name}</Typography>
          </Tooltip>
          {!!unit.suitability?.length && (
            <Tooltip title={text.labels.suitability}>
              <Typography variant='caption' color='text.secondary' display='block' noWrap>
                {unit.suitability.map((entry) => `${entry.species}${entry.stages.length ? ` (${entry.stages.join(', ')})` : ''}`).join(' · ')}
              </Typography>
            </Tooltip>
          )}
        </Grid>
        <Grid size={{ xs: 12, md: 2 }}>
          <Tooltip title={text.labels.farm}>
            <Typography noWrap>{unit.farm?.name}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <Tooltip title={text.labels.type}>
            <Typography>{text.types[unit.type]}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 6, md: 1.5 }}>
          <Tooltip title={text.labels.capacity}>
            <Typography>{capacity}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <Tooltip title={names || text.occupancy.free}>
            <Chip
              size='small'
              variant='outlined'
              color={full ? 'warning' : held > 0 ? 'info' : 'default'}
              label={held === 0 ? text.occupancy.free : max === 1 ? names : text.occupancy.holds.replace('{held}', String(held)).replace('{max}', String(max))}
            />
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 8, md: 1 }}>
          <BioStatusChip status={unit.status} />
        </Grid>
        <Grid size={{ xs: 4, md: 1 }} textAlign='end'>
          <Stack direction='row' justifyContent='flex-end' alignItems='center'>
          <Tooltip title={text.environment.open}>
            <IconButton size='small' onClick={() => setShowEnvironment(true)}><MonitorHeartOutlined fontSize='small' /></IconButton>
          </Tooltip>
          <BioItemActions<BioProductionUnit>
            canEdit={access.edit}
            canDelete={access.delete}
            item={unit}
            queryKey='bioProductionUnits'
            deleteService={productionUnitServices.delete}
            deleteContent={text.messages.deleteContent}
            Form={ProductionUnitForm}
          />
          </Stack>
        </Grid>
      </Grid>
      <UnitEnvironment unit={unit} open={showEnvironment} onClose={() => setShowEnvironment(false)} />
    </React.Fragment>
  );
};

export default ProductionUnitListItem;
