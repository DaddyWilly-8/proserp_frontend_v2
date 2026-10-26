'use client';

import { Divider, Grid, Tooltip, Typography } from '@mui/material';
import dayjs from 'dayjs';
import EmployeeEmployerContributionItemAction from './EmployeeEmployerContributionItemAction';
import { EmployeeEmployerContributionType } from './EmployeeEmployerContributionType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const EmployeeEmployerContributionsListItem = ({
  employeeEmployerContribution,
}: {
  employeeEmployerContribution: EmployeeEmployerContributionType;
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
          <Tooltip title={dictionary.tooltips.contributionType}>
            <Typography>
              {employeeEmployerContribution.contribution_type?.name ||
                dictionary.humanResources.employeeEmployerContributions.list.typeFallback.replace(
                  '{id}',
                  String(
                    employeeEmployerContribution.employer_contribution_type_id
                  )
                )}
            </Typography>
          </Tooltip>
          {employeeEmployerContribution.member_no && (
            <Tooltip title={dictionary.tooltips.memberNo}>
              <Typography
                variant='caption'
                color='text.secondary'
                display='block'
              >
                {dictionary.humanResources.employeeEmployerContributions.list.memberNo.replace(
                  '{no}',
                  employeeEmployerContribution.member_no
                )}
              </Typography>
            </Tooltip>
          )}
        </Grid>

        <Grid size={{ xs: 6, md: 2.0 }}>
          <Tooltip title={dictionary.tooltips.value}>
            <Typography>
              {Number(employeeEmployerContribution.value || 0).toLocaleString(
                'en-US'
              )}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 6, md: 2.5 }}>
          <Tooltip title={dictionary.tooltips.effectiveFrom}>
            <Typography>
              {employeeEmployerContribution.effective_from
                ? dayjs(employeeEmployerContribution.effective_from).format(
                    'YYYY-MM-DD'
                  )
                : '-'}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 6, md: 3.5 }}>
          <Tooltip title={dictionary.tooltips.effectiveTo}>
            <Typography>
              {employeeEmployerContribution.effective_to
                ? dayjs(employeeEmployerContribution.effective_to).format(
                    'YYYY-MM-DD'
                  )
                : dictionary.humanResources.employeeEmployerContributions.list.openEnded}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 1.0 }} textAlign={'end'}>
          <EmployeeEmployerContributionItemAction
            employeeEmployerContribution={employeeEmployerContribution}
          />
        </Grid>
      </Grid>
    </>
  );
};

export default EmployeeEmployerContributionsListItem;
