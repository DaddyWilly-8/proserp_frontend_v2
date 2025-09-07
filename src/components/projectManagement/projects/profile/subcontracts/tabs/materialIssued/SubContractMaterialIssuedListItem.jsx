import { Grid, Tooltip, Typography } from '@mui/material';
import React from 'react';
import SubContractMaterialIssuedItemAction from './form/SubContractMaterialIssuedItemAction';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';

function SubContractMaterialIssuedListItem({ subContractMaterialsUsed }) {
    return (
        <Grid
            sx={{
                cursor: 'pointer',
                borderTop: 1,
                borderColor: 'divider',
                '&:hover': {
                    bgcolor: 'action.hover',
                },
                padding: 1,
            }}
            width={'100%'}
            columnSpacing={2}
            alignItems={'center'}
            container
        >
            <Grid size={{xs: 6, md: 3}}>
                <Tooltip title="Issue No.">
                    <Typography component="span">
                        {subContractMaterialsUsed.issueNo}
                    </Typography>
                </Tooltip>
            </Grid>
            <Grid size={{xs: 6, md: 3}}>
                <Tooltip title={'Issue Date.'}>
                    <Typography variant='h6'>{readableDate(subContractMaterialsUsed?.issue_date, false)}</Typography>
                </Tooltip>
            </Grid>
            <Grid size={{xs: 6, md: 2.5}}>
                <Tooltip title="Reference">
                    <Typography component="span">
                        {subContractMaterialsUsed.reference}
                    </Typography>
                </Tooltip>
            </Grid>
            <Grid size={{xs: 6, md: 2.5}}>
                <Tooltip title="Remarks">
                    <Typography component="span">
                        {subContractMaterialsUsed.remarks}
                    </Typography>
                </Tooltip>
            </Grid>
            <Grid size={{xs: 12, md: 1}} textAlign={'right'}>
                <SubContractMaterialIssuedItemAction SubContractMaterialIssued={subContractMaterialsUsed}/>
            </Grid>
        </Grid>
    );
}

export default SubContractMaterialIssuedListItem;
