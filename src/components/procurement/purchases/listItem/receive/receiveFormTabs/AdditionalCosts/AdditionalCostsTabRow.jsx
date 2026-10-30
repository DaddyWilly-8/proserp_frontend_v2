import { DisabledByDefault, EditOutlined } from '@mui/icons-material';
import { Divider, Grid, IconButton, Tooltip, Typography } from '@mui/material';
import React, { useState } from 'react';
import AdditionalCostsTab from './AdditionalCostsTab';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

function AdditionalCostsTabRow({
  additionalCost,
  setIsDirty,
  registerSubmit,
  index,
  additionalCosts = [],
  setAdditionalCosts,
}) {
  const dictionary = useDictionary();
  const [showForm, setShowForm] = useState(false);

  return (
    <React.Fragment>
      <Divider />
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
          <Grid size={{ xs: 1, md: 0.5 }}>{index + 1}.</Grid>
          <Grid size={{ xs: 7, md: 2.5 }}>
            <Tooltip title={dictionary.tooltips.costName}>
              <Typography>
                {additionalCost.credit_ledger_name || additionalCost.name}
              </Typography>
            </Tooltip>
            {additionalCost.owed_to_supplier === false ? (
              <Typography variant='caption' color='text.secondary' display='block'>
                (Not owed to supplier)
              </Typography>
            ) : (
              additionalCost.vat_exempted && (
                <Typography variant='caption' color='text.secondary' display='block'>
                  (VAT Exempt)
                </Typography>
              )
            )}
          </Grid>
          <Grid
            size={{ xs: 4, md: 2 }}
            textAlign={{ xs: 'right', md: 'start' }}
          >
            <Tooltip title={dictionary.tooltips.reference}>
              <Typography>{additionalCost.reference}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Tooltip title={dictionary.tooltips.currency}>
              <Typography>
                {additionalCost.currency_name || additionalCost.currency?.name}
              </Typography>
            </Tooltip>
          </Grid>
          <Grid size={{ xs: 6, md: 1.5 }} textAlign={'right'}>
            <Tooltip title={dictionary.tooltips.exchangeRate}>
              <Typography>
                {parseFloat(additionalCost.exchange_rate).toLocaleString(
                  'en-US',
                  { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                )}
              </Typography>
            </Tooltip>
          </Grid>
          <Grid size={{ xs: 6, md: 1.5 }} textAlign={{ md: 'right' }}>
            <Tooltip title={dictionary.tooltips.amount}>
              <Typography>
                {parseFloat(additionalCost.amount ?? 0).toLocaleString(
                  'en-US',
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </Typography>
            </Tooltip>
          </Grid>
          <Grid textAlign={'end'} size={{ xs: 6, md: 1 }}>
            <Tooltip title={dictionary.tooltips.editAdditionalCost}>
              <IconButton
                size='small'
                onClick={() => {
                  setShowForm(true);
                }}
              >
                <EditOutlined fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title={dictionary.tooltips.removeAdditionalCost}>
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
        <AdditionalCostsTab
          additionalCost={additionalCost}
          setIsDirty={setIsDirty}
          registerSubmit={registerSubmit}
          setShowForm={setShowForm}
          index={index}
          additionalCosts={additionalCosts}
          setAdditionalCosts={setAdditionalCosts}
        />
      )}
    </React.Fragment>
  );
}

export default AdditionalCostsTabRow;
