import { DisabledByDefault, EditOutlined } from '@mui/icons-material';
import { Chip, Divider, Grid, IconButton, Tooltip, Typography } from '@mui/material';
import React, { useState } from 'react';
import PurchaseOrderAdditionalCostsTab from './PurchaseOrderAdditionalCostsTab';

function PurchaseOrderAdditionalCostsTabRow({
  additionalCost,
  setIsDirty,
  index,
  additionalCosts = [],
  setAdditionalCosts,
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <React.Fragment>
      <Divider sx={{ mt: 2 }} />
      {!showForm ? (
        <Grid
          container
          sx={{
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <Grid size={{ xs: 1, md: 1 }}>{index + 1}.</Grid>
          <Grid size={{ xs: 7, md: 4 }}>
            <Tooltip title='Cost name'>
              <Typography>
                {additionalCost.ledger?.name || additionalCost.ledger_name}
              </Typography>
            </Tooltip>
          </Grid>
          <Grid size={{ xs: 4, md: 3 }} textAlign={{ md: 'start' }}>
            {!!additionalCost.vat_exempted && (
              <Chip label='VAT Exempted' size='small' color='default' />
            )}
          </Grid>
          <Grid size={{ xs: 6, md: 2 }} textAlign={{ md: 'right' }}>
            <Tooltip title='Amount'>
              <Typography>
                {parseFloat(additionalCost.amount)?.toLocaleString('en-US', {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })}
              </Typography>
            </Tooltip>
          </Grid>
          <Grid textAlign={'end'} size={{ xs: 6, md: 2 }}>
            <Tooltip title='Edit Additional Cost'>
              <IconButton
                size='small'
                onClick={() => {
                  setShowForm(true);
                }}
              >
                <EditOutlined fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Remove Additional Cost'>
              <IconButton
                size='small'
                onClick={() =>
                  setAdditionalCosts((additionalCosts) => {
                    const newItems = [...additionalCosts];
                    newItems.splice(index, 1);
                    return newItems;
                  })
                }
              >
                <DisabledByDefault fontSize='small' color='error' />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      ) : (
        <PurchaseOrderAdditionalCostsTab
          additionalCost={additionalCost}
          setIsDirty={setIsDirty}
          setShowForm={setShowForm}
          index={index}
          additionalCosts={additionalCosts}
          setAdditionalCosts={setAdditionalCosts}
        />
      )}
    </React.Fragment>
  );
}

export default PurchaseOrderAdditionalCostsTabRow;
