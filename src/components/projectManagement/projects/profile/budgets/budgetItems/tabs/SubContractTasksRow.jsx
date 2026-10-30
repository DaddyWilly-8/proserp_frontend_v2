import { DisabledByDefault, EditOutlined } from '@mui/icons-material'
import { Divider, Grid, IconButton, ListItemText, Tooltip, Typography } from '@mui/material'
import React, { useState } from 'react'
import SubContractTasksTab from './SubContractTasksTab';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

function SubContractTasksRow({ 
  subContractItem,
  index,
  subContractItems,
  setSubContractItems,
  submitMainForm,
  setSubmitItemForm,
  submitItemForm,
  setIsDirty,
  allTasks,
  selectedCostCenter
}) {
  const dictionary = useDictionary();
  const [showForm, setShowForm] = useState(false);

  const handleDelete = () => {
    setSubContractItems((prevItems) => {
      const nextItems = [...prevItems];
      nextItems.splice(index, 1);
      return nextItems;
    });
  };

  const formatTaskLabel = (task) => {
    if (!task) return '';
    const code = String(task.code || '').trim();
    const name = String(task.name || task.label || '').trim();

    if (code && name) {
      return `${code} - ${name}`;
    }

    return name;
  };

  return (
    <React.Fragment>
      <Divider/>
      {!showForm ? (
        <Grid container 
          width={'100%'}
          sx={{
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'action.hover',
            }
          }}
        >
          <Grid size={{xs: 1, md: 0.5}}>
            {index+1}.
          </Grid>
          <Grid size={{xs: 11, md: 3}}>
            <ListItemText
              primary={
                <Tooltip title={dictionary.tooltips.taskName2}>
                  <Typography component="span">{formatTaskLabel(subContractItem.project_task)}</Typography>
                </Tooltip>
              }
              secondary={
                <Tooltip title={dictionary.tooltips.description}>
                  <Typography component="span">{subContractItem.description}</Typography>
                </Tooltip>
              }
            />
          </Grid>
          <Grid size={{xs: 9, md: 2.5}}>
            <Tooltip title={dictionary.tooltips.expenseName2}>
              <Typography>{subContractItem.expense_ledger?.name}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{xs: 3, md: 1.5}} textAlign={{md: 'right'}}>
            <Tooltip title={dictionary.tooltips.quantity}>
              <Typography>{subContractItem.quantity.toLocaleString()} {subContractItem.project_task?.measurement_unit?.symbol}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{xs: 5.5, md: 1.5}} textAlign={{md: 'right'}}>
            <Tooltip title={dictionary.tooltips.rate}>
              <span>
                <Typography>{subContractItem.rate.toLocaleString('en-US', 
                  {
                    style: 'currency',
                    currency: subContractItem.currency?.code,
                  })}
                </Typography>
                {Number(subContractItem?.exchange_rate || 1) !== 1 && (
                  <Typography variant='caption' color='text.secondary'>
                    Exch: {Number(subContractItem.exchange_rate).toLocaleString()}
                  </Typography>
                )}
              </span>
            </Tooltip>
          </Grid>
          <Grid size={{xs: 5.5, md: 2}} textAlign={{md: 'right'}}>
            <Tooltip title={dictionary.tooltips.amount}>
              <Typography>{(subContractItem.quantity * subContractItem.rate).toLocaleString('en-US', 
                {
                  style: 'currency',
                  currency: subContractItem.currency?.code,
                })}
              </Typography>
            </Tooltip>
          </Grid>
          <Grid size={{xs: 12, md: 1}} textAlign={'end'}>
            <Tooltip title={dictionary.tooltips.editSubcontractTask}>
              <IconButton size='small' onClick={() => setShowForm(true)}>
                <EditOutlined fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title={dictionary.tooltips.removeSubcontractTask}>
              <IconButton size='small' 
                onClick={() => {
                  handleDelete();
                }}
              >
                <DisabledByDefault fontSize='small' color='error' />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      ) : (
        <SubContractTasksTab
          index={index}
          setShowForm={setShowForm}
          subContractItem={subContractItem}
          subContractItems={subContractItems}
          setSubContractItems={setSubContractItems}
          submitMainForm={submitMainForm}
          setSubmitItemForm={setSubmitItemForm}
          submitItemForm={submitItemForm}
          setIsDirty={setIsDirty}
          allTasks={allTasks}
          selectedCostCenter={selectedCostCenter}
        />
      )}
    </React.Fragment>
  )
}

export default SubContractTasksRow