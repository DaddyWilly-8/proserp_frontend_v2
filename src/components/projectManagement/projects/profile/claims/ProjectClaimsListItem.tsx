import React from 'react';
import { Box, Chip, Divider, Grid, Tooltip, Typography } from '@mui/material';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import ProjectClaimItemAction from './ProjectClaimItemAction';

const ProjectClaimsListItem = ({ claim }) => {
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
        <Grid size={{ xs: 6, md: 3, lg: 3 }}>
          <Tooltip title='Claim Date'>
            <Typography variant="h5" fontSize={14} lineHeight={1.25} mb={0} noWrap>
              {readableDate(claim.claim_date)}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 6, md: 3, lg: 3 }}>
          <Tooltip title='Claim No.'>
            <Typography>{claim.claimNo}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 5, md: 2, lg: 2 }}>
          <Tooltip title='Remarks'>
            <Typography>{claim.remarks}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 7, md: 3, lg: 3 }}>
          <Tooltip title='Amount'>
            <Typography>
                {claim.amount?.toLocaleString('en-US', {
                    style: 'currency',
                    currency: claim?.currency?.code,
                })}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 1, lg: 1 }}>
          <Box display={'flex'} flexDirection={'row'} justifyContent={'flex-end'}>
            <ProjectClaimItemAction claim={claim} />
          </Box>
        </Grid>
      </Grid>
    </>
  );
};

export default ProjectClaimsListItem;
