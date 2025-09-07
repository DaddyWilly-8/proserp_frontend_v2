import { yupResolver } from '@hookform/resolvers/yup';
import { Autocomplete, Button, Grid, IconButton, InputAdornment, LinearProgress, TextField, Tooltip } from '@mui/material';
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form';
import * as yup  from "yup";
import { useProjectProfile } from '../../../ProjectProfileProvider';
import dayjs from 'dayjs';
import { DateTimePicker } from '@mui/x-date-pickers';
import { AddOutlined, CheckOutlined, DisabledByDefault } from '@mui/icons-material';
import { useUpdateFormContext } from '../../UpdatesForm';
import projectsServices from '@/components/projectManagement/projects/project-services';
import { Div } from '@jumbo/shared';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';

function TaskProgress({taskProgressItem = null, index = -1, setShowForm = null}) {
    const { taskProgressItems, setTaskProgressItems } = useUpdateFormContext();
    const [isAdding, setIsAdding] = useState(false);
    const [isRetrievingDetails, setIsRetrievingDetails] = useState(false);
    const [unitToDisplay, setUnitToDisplay] = useState(taskProgressItem?.unit_symbol);
    const {deliverable_groups, setFetchDeliverables, projectTimelineActivities, setFetchTimelineActivities} = useProjectProfile();

    useEffect(() => {
      if (!deliverable_groups) {
        setFetchDeliverables(true);
      } else {
        setFetchDeliverables(false)
      }
  
      if (!projectTimelineActivities) {
        setFetchTimelineActivities(true);
      } else {
        setFetchTimelineActivities(false)
      }
    }, [projectTimelineActivities, deliverable_groups, setFetchDeliverables, setFetchTimelineActivities]);

    //Define validation Schema
    const validationSchema = yup.object({
      quantity_executed: yup
        .number()
        .required("Quantity is required")
        .typeError('Quantity is required')
        .test(
          'max-quantity',
          function (value) {
            const { unexcuted_task_quantity, task} = this.parent;
            const { taskProgressItems, taskProgressItem } = this.options.context || {};

            const existTaskProgressItems = taskProgressItems.filter((existTaskProgressItem, itemIndex) => {
              return existTaskProgressItem.task?.id === task?.id && itemIndex !== index && !existTaskProgressItem.id;
            });

            const existingQuantity = existTaskProgressItems.reduce((total, existTaskProgressItem) => total + existTaskProgressItem.quantity_executed, 0);

            const remainingQuantity = unexcuted_task_quantity - existingQuantity + (taskProgressItem?.id ? taskProgressItem?.quantity_executed : 0);
            
            if (value > remainingQuantity) {
              return this.createError({
                message: `Quantity should not exceed Project Task Quantity. ${remainingQuantity} remaining.`
              });
            }
            return true;
          }
        ),
    });    

    const {setValue, handleSubmit, watch, reset, register, formState: {errors}} = useForm({
      resolver: yupResolver(validationSchema),
      defaultValues: {
        quantity_executed: taskProgressItem?.quantity_executed, 
        unexcuted_task_quantity: taskProgressItem?.unexcuted_task_quantity,
        project_task_id: taskProgressItem?.project_task_id, 
        task: taskProgressItem?.task,
        execution_date: taskProgressItem ? dayjs(taskProgressItem.execution_date) : dayjs().toISOString(),
        remarks: taskProgressItem?.remarks,
        unit_symbol: taskProgressItem?.unit_symbol,
        material_used: []
      },
      context: { taskProgressItems, taskProgressItem }
    });

    const updateItems = async (taskProgressItem) => {
      setIsAdding(true);
      if (index > -1) {
        // Replace the existing item with the edited item
        let updatedItems = [...taskProgressItems];
        updatedItems[index] = taskProgressItem;
        await setTaskProgressItems(updatedItems);
        setUnitToDisplay(null)
      } else {
        // Add the new item to the items array
        await setTaskProgressItems((taskProgressItems) => [...taskProgressItems, taskProgressItem]);
        setUnitToDisplay(null)
      }

      reset();
      setIsAdding(false);
      setShowForm && setShowForm(false);
    };

    const retrieveTaskDetails = async (taskId) => {
      setIsRetrievingDetails(true);
      const details = await projectsServices.showTaskDetails(taskId);
      setValue('unexcuted_task_quantity', details?.unexecuted_quantity);
      setIsRetrievingDetails(false);
    }

    useEffect(() => {
      if (taskProgressItem?.id) {
        retrieveTaskDetails(taskProgressItem.task.id);
      }
    }, [taskProgressItem])

    const getTaskOptions = (activities, depth = 0) => {
      if (!Array.isArray(activities)) {
        return [];
      }
    
      return activities.flatMap(activity => {
        const { children, tasks } = activity;
    
        const tasksOptions = (tasks || []).map(task => ({
          id: task.id,
          name: task.name,
          handlers: task.handlers,
          dependencies: task.dependencies,
          quantity: task.quantity,
          measurement_unit: task.measurement_unit,
          start_date: dayjs(task.start_date).format('YYYY-MM-DD'),
          end_date: dayjs(task.end_date).format('YYYY-MM-DD'),
          weighted_percentage: task.weighted_percentage,
          project_deliverable_id: task.project_deliverable_id
        }));
    
        const tasksFromgroupChildren = getTaskOptions(children, depth + 1);
    
        return [...tasksOptions, ...tasksFromgroupChildren];
      });
    };
    
    const allTasks = getTaskOptions(projectTimelineActivities);

    useEffect(() => {
      if (watch(`quantity_executed`) > 0) {
        setValue(`quantity_executed`, watch(`quantity_executed`),{
          shouldValidate: true,
          shouldDirty: true
        });
      }
    }, [watch(`unexcuted_task_quantity`), setValue, watch]);

    if(isAdding){
      return <LinearProgress/>
    }

  return (
    <form autoComplete='off' onSubmit={handleSubmit(updateItems)}>
        <Grid container columnSpacing={1} width={'100%'} rowSpacing={1}>
            <Grid size={{xs: 12, md: 4, lg: 2.5}}>
              <Div sx={{mt: 1}}>
                <DateTimePicker
                  fullWidth={true}
                  label="Execution Date"
                  defaultValue={taskProgressItem ? dayjs(taskProgressItem.execution_date) : dayjs()}
                  maxDate={dayjs()}
                  disabled={taskProgressItem && taskProgressItem.material_used?.length > 0}
                  slotProps={{
                  textField : {
                    size: 'small',
                    fullWidth: true,
                    readOnly: true,
                    error: !!errors?.execution_date,
                    helperText: errors?.execution_date?.message
                  }
                  }}
                  onChange={(newValue) => {
                    setValue('execution_date', newValue ? newValue.toISOString() : null,{
                      shouldValidate: true,
                      shouldDirty: true
                    });
                  }}
                />
              </Div>
            </Grid>
            <Grid size={{xs: 12, md: 4}}>
              <Div sx={{ mt: 1 }}>
                <Autocomplete
                  options={allTasks}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  getOptionLabel={(option) => option.name}
                  defaultValue={taskProgressItem?.task}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Project Task"
                      size="small"
                      fullWidth
                      error={!!errors?.project_task_id}
                      helperText={errors?.project_task_id?.message}
                    />
                  )}
                  onChange={(e, newValue) => {
                    if (!!newValue) {
                      setUnitToDisplay(newValue.measurement_unit?.symbol)
                      setValue('task', newValue)
                      setValue('project_task_id', newValue?.id, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });

                      retrieveTaskDetails(newValue.id);
                    } else {
                      setUnitToDisplay(null)
                      setValue('task', null)
                      setValue('unit_symbol', null)
                      setValue('project_task_id', null, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }
                  }}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      {option.name}
                    </li>
                  )}
                />
              </Div>
            </Grid>
            <Grid size={{xs: 12, md: 2}}>
              <Div sx={{ mt: 1 }}>
                {isRetrievingDetails ? (
                  <LinearProgress />
                ) : (
                  <TextField
                  label="Quantity Executed"
                  fullWidth
                  size="small"
                  defaultValue={watch(`quantity_executed`)}
                  InputProps={{
                    inputComponent: CommaSeparatedField,
                    endAdornment: (
                      <InputAdornment position="end">
                        {unitToDisplay}
                      </InputAdornment>
                    ),
                  }}
                  error={!!errors?.quantity_executed}
                  helperText={errors?.quantity_executed?.message}
                  onChange={(e) => {
                    setValue('unit_symbol', unitToDisplay)
                    setValue(`quantity_executed`, e.target.value ? sanitizedNumber(e.target.value) : 0, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
                )}
              </Div>
            </Grid>
            <Grid size={{xs: 12, md: 3.5}}>
              <Div sx={{ mt: 1}}>
                <TextField
                  label="Remarks"
                  size="small"
                  multiline={true}
                  minRows={2}
                  fullWidth
                  {...register('remarks')}
                />
              </Div>
            </Grid>
            <Grid size={12} textAlign={'end'} paddingBottom={0.5}>
              <Button
                variant='contained'
                size='small'
                type='submit'
              >
                {
                  taskProgressItem ? (
                    <><CheckOutlined fontSize='small' /> Done</>
                  ) : (
                    <><AddOutlined fontSize='small' /> Add</>
                  )
                }
              </Button>
              {
                taskProgressItem && 
                <Tooltip title='Close Edit'>
                  <IconButton size='small' 
                    onClick={() => {
                      setShowForm(false);
                    }}
                  >
                    <DisabledByDefault fontSize='small' color='success'/>
                  </IconButton>
                </Tooltip>
              }
            </Grid>
        </Grid>
    </form>
  )
}

export default TaskProgress