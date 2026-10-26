'use client';

import EmployeeAllowanceItemAction from '@/components/humanResources/employees/profile/employeeAllowances/EmployeeAllowanceItemAction';
import { Divider, Grid, Tooltip, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { EmployeeAllowanceType } from './EmployeeAllowanceType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const EmployeeAllowancesListItem = ({
  employeeAllowance,
}: {
  employeeAllowance: EmployeeAllowanceType;
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
        <Grid size={{ xs: 6, md: 3.0 }}>
          <Tooltip title={dictionary.tooltips.allowanceType}>
            <Typography>
              {employeeAllowance.allowance_type?.name ||
                dictionary.humanResources.employeeAllowances.list.typeFallback.replace(
                  '{id}',
                  String(employeeAllowance.allowance_type_id)
                )}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 6, md: 2.0 }}>
          <Tooltip title={dictionary.tooltips.amount}>
            <Typography>{employeeAllowance.amount.toLocaleString()}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 6, md: 2.5 }}>
          <Tooltip title={dictionary.tooltips.effectiveFrom}>
            <Typography>
              {employeeAllowance.effective_from
                ? dayjs(employeeAllowance.effective_from).format('YYYY-MM-DD')
                : '-'}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 6, md: 3.5 }}>
          <Tooltip title={dictionary.tooltips.effectiveTo}>
            <Typography>
              {employeeAllowance.effective_to
                ? dayjs(employeeAllowance.effective_to).format('YYYY-MM-DD')
                : dictionary.humanResources.employeeAllowances.list.openEnded}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 1.0 }} textAlign={'end'}>
          <EmployeeAllowanceItemAction employeeAllowance={employeeAllowance} />
        </Grid>
      </Grid>
    </>
  );
};

export default EmployeeAllowancesListItem;
