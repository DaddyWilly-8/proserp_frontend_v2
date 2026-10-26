'use client';

import { Divider, Grid, Tooltip, Typography } from '@mui/material';
import dayjs from 'dayjs';
import EmployeeDeductionItemAction from './EmployeeDeductionItemAction';
import { EmployeeDeductionType } from './EmployeeDeductionType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const EmployeeDeductionsListItem = ({
  employeeDeduction,
}: {
  employeeDeduction: EmployeeDeductionType;
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
          <Tooltip title={dictionary.tooltips.deductionType}>
            <Typography>
              {employeeDeduction.deduction_type?.name ||
                dictionary.humanResources.employeeDeductions.list.typeFallback.replace(
                  '{id}',
                  String(employeeDeduction.deduction_type_id)
                )}
            </Typography>
          </Tooltip>
          {employeeDeduction.member_no && (
            <Tooltip title={dictionary.tooltips.memberNo}>
              <Typography
                variant='caption'
                color='text.secondary'
                display='block'
              >
                {dictionary.humanResources.employeeDeductions.list.memberNo.replace(
                  '{no}',
                  employeeDeduction.member_no
                )}
              </Typography>
            </Tooltip>
          )}
        </Grid>

        <Grid size={{ xs: 6, md: 2.0 }}>
          <Tooltip title={dictionary.tooltips.value}>
            <Typography>
              {Number(employeeDeduction.value || 0).toLocaleString('en-US')}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 6, md: 2.5 }}>
          <Tooltip title={dictionary.tooltips.effectiveFrom}>
            <Typography>
              {employeeDeduction.effective_from
                ? dayjs(employeeDeduction.effective_from).format('YYYY-MM-DD')
                : '-'}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 6, md: 3.5 }}>
          <Tooltip title={dictionary.tooltips.effectiveTo}>
            <Typography>
              {employeeDeduction.effective_to
                ? dayjs(employeeDeduction.effective_to).format('YYYY-MM-DD')
                : dictionary.humanResources.employeeDeductions.list.openEnded}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 1.0 }} textAlign={'end'}>
          <EmployeeDeductionItemAction employeeDeduction={employeeDeduction} />
        </Grid>
      </Grid>
    </>
  );
};

export default EmployeeDeductionsListItem;
