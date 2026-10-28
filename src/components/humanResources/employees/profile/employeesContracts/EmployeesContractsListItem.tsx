'use client';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { Chip, Divider, Tooltip, Typography } from '@mui/material';
import { Grid } from '@mui/system';
import { ContractType } from './ContractType';
import EmployeesContractsItemAction from './EmployeesContractsItemAction';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const EmployeesContractsListItem = ({
  contract,
}: {
  contract: ContractType;
}) => {
  const dictionary = useDictionary();
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
        <Grid size={{ xs: 6, md: 2.5 }}>
          <Tooltip title={dictionary.tooltips.contractType}>
            <Typography>
              {(dictionary.humanResources.employeesContracts.contractTypes as Record<string, string>)[contract?.contract_type ?? ''] ??
                contract?.contract_type}
            </Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Tooltip title={dictionary.tooltips.startDate}>
            <Typography>
              {contract?.start_date ? readableDate(contract.start_date) : '-'}
            </Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 6, md: 2.5 }}>
          <Tooltip title={dictionary.tooltips.basicSalary}>
            <Typography>
              {contract.basic_salary
                ? contract.basic_salary.toLocaleString('en-US', {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                  })
                : '-'}
            </Typography>
          </Tooltip>
        </Grid>
        <Grid
          size={{ xs: 6, md: 3 }}
          display={`flex`}
          flexDirection={`row`}
          justifyContent={'start'}
        >
          <Tooltip title={dictionary.tooltips.contractStatus}>
            {contract.status === 'active' ? (
              <Chip
                label={dictionary.humanResources.employeesContracts.status[contract.status] ?? contract.status}
                color='success'
                size='small'
                variant='outlined'
              />
            ) : (
              <Chip
                label={(dictionary.humanResources.employeesContracts.status as Record<string, string>)[contract.status] ?? contract.status}
                color='primary'
                size='small'
                variant='outlined'
              />
            )}
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 1 }} textAlign={'end'}>
          <EmployeesContractsItemAction contract={contract} />
        </Grid>
      </Grid>
    </>
  );
};

export default EmployeesContractsListItem;
