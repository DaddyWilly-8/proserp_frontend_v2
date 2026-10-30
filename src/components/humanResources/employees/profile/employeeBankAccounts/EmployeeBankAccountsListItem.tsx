'use client';

import { Chip, Divider, Grid, Tooltip, Typography } from '@mui/material';
import EmployeeBankItemAction from './EmployeeBankItemAction';
import { EmployeeBankAccountType } from './EmployeeBankAccountType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const EmployeeBankAccountsListItem = ({
  account,
}: {
  account: EmployeeBankAccountType;
}) => {
  const dictionary = useDictionary();
  const bankDisplayName =
    account.bank?.short_name
      ? `${account.bank.name} (${account.bank.short_name})`
      : account.bank?.name || account.bank_name || '-';

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
        alignItems={'center'}
        container
      >
        <Grid size={{ xs: 12, md: 4 }}>
          <Tooltip title={dictionary.tooltips.bank}>
            <Typography>{bankDisplayName}</Typography>
          </Tooltip>
          {account.bank_code && (
            <Tooltip title={dictionary.tooltips.bankCode}>
              <Typography variant='caption' color='text.secondary'>
                {dictionary.humanResources.employeeBankAccounts.list.code.replace('{code}', account.bank_code)}
              </Typography>
            </Tooltip>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Tooltip title={dictionary.tooltips.accountName}>
            <Typography noWrap>{account.account_name}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2 }}>
          <Tooltip title={dictionary.tooltips.accountNumber}>
            <Typography>{account.account_number}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 10, md: 2 }}>
          {account.is_primary ? (
            <Chip label={dictionary.humanResources.employeeBankAccounts.list.primary} size='small' color='success' variant='outlined' />
          ) : (
            <Chip label={dictionary.humanResources.employeeBankAccounts.list.secondary} size='small' variant='outlined' />
          )}
        </Grid>

        <Grid size={{ xs: 2, md: 1 }} textAlign={'end'}>
          <EmployeeBankItemAction account={account} />
        </Grid>
      </Grid>
    </>
  );
};

export default EmployeeBankAccountsListItem;