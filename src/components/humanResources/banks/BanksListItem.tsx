'use client';

import { Divider, Grid, Tooltip, Typography } from '@mui/material';
import { BankType } from './BankType';
import BankItemAction from './BankItemAction';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const BanksListItem = ({ bank }: { bank: BankType }) => {
  const dictionary = useDictionary();
  return (
    <>
      <Divider />
      <Grid
        mt={1}
        mb={1}
        sx={{
          cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' },
        }}
        paddingLeft={2}
        paddingRight={2}
        columnSpacing={1}
        alignItems={'center'}
        container
      >
        <Grid size={{ xs: 12, md: 4 }}>
          <Tooltip title={dictionary.tooltips.bankName}>
            <Typography variant='h6' fontSize={14} lineHeight={1.25} mb={0} noWrap>
              {bank.name}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Tooltip title={dictionary.tooltips.shortName}>
            <Typography>{bank.short_name || '-'}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Tooltip title={dictionary.tooltips.swiftCode}>
            <Typography>{bank.swift_code || '-'}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 1, md: 1 }} textAlign={'end'}>
          <BankItemAction bank={bank} />
        </Grid>
      </Grid>
    </>
  );
};

export default BanksListItem;
