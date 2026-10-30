import { DisabledByDefault, EditOutlined } from '@mui/icons-material'
import { Divider, Grid, IconButton, ListItemText, Tooltip, Typography } from '@mui/material'
import React, { useState } from 'react'
import OtherExpensesItemForm from './OtherExpensesItemForm';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

function OtherExpensesItemRow({setClearFormKey, submitMainForm, setSubmitItemForm, submitItemForm, setIsDirty, item, index, otherExpenses=[], setOtherExpenses}) {
    const dictionary = useDictionary();
    const [showForm, setShowForm] = useState(false);

  return (
         <React.Fragment>
            <Divider/>
            { !showForm ? (
                    <Grid container 
                        sx={{
                            cursor: 'pointer',
                            '&:hover': {
                                bgcolor: 'action.hover',
                            }
                        }}
                    >
                        <Grid size={0.5}>
                            {index+1}.
                        </Grid>
                        <Grid size={{xs: 11.5, md: 4.5}}>
                            <ListItemText
                                primary={
                                    <Tooltip title={dictionary.tooltips.expense}>
                                        <Typography variant={"h5"} fontSize={14} lineHeight={1.25} mb={0} noWrap>
                                            {item.ledger?.name}
                                        </Typography>
                                    </Tooltip>
                                }
                                secondary={
                                    <Tooltip title={dictionary.tooltips.remarks}>
                                        <Typography variant={"span"} fontSize={14} lineHeight={1.25} mb={0} >
                                            {item.remarks}
                                        </Typography>
                                    </Tooltip>
                                }
                            />
                        </Grid>
                        <Grid size={{xs: 4, md: 2}}>
                            <Tooltip title={dictionary.tooltips.quantity}>
                                <Typography>{item.quantity.toLocaleString()}</Typography>
                            </Tooltip>
                        </Grid>
                        <Grid size={{xs: 4, md: 2}}>
                            <Tooltip title={dictionary.tooltips.rate}>
                                <Typography>
                                    {
                                        item.rate.toLocaleString('en-US', 
                                        {
                                            style: 'currency',
                                            currency: item.currency?.code,
                                        })
                                    }
                                </Typography>
                            </Tooltip>
                        </Grid>
                        <Grid size={{xs: 4, md: 2}} textAlign={{xs: 'end', md: 'start'}}>
                            <Tooltip title={dictionary.tooltips.amount}>
                                <Typography>{(item.rate * item.quantity)?.toLocaleString('en-US', 
                                    {
                                        style: 'currency',
                                        currency: item.currency?.code,
                                        })
                                    }
                                </Typography>
                            </Tooltip>
                        </Grid>
                        <Grid textAlign={'end'} size={{xs: 12, md: 1}}>
                            { !item.isFetched &&
                                <Tooltip title={dictionary.tooltips.editItem}>
                                    <IconButton size='small' onClick={() => {setShowForm(true)}}>
                                        <EditOutlined fontSize='small'/>
                                    </IconButton>
                                </Tooltip>
                            }
                            <Tooltip title={dictionary.tooltips.removeItem}>
                                <IconButton size='small' 
                                    onClick={() => setOtherExpenses(ledger_item => {
                                        const newItems = [...ledger_item];
                                        newItems.splice(index,1);
                                        return newItems;
                                    })}
                                >
                                    <DisabledByDefault fontSize='small' color='error'/>
                                </IconButton>
                            </Tooltip>
                        </Grid>
                    </Grid>
                ) : (
                    <OtherExpensesItemForm setClearFormKey={setClearFormKey} submitMainForm={submitMainForm} setSubmitItemForm={setSubmitItemForm} submitItemForm={submitItemForm} setIsDirty={setIsDirty} item={item} setShowForm={setShowForm} index={index} otherExpenses={otherExpenses} setOtherExpenses={setOtherExpenses}/>
                )
            }
        </React.Fragment>
  )
}

export default OtherExpensesItemRow