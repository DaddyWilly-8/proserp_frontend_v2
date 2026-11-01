import React from 'react';
import { Chip, Divider, Grid, Stack, Tooltip, Typography } from '@mui/material';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import BioItemActions from '../BioItemActions';
import { useBioAccess } from '../useBioAccess';
import BioStatusChip from '../BioStatusChip';
import { measurementParameterServices } from '../bio-production-services';
import { BioMeasurementParameter } from '../types';
import ParameterForm from './ParameterForm';
import { rangeText } from './rangeText';

const ParameterListItem = ({ parameter }: { parameter: BioMeasurementParameter }) => {
  const dictionary = useDictionary().bioProduction;
  const access = useBioAccess().master('measurementParameters');
  const text = dictionary.measurementParameters;
  const types = dictionary.productionUnits.types;

  return (
    <React.Fragment>
      <Divider />
      <Grid container mt={1} mb={1} px={2} columnSpacing={1} rowSpacing={0.5} alignItems='center' sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Tooltip title={text.labels.name}>
            <Typography variant='h5' fontSize={14} lineHeight={1.25} mb={0} noWrap>
              {parameter.name}
              {parameter.unit_label ? <Typography component='span' color='text.secondary' fontSize={13}> · {parameter.unit_label}</Typography> : null}
            </Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Tooltip title={text.labels.types}>
            <Stack direction='row' spacing={0.5} useFlexGap flexWrap='wrap'>
              {parameter.unit_types?.length ? parameter.unit_types.map((type) => <Chip key={type} size='small' variant='outlined' label={types[type]} />) : <Typography color='text.secondary'>{text.allTypes}</Typography>}
            </Stack>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <Typography variant='caption' color='text.secondary' display='block'>{text.labels.watch}</Typography>
          <Typography color='warning.main'>{rangeText(parameter.watch_min, parameter.watch_max)}</Typography>
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <Typography variant='caption' color='text.secondary' display='block'>{text.labels.critical}</Typography>
          <Typography color='error.main'>{rangeText(parameter.critical_min, parameter.critical_max)}</Typography>
        </Grid>
        <Grid size={{ xs: 8, md: 1 }}>
          <BioStatusChip status={parameter.status} />
        </Grid>
        <Grid size={{ xs: 4, md: 1 }} textAlign='end'>
          <BioItemActions<BioMeasurementParameter>
            canEdit={access.edit}
            canDelete={access.delete}
            item={parameter}
            queryKey='bioMeasurementParameters'
            deleteService={measurementParameterServices.delete}
            deleteContent={text.messages.deleteContent}
            Form={ParameterForm}
          />
        </Grid>
      </Grid>
    </React.Fragment>
  );
};

export default ParameterListItem;
