import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import MeasurementSelector from '@/components/masters/measurementUnits/MeasurementSelector';
import UsersSelector from '@/components/sharedComponents/UsersSelector';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { AddOutlined, DisabledByDefault } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Autocomplete,
  Button,
  Checkbox,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import * as yup from 'yup';
import projectsServices from '../../../project-services';
import { useProjectProfile } from '../../ProjectProfileProvider';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const TasksForm = ({ setOpenDialog, task, activity }) => {
  const dictionary = useDictionary();
  const t = dictionary.forms.projects.tasks;
  const sh = dictionary.forms.projects.shared;
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const {
    authOrganization: { organization },
  } = useJumboAuth();
  const { deliverable_groups, projectTimelineActivities, project } =
    useProjectProfile();
  const [is_milestone, setIs_milestone] = useState(
    task?.is_milestone === 1 ? true : false
  );
  const [serverError, setServerError] = useState(null);

  const { mutate: addTask, isPending } = useMutation({
    mutationFn: projectsServices.addTask,
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({
        queryKey: ['projectTimelineActivities', project.id],
      });
    },
    onError: (error) => {
      if (error.response) {
        if (error.response.status === 400) {
          setServerError(error.response?.data?.validation_errors);
        } else {
          enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
        }
      }
    },
  });

  const { mutate: EditTask, isPending: isEdit } = useMutation({
    mutationFn: projectsServices.EditTask,
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({
        queryKey: ['projectTimelineActivities', project.id],
      });
    },
    onError: (error) => {
      if (error.response) {
        if (error.response.status === 400) {
          setServerError(error.response?.data?.validation_errors);
        } else {
          enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
        }
      }
    },
  });

  const saveMutation = React.useMemo(() => {
    return task ? EditTask : addTask;
  }, [addTask, EditTask]);

  const getTaskOptions = (activities, depth = 0) => {
    if (!Array.isArray(activities)) {
      return [];
    }

    return activities.flatMap((activity) => {
      const { children, tasks } = activity;

      const tasksOptions = (tasks || []).map((task) => ({
        id: task.id,
        name: task.name,
        handlers: task.handlers,
        dependencies: task.dependencies,
        quantity: task.quantity,
        measurement_unit: task.measurement_unit,
        start_date: dayjs(task.start_date).format('YYYY-MM-DD'),
        end_date: dayjs(task.end_date).format('YYYY-MM-DD'),
        weighted_percentage: task.weighted_percentage,
        project_deliverable_id: task.project_deliverable_id,
      }));

      const groupChildren = getTaskOptions(children, depth + 1);

      return [...tasksOptions, ...groupChildren];
    });
  };

  const allTasks = getTaskOptions(projectTimelineActivities);
  const activityTasks = task
    ? activity?.tasks?.filter((tsk) => tsk.id !== task?.id)
    : activity?.tasks;

  const positionIndexOptions = [
    { name: sh.atTheBeginning, position_index: null, id: null },
    ...activityTasks.map((task) => {
      return {
        name: sh.afterName.replace('{name}', task.name),
        position_index: task.position_index,
      };
    }),
  ];

  const getDeliverablesOptions = (groups, depth = 0) => {
    if (!Array.isArray(groups)) {
      return [];
    }

    return groups.flatMap((group) => {
      const { children, deliverables } = group;

      const deliverableOptions = (deliverables || []).map((deliverable) => ({
        description: deliverable.description,
        id: deliverable.id,
        position_index: deliverable.position_index,
        weighted_percentage: deliverable.weighted_percentage,
        project_deliverable_group_id: deliverable.project_deliverable_group_id,
      }));

      const groupChildren = getDeliverablesOptions(children, depth + 1);

      return [...deliverableOptions, ...groupChildren];
    });
  };

  const deliverables = getDeliverablesOptions(deliverable_groups);

  const validationSchema = yup.object({
    name: yup
      .string()
      .required(t.errors.nameRequired)
      .typeError(t.errors.nameRequired)
      // Matches project_tasks.name's actual column width (varchar(191)) - keeps this in sync
      // with the backend's own max:191 rule instead of failing only after submit.
      .max(191, t.errors.nameMax),
    start_date: yup
      .string()
      .required(sh.startDateRequired)
      .typeError(sh.startDateRequired),
    end_date: yup
      .string()
      .required(sh.endDateRequired)
      .typeError(sh.endDateRequired),
    quantity: yup
      .number()
      .positive(sh.quantityRequired)
      .required(sh.quantityRequired)
      .typeError(sh.quantityRequired)
      .test(
        'whole-unit',
        sh.wholeUnit,
        function (value) {
          return this.parent.measurement_unit?.allows_fractional !== false || !value || Number.isInteger(value);
        }
      ),
    measurement_unit_id: yup
      .number()
      .required(sh.unitRequired)
      .typeError(sh.unitRequired),
    weighted_percentage: yup
      .number()
      .required(t.errors.weightRequired)
      .typeError(t.errors.weightRequired)
      .min(0, t.errors.weightMin)
      .max(100, sh.weightMax)
      .test('check-total', function (value) {
        const context = this.options.context || {};
        const { activityTasks, task } = context;

        if (!activityTasks) return true;

        const totalWeightPercentages = activityTasks.reduce(
          (total, tsk) =>
            total + (task && tsk.id === task.id ? 0 : tsk.weighted_percentage),
          0
        );

        if (totalWeightPercentages + value > 100) {
          return this.createError({
            message: t.errors.totalExceedsActivity.replace('{total}', totalWeightPercentages),
          });
        }
        return true;
      }),
    deliverable_contributions: yup.array().of(
      yup.object().shape({
        deliverable_id: yup.number().nullable().notRequired(),
        contribution_percentage: yup
          .number()
          .nullable()
          .when('deliverable_id', {
            is: (val) => val !== null && val !== undefined,
            then: (schema) =>
              schema
                .min(0, t.errors.contributionMin)
                .max(100, t.errors.contributionMax)
                .required(t.errors.contributionRequired)
                .typeError(t.errors.contributionType),
            otherwise: (schema) => schema.nullable(),
          }),
      })
    ),
  });

  const {
    register,
    setValue,
    setError,
    clearErrors,
    trigger,
    control,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      id: task?.id,
      name: task?.name,
      code: task?.code,
      description: task?.description,
      measurement_unit_id: task?.measurement_unit_id,
      quantity: task?.quantity,
      start_date: task ? dayjs(task.start_date).toISOString() : null,
      end_date: task ? dayjs(task.end_date).toISOString() : null,
      handlers_ids: task?.id ? task.handlers?.map((handler) => handler.id) : [],
      weighted_percentage: task?.weighted_percentage,
      project_activity_id: task ? task?.project_activity_id : activity.id,
      is_milestone: is_milestone,
      deliverable_contributions: task
        ? task.deliverables.map((del) => ({
            deliverable_id: del.id,
            contribution_percentage: del.contribution_percentage,
            currentPercentage: del.contribution_percentage,
          }))
        : [],
      dependency_ids: task?.id
        ? task.dependencies?.map((dependency) => dependency.id)
        : [],
    },
    context: { activityTasks, task },
  });

  const clearServerError = (fieldPath) => {
    setServerError((prevErrors) => {
      if (!prevErrors) return prevErrors;

      const updatedErrors = { ...prevErrors };
      delete updatedErrors[fieldPath];
      return Object.keys(updatedErrors).length ? updatedErrors : null;
    });
  };

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'deliverable_contributions',
  });

  const startDate = watch('start_date');
  const endDate = watch('end_date');

  return (
    <>
      <DialogTitle textAlign={'center'}>
        {task
          ? t.titles.edit.replace('{name}', task?.name)
          : t.titles.new.replace('{name}', activity?.name)}
      </DialogTitle>
      <DialogContent>
        <form autoComplete='off'>
          <Grid container columnSpacing={1}>
            <Grid
              container
              spacing={1}
              alignItems='center'
              justifyContent='center'
            >
              <Grid size={{ xs: 12, md: 4 }}>
                <Div sx={{ mt: 1 }}>
                  <TextField
                    label={t.labels.taskName}
                    size='small'
                    fullWidth
                    error={errors && !!errors?.name}
                    helperText={errors && errors.name?.message}
                    {...register('name')}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Div sx={{ mt: 1 }}>
                  <TextField
                    label={sh.code}
                    size='small'
                    fullWidth
                    {...register('code')}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <Checkbox
                    checked={is_milestone}
                    size='small'
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setIs_milestone(isChecked);
                      setValue('is_milestone', isChecked ? 1 : 0, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });

                      if (isChecked) {
                        setValue('quantity', 1, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                        const currentStartDate = watch('start_date');
                        if (currentStartDate) {
                          setValue(
                            'end_date',
                            dayjs(currentStartDate).endOf('day').toISOString(),
                            {
                              shouldValidate: true,
                              shouldDirty: true,
                            }
                          );
                        }
                      }
                    }}
                  />
                  {t.labels.milestone}
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Div sx={{ mt: 1 }}>
                  <TextField
                    label={sh.quantity}
                    size='small'
                    fullWidth
                    error={errors && !!errors?.quantity}
                    helperText={errors && errors.quantity?.message}
                    InputProps={{
                      readOnly: !!is_milestone,
                    }}
                    InputLabelProps={{
                      shrink: !!is_milestone || !!watch('quantity'),
                    }}
                    {...register('quantity')}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Div sx={{ mt: 1 }}>
                  <MeasurementSelector
                    label={sh.measurementUnit}
                    frontError={errors && errors?.measurement_unit_id}
                    defaultValue={task?.measurement_unit_id}
                    onChange={(newValue) => {
                      setValue('measurement_unit', newValue || null);
                      newValue
                        ? setValue(`measurement_unit_id`, newValue.id, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        : setValue(`measurement_unit_id`, '', {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Div sx={{ mt: 1 }}>
                  <Autocomplete
                    multiple
                    options={
                      task
                        ? allTasks.filter((tsk) => tsk.id !== task?.id)
                        : allTasks
                    }
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id
                    }
                    getOptionLabel={(option) => option.name}
                    value={allTasks.filter((task) =>
                      watch('dependency_ids')?.includes(task.id)
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t.labels.dependencies}
                        size='small'
                        fullWidth
                      />
                    )}
                    onChange={(e, newValue) => {
                      const selectedIds = newValue.map((item) => item.id);
                      setValue('dependency_ids', selectedIds, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                    renderOption={(props, option) => (
                      <li {...props} key={option.id}>
                        {option.name}
                      </li>
                    )}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Div sx={{ mt: 1 }}>
                  <UsersSelector
                    label={t.labels.handlers}
                    multiple={true}
                    defaultValue={task?.handlers}
                    frontError={errors && errors.handlers_ids}
                    onChange={(newValue) => {
                      setValue(
                        'handlers_ids',
                        newValue ? newValue.map((user) => user.id) : [],
                        {
                          shouldDirty: true,
                          shouldValidate: true,
                        }
                      );
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Div sx={{ mt: 1 }}>
                  <DateTimePicker
                    label={sh.startDate}
                    fullWidth
                    minDate={dayjs(organization.recording_start_date)}
                    value={startDate ? dayjs(startDate) : null}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                        readOnly: true,
                        error: !!errors?.start_date,
                        helperText: errors?.start_date?.message,
                      },
                    }}
                    onChange={(newValue) => {
                      const newStartDate = newValue
                        ? newValue.toISOString()
                        : null;
                      setValue('start_date', newStartDate, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });

                      if (is_milestone && newValue) {
                        setValue(
                          'end_date',
                          dayjs(newValue).endOf('day').toISOString(),
                          {
                            shouldValidate: true,
                            shouldDirty: true,
                          }
                        );
                      }
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Div sx={{ mt: 1 }}>
                  <DateTimePicker
                    label={sh.endDate}
                    fullWidth
                    minDate={
                      startDate
                        ? dayjs(startDate)
                        : dayjs(organization.recording_start_date)
                    }
                    value={endDate ? dayjs(endDate) : null}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                        readOnly: true,
                        error: !!errors?.end_date,
                        helperText: errors?.end_date?.message,
                      },
                    }}
                    onChange={(newValue) => {
                      setValue(
                        'end_date',
                        newValue ? newValue.toISOString() : null,
                        {
                          shouldValidate: true,
                          shouldDirty: true,
                        }
                      );
                    }}
                    disabled={is_milestone}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Div sx={{ mt: 1 }}>
                  <TextField
                    size='small'
                    fullWidth
                    error={errors && !!errors?.weighted_percentage}
                    helperText={errors && errors.weighted_percentage?.message}
                    defaultValue={task?.weighted_percentage}
                    label={t.labels.weightPercentage}
                    InputProps={{
                      endAdornment: <span>%</span>,
                    }}
                    onChange={(e) => {
                      setValue(
                        `weighted_percentage`,
                        e.target.value ? sanitizedNumber(e.target.value) : 0,
                        {
                          shouldValidate: true,
                          shouldDirty: true,
                        }
                      );
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Div sx={{ mt: 1 }}>
                  <Autocomplete
                    options={
                      task
                        ? positionIndexOptions.filter(
                            (group) =>
                              group.position_index !== task?.position_index
                          )
                        : positionIndexOptions
                    }
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id
                    }
                    getOptionLabel={(option) => option.name}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={sh.position}
                        size='small'
                        fullWidth
                      />
                    )}
                    onChange={(e, newValue) => {
                      setValue(
                        `position_index`,
                        newValue && newValue?.position_index + 1,
                        {
                          shouldValidate: true,
                          shouldDirty: true,
                        }
                      );
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: 8, lg: 4 }}>
                <Div sx={{ mt: 1 }}>
                  <TextField
                    label={sh.description}
                    size='small'
                    fullWidth
                    multiline={true}
                    rows={2}
                    {...register('description')}
                  />
                </Div>
              </Grid>
              <Grid size={12}>
                <Grid size={12} textAlign={'center'}>
                  <Typography variant='h4'>
                    {t.titles.deliverableContributions}
                  </Typography>
                </Grid>
                <Divider />
                {fields.map((field, index) => (
                  <Grid key={field.id} container columnSpacing={1}>
                    <Grid size={11} marginBottom={0.5}>
                      <Divider />
                      <Grid container columnSpacing={1}>
                        <Grid size={{ xs: 12, md: 8 }}>
                          <Div sx={{ mt: 1 }}>
                            <Autocomplete
                              options={deliverables}
                              isOptionEqualToValue={(option, value) =>
                                option.id === value.id
                              }
                              getOptionLabel={(option) => option.description}
                              defaultValue={
                                task &&
                                deliverables.find(
                                  (deliverable) =>
                                    deliverable.id === field.deliverable_id
                                )
                              }
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label={t.labels.deliverable}
                                  size='small'
                                  fullWidth
                                  error={
                                    !!errors.deliverable_contributions?.[index]
                                      ?.deliverable_id ||
                                    !!serverError?.[
                                      `deliverable_contributions.${index}.deliverable_id`
                                    ]
                                  }
                                  helperText={
                                    errors.deliverable_contributions?.[index]
                                      ?.deliverable_id?.message ||
                                    serverError?.[
                                      `deliverable_contributions.${index}.deliverable_id`
                                    ]
                                  }
                                />
                              )}
                              onChange={async (e, newValue) => {
                                clearServerError(
                                  `deliverable_contributions.${index}.deliverable_id`
                                );
                                const currentDeliverables = watch(
                                  'deliverable_contributions'
                                )
                                  .map((item) => item.deliverable_id)
                                  .filter((id) => id !== null);

                                const isDuplicate =
                                  currentDeliverables.filter(
                                    (deliverable_id) =>
                                      deliverable_id === newValue?.id
                                  ).length > 0;

                                if (isDuplicate) {
                                  setError(
                                    `deliverable_contributions.${index}.deliverable_id`,
                                    {
                                      type: 'manual',
                                      message: t.errors.duplicateDeliverable,
                                    }
                                  );
                                } else {
                                  clearErrors(
                                    `deliverable_contributions.${index}.deliverable_id`
                                  );

                                  setValue(
                                    `deliverable_contributions.${index}.deliverable_id`,
                                    newValue?.id || null,
                                    {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                    }
                                  );
                                }

                                if (!newValue) {
                                  trigger(
                                    `deliverable_contributions.${index}.contribution_percentage`
                                  );
                                }
                              }}
                            />
                          </Div>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Div sx={{ mt: 1 }}>
                            <TextField
                              label={t.labels.contributionPercentage}
                              size='small'
                              fullWidth
                              defaultValue={field.contribution_percentage}
                              error={
                                !!errors.deliverable_contributions?.[index]
                                  ?.contribution_percentage ||
                                !!serverError?.[
                                  `deliverable_contributions.${index}.contribution_percentage`
                                ]
                              }
                              helperText={
                                errors.deliverable_contributions?.[index]
                                  ?.contribution_percentage?.message ||
                                serverError?.[
                                  `deliverable_contributions.${index}.contribution_percentage`
                                ]
                              }
                              InputProps={{
                                endAdornment: <span>%</span>,
                              }}
                              onChange={(e) => {
                                clearServerError(
                                  `deliverable_contributions.${index}.contribution_percentage`
                                );
                                const inputValue =
                                  sanitizedNumber(e.target.value) || 0;
                                const contributions = watch(
                                  `deliverable_contributions`
                                );
                                const allDeliverables = activity.tasks.flatMap(
                                  (task) => task.deliverables
                                );

                                const currentDeliverableId =
                                  contributions[index].deliverable_id;
                                const existingDeliverables =
                                  allDeliverables.filter(
                                    (deliverable) =>
                                      deliverable.id === currentDeliverableId
                                  );

                                const totalExistingContribution =
                                  existingDeliverables.reduce(
                                    (total, deliverable) => {
                                      return (
                                        total +
                                        (deliverable.contribution_percentage ||
                                          0)
                                      );
                                    },
                                    0
                                  );

                                const totalContributions =
                                  totalExistingContribution +
                                  inputValue -
                                  (contributions[index].currentPercentage || 0);

                                if (totalContributions > 100) {
                                  setError(
                                    `deliverable_contributions.${index}.contribution_percentage`,
                                    {
                                      type: 'manual',
                                      message: t.errors.contributionExceeds.replace('{total}', totalContributions),
                                    }
                                  );
                                } else {
                                  clearErrors(
                                    `deliverable_contributions.${index}.contribution_percentage`
                                  );
                                  setValue(
                                    `deliverable_contributions.${index}.contribution_percentage`,
                                    inputValue,
                                    {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                    }
                                  );
                                }
                              }}
                            />
                          </Div>
                        </Grid>
                      </Grid>
                    </Grid>

                    {fields.length > 0 && (
                      <Grid size={1}>
                        <Div sx={{ mt: 1 }}>
                          <Tooltip title={dictionary.tooltips.removeDeliverableContribution}>
                            <IconButton
                              size='small'
                              onClick={() => remove(index)}
                            >
                              <DisabledByDefault
                                fontSize='small'
                                color='error'
                              />
                            </IconButton>
                          </Tooltip>
                        </Div>
                      </Grid>
                    )}
                  </Grid>
                ))}
                <Grid
                  size={12}
                  sx={{
                    display: 'flex',
                    direction: 'row',
                    justifyContent: 'flex-end',
                  }}
                >
                  <Div sx={{ mt: 1 }}>
                    <Tooltip title={dictionary.tooltips.addDeliverableContribution}>
                      <Button
                        size='small'
                        variant='outlined'
                        onClick={() =>
                          append({
                            deliverable_id: null,
                            contribution_percentage: null,
                          })
                        }
                      >
                        <AddOutlined fontSize='10' /> {t.buttons.addContribution}
                      </Button>
                    </Tooltip>
                  </Div>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      <DialogActions>
        <Button size='small' onClick={() => setOpenDialog(false)}>
          {sh.cancel}
        </Button>
        <LoadingButton
          type='submit'
          onClick={handleSubmit((data) => saveMutation(data))}
          variant='contained'
          size='small'
          sx={{ display: 'flex' }}
          loading={isPending || isEdit}
        >
          {sh.submit}
        </LoadingButton>
      </DialogActions>
    </>
  );
};

export default TasksForm;
