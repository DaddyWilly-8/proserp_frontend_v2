import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import CurrencySelector from '@/components/masters/Currencies/CurrencySelector';
import StakeholderQuickAdd from '@/components/masters/stakeholders/StakeholderQuickAdd';
import StakeholderSelector from '@/components/masters/stakeholders/StakeholderSelector';
import StoreSelector from '@/components/procurement/stores/StoreSelector';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { AddOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Tooltip,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import projectsServices from '../../project-services';
import { useProjectProfile } from '../ProjectProfileProvider';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

function SubcontractForm({ setOpenDialog, subContract = null }) {
  const dictionary = useDictionary();
  const t = dictionary.forms.projects.subcontracts;
  const sh = dictionary.forms.projects.shared;
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { project } = useProjectProfile();
  const {
    authOrganization: { organization },
    checkOrganizationPermission,
  } = useJumboAuth();
  const [stakeholderQuickAddDisplay, setStakeholderQuickAddDisplay] =
    useState(false);
  const [addedStakeholder, setAddedStakeholder] = useState(null);

  const { mutate: addSubcontract, isPending } = useMutation({
    mutationFn: projectsServices.addSubcontract,
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['subcontracts'] });
    },
    onError: (error) => {
      enqueueSnackbar(getErrorMessage(error), {
        variant: 'error',
      });
    },
  });

  const { mutate: updateSubcontract, isPending: updateIsLoading } = useMutation(
    {
      mutationFn: projectsServices.updateSubcontract,
      onSuccess: (data) => {
        setOpenDialog(false);
        enqueueSnackbar(data.message, { variant: 'success' });
        queryClient.invalidateQueries({ queryKey: ['subcontracts'] });
      },
      onError: (error) => {
        enqueueSnackbar(getErrorMessage(error), {
          variant: 'error',
        });
      },
    }
  );

  const saveMutation = React.useMemo(() => {
    return subContract?.id ? updateSubcontract : addSubcontract;
  }, [subContract, updateSubcontract, addSubcontract]);

  const validationSchema = yup.object({
    subcontractor_id: yup
      .number()
      .required(t.errors.subcontractorRequired)
      .typeError(t.errors.subcontractorRequired),
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      id: subContract?.id,
      project_id: project?.id,
      subcontractor_id: subContract?.subcontractor_id,
      store_id: subContract?.store_id ?? null,
      commencement_date: subContract?.commencement_date ?? null,
      completion_date: subContract?.completion_date ?? null,
      currency_id: subContract ? subContract?.currency_id : 1,
      exchange_rate: subContract ? subContract?.exchange_rate : 1,
      reference: subContract?.reference,
      remarks: subContract?.remarks,
    },
  });

  // setvalues from coming addedStakeholder
  useEffect(() => {
    if (addedStakeholder?.id) {
      setValue('subcontractor_id', addedStakeholder.id);
      setStakeholderQuickAddDisplay(false);
    }
  }, [addedStakeholder, setValue]);

  return (
    <form
      autoComplete='off'
      onSubmit={handleSubmit((data) => saveMutation(data))}
    >
      {!stakeholderQuickAddDisplay && (
        <DialogTitle textAlign={'center'}>
          {subContract
            ? t.titles.edit.replace('{no}', subContract.subcontractNo)
            : t.titles.new}
        </DialogTitle>
      )}
      <DialogContent>
        <Grid container spacing={1}>
          {!stakeholderQuickAddDisplay && (
            <>
              <Grid size={{ xs: 12, md: 4 }}>
                <Div sx={{ mt: 1 }}>
                  <StakeholderSelector
                    label={t.labels.subContractorName}
                    defaultValue={subContract && subContract.subcontractor_id}
                    frontError={errors?.subcontractor_id}
                    addedStakeholder={addedStakeholder}
                    onChange={(newValue) => {
                      newValue
                        ? setValue('subcontractor_id', newValue.id, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        : setValue('subcontractor_id', '', {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                    }}
                    startAdornment={
                      checkOrganizationPermission(
                        PERMISSIONS.STAKEHOLDERS_CREATE
                      ) && (
                        <Tooltip title={dictionary.tooltips.addSubContractor}>
                          <AddOutlined
                            onClick={() => setStakeholderQuickAddDisplay(true)}
                            sx={{ cursor: 'pointer' }}
                          />
                        </Tooltip>
                      )
                    }
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Div sx={{ mt: 1 }}>
                  <StoreSelector
                    label={t.labels.storeAssigned}
                    allowSubStores={true}
                    proposedOptions={project?.stores}
                    defaultValue={
                      subContract?.store_id
                        ? project.stores.find(
                            (store) => store.id === subContract.store_id
                          )
                        : null
                    }
                    onChange={(newValue) => {
                      setValue('store_id', newValue ? newValue.id : null, {
                        shouldDirty: true,
                        shouldValidate: false,
                      });
                    }}
                  />
                </Div>
              </Grid>
            </>
          )}

          {stakeholderQuickAddDisplay && (
            <StakeholderQuickAdd
              displayTitle={t.titles.addSubContractor}
              setStakeholderQuickAddDisplay={setStakeholderQuickAddDisplay}
              create_payable={true}
              setAddedStakeholder={setAddedStakeholder}
            />
          )}

          {!stakeholderQuickAddDisplay && (
            <>
              <Grid size={{ xs: 12, md: 4 }}>
                <Div sx={{ mt: 1 }}>
                  <CurrencySelector
                    frontError={errors?.currency_id}
                    defaultValue={subContract ? subContract.currency_id : 1}
                    onChange={(newValue) => {
                      setValue('currency_id', newValue ? newValue.id : null, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });

                      clearErrors('exchange_rate');

                      setValue(
                        'exchange_rate',
                        newValue?.exchangeRate ? newValue.exchangeRate : 1
                      );
                    }}
                  />
                </Div>
              </Grid>
              {watch('currency_id') > 1 && (
                <Grid size={{ xs: 12, md: 4 }}>
                  <Div sx={{ mt: 1 }}>
                    <TextField
                      label={sh.exchangeRate}
                      fullWidth
                      size='small'
                      InputProps={{
                        inputComponent: CommaSeparatedField,
                      }}
                      value={watch('exchange_rate')}
                      onChange={(e) => {
                        setValue(
                          `exchange_rate`,
                          e.target.value
                            ? sanitizedNumber(e.target.value)
                            : null,
                          {
                            shouldValidate: true,
                            shouldDirty: true,
                          }
                        );
                      }}
                    />
                  </Div>
                </Grid>
              )}
              <Grid size={{ xs: 12, md: 4 }}>
                <Div sx={{ mt: 1 }}>
                  <TextField
                    label={sh.reference}
                    size='small'
                    fullWidth
                    defaultValue={subContract?.reference}
                    {...register('reference')}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Div sx={{ mt: 1 }}>
                  <DateTimePicker
                    label={sh.commencementDate}
                    fullWidth
                    minDate={dayjs(organization.recording_start_date)}
                    defaultValue={
                      subContract && !!subContract.commencement_date
                        ? dayjs(subContract.commencement_date)
                        : null
                    }
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                        readOnly: true,
                      },
                    }}
                    onChange={(newValue) => {
                      setValue(
                        'commencement_date',
                        newValue ? newValue.toISOString() : null,
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
                  <DateTimePicker
                    label={sh.completionDate}
                    fullWidth
                    minDate={dayjs(watch(`commencement_date`))}
                    defaultValue={
                      subContract && !!subContract.completion_date
                        ? dayjs(subContract.completion_date)
                        : null
                    }
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                        readOnly: true,
                      },
                    }}
                    onChange={(newValue) => {
                      setValue(
                        'completion_date',
                        newValue ? newValue.toISOString() : null,
                        {
                          shouldValidate: true,
                          shouldDirty: true,
                        }
                      );
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: watch('currency_id') > 1 ? 8 : 12 }}>
                <Div sx={{ mt: 1 }}>
                  <TextField
                    label={t.labels.remarks}
                    size='small'
                    defaultValue={subContract?.remarks}
                    multiline={true}
                    minRows={2}
                    fullWidth
                    {...register('remarks')}
                  />
                </Div>
              </Grid>
            </>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button size='small' onClick={() => setOpenDialog(false)}>
          {sh.cancel}
        </Button>
        {!stakeholderQuickAddDisplay && (
          <LoadingButton
            type='submit'
            variant='contained'
            size='small'
            sx={{ display: 'flex' }}
            loading={isPending || updateIsLoading}
          >
            {sh.submit}
          </LoadingButton>
        )}
      </DialogActions>
    </form>
  );
}

export default SubcontractForm;
