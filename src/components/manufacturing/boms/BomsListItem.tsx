
import React from 'react';
import {
  Divider,
  Grid,
  Tooltip,
  Typography,
} from '@mui/material';
import { BOM } from './BomType';
import BomsListItemAction from './BomListItemAction';

interface BomsListItemProps {
  bom: BOM;
}

const BomsListItem: React.FC<BomsListItemProps> = ({ bom }) => {
  return (
    <React.Fragment>
      <Divider />
      <Grid
        mt={1}
        mb={1}
        container
        columnSpacing={1}
        alignItems="center"
        sx={{
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
        px={2}
      >
        
          {/* BOM number */}
        <Grid size={{xs: 12, md: 2}}>
          <Tooltip title="BOM Number">
            <Typography variant="subtitle1" fontSize={14} noWrap>
              {bom.bomNo}
            </Typography>
          </Tooltip>
        </Grid>

        {/* Product Name */}
        <Grid size={{xs: 12, md: 6}}>
          <Tooltip title="Main Product">
            <Typography variant="subtitle1" fontSize={14} noWrap>
              {bom.product?.name ?? '—'}
            </Typography>
          </Tooltip>
        </Grid>

        {/* Quantity  */}
        <Grid size={{xs: 12, md: 3}}>
          <Tooltip title="Quantity & Unit">
            <Typography>
              {bom.quantity} {bom.measurement_unit?.symbol ?? "—"}
            </Typography>
          </Tooltip>
        </Grid>
         {/* Actions */}
        <Grid size={{xs: 12, md: 1}}textAlign="end">
          <BomsListItemAction key={bom.id} bom={bom as any} />
        </Grid>
      </Grid>
    </React.Fragment>
  );
};

export default BomsListItem;
