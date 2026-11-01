import React from 'react';
import { Divider, Grid, Tooltip, Typography } from '@mui/material';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import BioItemActions from '../BioItemActions';
import { useBioAccess } from '../useBioAccess';
import BioStatusChip from '../BioStatusChip';
import { speciesTemplateServices } from '../bio-production-services';
import { BioSpeciesTemplate } from '../types';
import SpeciesTemplateForm from './SpeciesTemplateForm';

const SpeciesTemplateListItem = ({ template }: { template: BioSpeciesTemplate }) => {
  const text = useDictionary().bioProduction.speciesTemplates;
  const access = useBioAccess().master('speciesTemplates');

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
        <Grid size={{ xs: 12, md: 4 }}>
          <Tooltip title={text.labels.name}>
            <Typography variant='h5' fontSize={14} lineHeight={1.25} mb={0} noWrap>{template.name}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Tooltip title={text.labels.trackingMode}>
            <Typography noWrap>{text.trackingModes[template.tracking_mode]}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 6, md: 2.5 }}>
          <Typography>{text.labels.stageCount.replace('{count}', String(template.stages_count ?? 0))}</Typography>
        </Grid>
        <Grid size={{ xs: 4, md: 1.5 }}>
          <BioStatusChip status={template.status} />
        </Grid>
        <Grid size={{ xs: 2, md: 1 }} textAlign='end'>
          <BioItemActions<BioSpeciesTemplate>
            canEdit={access.edit}
            canDelete={access.delete}
            item={template}
            queryKey='bioSpeciesTemplates'
            deleteService={speciesTemplateServices.delete}
            deleteContent={text.messages.deleteContent}
            Form={SpeciesTemplateForm}
          />
        </Grid>
      </Grid>
    </React.Fragment>
  );
};

export default SpeciesTemplateListItem;
