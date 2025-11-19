import React, { useEffect, useState } from 'react';
import { Autocomplete, Divider, Grid, IconButton, InputAdornment, LinearProgress, TextField, Tooltip } from '@mui/material';
import { useForm } from 'react-hook-form';
import { AddOutlined, CheckOutlined, DisabledByDefault } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import * as yup from 'yup';
import dayjs from 'dayjs'
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { useProjectProfile } from '../../../../ProjectProfileProvider';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import projectsServices from '@/components/projectManagement/projects/project-services';

const CertificateItemForm= ({
  setClearFormKey,
  submitMainForm,
  submitItemForm,
  setSubmitItemForm,
  setIsDirty,
  index = -1,
  setShowForm = null,
  item,
  items = [],
  CertificateDate,
  setItems
}) => {
    const { deliverable_groups, setFetchDeliverables, projectTimelineActivities, setFetchTimelineActivities} = useProjectProfile();
    const [isAdding, setIsAdding] = useState(false);
    const [isRetrievingDetails, setIsRetrievingDetails] = useState(false);
    const [unitToDisplay, setUnitToDisplay] = useState(item && item.unit_symbol);

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

    const validationSchema = yup.object({
        project_subcontract_task_id: yup
            .number()
            .required("Project Task is required")
            .typeError("Project Task is required"),

        certified_quantity: yup
            .number()
            .required("Quantity is required")
            .typeError("Quantity is required")

            // RULE 1: certified ≥ previously certified
            .test("min-certified", function (value) {
                const { response_certified_quantity } = this.parent;

                if (response_certified_quantity == null) return true;

                if (value < response_certified_quantity) {
                    return this.createError({
                        message: `Quantity cannot be less than previously certified (${response_certified_quantity})`,
                    });
                }

                return true;
            })

            // RULE 2: certified ≤ executed
            .test("max-executed", function (value) {
                const { response_executed_quantity } = this.parent;

                if (response_executed_quantity == null) return true;

                if (value > response_executed_quantity) {
                    return this.createError({
                        message: `Quantity cannot exceed executed quantity (${response_executed_quantity})`,
                    });
                }

                return true;
            }),
    });

    const { handleSubmit, setValue, formState: { errors, dirtyFields }, watch, reset } = useForm({
        resolver: yupResolver(validationSchema),
        defaultValues: {
            id: item?.id,
            project_subcontract_id: item ? item.project_subcontract_id : item?.id,
            project_subcontract_task_id: item?.project_subcontract_task_id,
            certified_quantity: item?.certified_quantity,
            remarks: item?.remarks,
            task: item?.task,
            response_certified_quantity: item?.response_certified_quantity,
            response_executed_quantity: item?.response_executed_quantity,
            unit_symbol: item && item.unit_symbol,
        },
        context: { item }
    });  

    useEffect(() => {
        setIsDirty(Object.keys(dirtyFields).length > 0);
    }, [dirtyFields, setIsDirty, watch]);

    const updateItems = async (formData) => {
        setIsAdding(true);

        if (index > -1) {
            const updatedItems = [...items];

            updatedItems[index] = {
                ...items[index],
                ...formData 
            };

            await setItems(updatedItems);
            setClearFormKey(prevKey => prevKey + 1);

        } else {
            await setItems(prevItems => [...prevItems, formData]);
            if (submitItemForm) submitMainForm();
            setSubmitItemForm(false);
            setClearFormKey(prevKey => prevKey + 1);
        }

        reset(); // now works
        setIsAdding(false);
        setShowForm && setShowForm(false);
    };

    const retrieveTaskDetails = async (taskId) => {
        setIsRetrievingDetails(true);
        const details =  await projectsServices.showSubcontractTaskDetails(taskId, CertificateDate)
        setValue('response_certified_quantity', details?.certified_quantity);
        setValue('response_executed_quantity', details?.executed_quantity);
        setIsRetrievingDetails(false);
    }

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
        if (submitItemForm) {
            handleSubmit(updateItems, () => {
                setSubmitItemForm(false);
            })();
        }
    }, [submitItemForm]);

    if (isAdding) {
        return <LinearProgress />;
    }

  return (
    <Grid container spacing={1} marginTop={0.5}>
        <Grid size={12}>
            <Divider/>
        </Grid>
        <Grid size={{xs: 12, md: 8}}>
            <Div sx={{ mt: 1 }}>
                <Autocomplete
                    options={allTasks}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    getOptionLabel={(option) => option.name}
                    defaultValue={item?.task}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Project Task"
                            size="small"
                            fullWidth
                            error={!!errors?.project_subcontract_task_id}
                            helperText={errors?.project_subcontract_task_id?.message}
                        />
                    )}
                    onChange={(e, newValue) => {
                        if (!!newValue) {
                        setUnitToDisplay(newValue.measurement_unit?.symbol)
                        setValue('task', newValue)
                        setValue('project_subcontract_task_id', newValue?.id, {
                            shouldValidate: true,
                            shouldDirty: true,
                        });

                        retrieveTaskDetails(newValue.id);
                        } else {
                        setUnitToDisplay(null)
                        setValue('task', null)
                        setValue('unit_symbol', null)
                        setValue('project_subcontract_task_id', null, {
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

        <Grid size={{xs: 12, md: 4}}>
            <Div sx={{ mt: 1 }}>
                {isRetrievingDetails ? (
                    <LinearProgress />
                ) : (
                    <TextField
                        label="Quantity"
                        fullWidth
                        size="small"
                        defaultValue={watch(`certified_quantity`)}
                        InputProps={{
                            inputComponent: CommaSeparatedField,
                            endAdornment: (
                                <InputAdornment position="end">
                                    {unitToDisplay}
                                </InputAdornment>
                            ),
                        }}
                        error={!!errors?.certified_quantity}
                        helperText={errors?.certified_quantity?.message}
                        onChange={(e) => {
                            setValue('unit_symbol', unitToDisplay)
                            setValue(`certified_quantity`, e.target.value ? sanitizedNumber(e.target.value) : 0, {
                                shouldValidate: true,
                                shouldDirty: true,
                            });
                        }}
                    />
                )}
            </Div>
        </Grid>

        <Grid size={{xs: 12}}>
            <Div sx={{ mt: 1 }}>
                <TextField
                    size="small"
                    fullWidth
                    defaultValue={watch('remarks')}
                    label="Remarks"
                    error={!!errors.description}
                    helperText={errors.description?.message}
                    onChange={(e) => {
                        setValue('remarks', e.target.value, {
                            shouldValidate: true,
                            shouldDirty: true
                        });
                    }}
                />
            </Div>
        </Grid>

        <Grid size={12} textAlign={'end'}>
            <LoadingButton
                loading={false}
                variant='contained'
                type='submit'
                size='small'
                onClick={handleSubmit(updateItems)}
                sx={{ marginBottom: 0.5 }}
            >
                {item ? (
                    <><CheckOutlined fontSize='small' /> Done</>
                ) : (
                    <><AddOutlined fontSize='small' /> Add</>
                )}
            </LoadingButton>
            {item && setShowForm && (
                <Tooltip title='Close Edit'>
                    <IconButton size='small' onClick={() => setShowForm(false)}>
                        <DisabledByDefault fontSize='small' color='success' />
                    </IconButton>
                </Tooltip>
            )}
        </Grid>
    </Grid>
  );
};

export default CertificateItemForm;