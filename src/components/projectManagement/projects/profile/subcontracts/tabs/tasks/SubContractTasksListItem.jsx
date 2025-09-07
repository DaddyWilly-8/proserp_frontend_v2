import { Alert, Grid, LinearProgress, ListItemText, Tooltip, Typography } from '@mui/material';
import React from 'react';
import SubContractTaskItemAction from './SubContractTaskItemAction';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';

function SubContractTasksListItem({ subContract, subContractTasks, isLoading }) {
    const baseCurrency = subContract?.currency

    return (
        <>
            <Grid size={{xs: 12}}>
                {
                    isLoading && <LinearProgress/>
                }
                {
                    subContractTasks?.length > 0 ? subContractTasks.map((subContractTask, index) => (
                        <Grid
                            key={index}
                            width={'100%'}
                            sx={{
                                cursor: 'pointer',
                                borderTop: 1,
                                borderColor: 'divider',
                                '&:hover': {
                                    bgcolor: 'action.hover',
                                },
                                padding: 1,
                            }}
                            columnSpacing={2}
                            alignItems={'center'}
                            container
                        >
                            <Grid size={{xs: 12, md: 2.8, lg: 2.8}}>
                                <ListItemText
                                    primary={
                                        <Tooltip title={'Project Task'}>
                                            <Typography variant='h6'>{subContractTask?.project_task?.name}</Typography>
                                        </Tooltip>
                                    }
                                    secondary={
                                        <Tooltip title="Period">
                                            <Typography component="span" fontSize={14} lineHeight={1.5} noWrap>
                                                {`${subContractTask.start_date ? readableDate(subContractTask.start_date) : ''} ${subContractTask.end_date ? '→ ' + readableDate(subContractTask.end_date) : ''}`}
                                            </Typography>
                                        </Tooltip>
                                    }
                                />
                            </Grid>
                            <Grid size={{xs: 12, md: 2.4, lg: 2.4}}>
                                <Tooltip title={'Remarks'}>
                                    <Typography variant='h6'>{subContractTask?.remarks}</Typography>
                                </Tooltip>
                            </Grid>
                            <Grid size={{xs: 6, md: 2, lg: 2}}>
                                <Tooltip title={'Quantity'}>
                                    <Typography sx={{textAlign: {md: 'right'}}} variant='h6' paddingLeft={5}>
                                        {subContractTask?.quantity} {subContractTask.project_task?.measurement_unit?.symbol}
                                    </Typography>
                                </Tooltip>
                            </Grid>
                            <Grid size={{xs: 6, md: 2, lg: 2}}>
                                <Tooltip title={'Rate'}>
                                    <Typography sx={{textAlign: {xs: 'right'}}} variant='h6'>
                                        {subContractTask?.rate?.toLocaleString('en-US', 
                                        {
                                            style: 'currency',
                                            currency: baseCurrency?.code,
                                        })}
                                    </Typography>
                                </Tooltip>
                            </Grid>
                            <Grid size={{xs: 6, md: 2}}>
                                 <Tooltip title={'Amount'}>
                                    <Typography sx={{textAlign: {md: 'right'}}} variant='h6'>
                                        {((subContractTask?.rate || 0) * (subContractTask?.quantity || 0)).toLocaleString('en-US', 
                                        {
                                            style: 'currency',
                                            currency: baseCurrency?.code,
                                        })}
                                    </Typography>
                                </Tooltip>
                            </Grid>
                            <Grid size={{xs: 6, md: 0.8, lg: 0.8}} textAlign={'right'}>
                                <SubContractTaskItemAction subContract={subContract} subContractTasks={subContractTasks} subContractTask={subContractTask}/>
                            </Grid>
                        </Grid>
                    ))
                    :
                        !isLoading && <Alert variant='outlined' color='primary' severity='info'>No SubContract Tasks Found</Alert> 
                }
            </Grid>
        </>
    );
}

export default SubContractTasksListItem;