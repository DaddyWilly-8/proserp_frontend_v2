import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid, IconButton, TextField, Tooltip } from '@mui/material'
import React, { useEffect, useState } from 'react'
import dayjs from 'dayjs'; 
import { DateTimePicker } from '@mui/x-date-pickers';
import { LoadingButton } from '@mui/lab';
import * as yup  from "yup";
import {yupResolver} from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import SubContractMaterialIssuedItemForm from './SubContractMaterialIssuedItemForm';
import SubContractMaterialIssuedItemRow from './SubContractMaterialIssuedItemRow';
import { HighlightOff } from '@mui/icons-material';
import projectsServices from '@/components/projectManagement/projects/project-services';
import { Div } from '@jumbo/shared';

function SubContractMaterialIssuedForm({toggleOpen, subContract, SubContractMaterialIssued}) {
  const [issue_date] = useState(SubContractMaterialIssued ? dayjs(SubContractMaterialIssued.issue_date) : dayjs());
  const [items, setItems] = useState(SubContractMaterialIssued ? SubContractMaterialIssued.items.map(item => {
    return {
     ...item,
      product_id: item.product?.id,
      store_id: item.store?.id,
      measurement_unit_id: item.measurement_unit?.id
    }
  }) : []);

  const {enqueueSnackbar} =  useSnackbar();
  const queryClient = useQueryClient();

  const [showWarning, setShowWarning] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [clearFormKey, setClearFormKey] = useState(0);
  const [submitItemForm, setSubmitItemForm] = useState(false);

  const validationSchema = yup.object({
    issue_date: yup.string().required('Issue date is required').typeError('Issue date is required'),
  });

  const {setValue, setError, handleSubmit, watch, register, formState : {errors}} = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      id: SubContractMaterialIssued?.id,
      subcontract_id: SubContractMaterialIssued ? SubContractMaterialIssued.subcontract?.id : subContract?.id,
      issue_date: issue_date.toISOString(),
      remarks: SubContractMaterialIssued?.remarks,
      reference: SubContractMaterialIssued?.reference,
      items: SubContractMaterialIssued ? SubContractMaterialIssued.items.map(item => {
        return {
         ...item,
          product_id: item.product?.id,
          store_id: item.store?.id,
          measurement_unit_id: item.measurement_unit?.id
        }
      }) : [],
    }
  });

  // React Query v5 syntax for useMutation
  const { mutate: addSubContractMaterialIssued, isPending: isAdding } = useMutation({
    mutationFn: projectsServices.addSubContractMaterialIssued,
    onSuccess: (data) => {
      toggleOpen(false);
      enqueueSnackbar(data.message,{variant : 'success'});
      queryClient.invalidateQueries({queryKey: ['SubContractMaterialIssued']});
    },
    onError: (error) => {
      error?.response?.data?.message && enqueueSnackbar(error.response.data.message,{variant:'error'});
    }
  })
  
  const { mutate: updateSubContractMaterialIssued, isPending: isUpdating } = useMutation({
    mutationFn: projectsServices.updateSubContractMaterialIssued,
    onSuccess: (data) => {
      toggleOpen(false);
      enqueueSnackbar(data.message,{variant : 'success'});
      queryClient.invalidateQueries({queryKey: ['SubContractMaterialIssued']});
    },
    onError: (error) => {
      error?.response?.data?.message && enqueueSnackbar(error.response.data.message,{variant:'error'});
    }
  });

  useEffect(() => {
    setValue(`items`, items);
  }, [items, setValue]);

  const saveMutation = React.useMemo(() => {
    return SubContractMaterialIssued ? updateSubContractMaterialIssued : addSubContractMaterialIssued
  },[updateSubContractMaterialIssued, addSubContractMaterialIssued, SubContractMaterialIssued]);

  const onSubmit = (data) => {
    if (items.length === 0) {
      setError(`items`, {
        type: "manual",
        message: "You must add at least one Material",
      });
      return;
    } else if (isDirty) {
      setShowWarning(true);
    } else {
      data.items = items;
      saveMutation(data);
    }
  };  

  const handleConfirmSubmitWithoutAdd = () => {
    const formData = {
      ...watch(),
      items: items
    };
    saveMutation(formData);
    setIsDirty(false);
    setShowWarning(false);
    setClearFormKey(prev => prev + 1)
  };

  return (
    <React.Fragment>
      <DialogTitle>
        <Grid container columnSpacing={2}>
          <Grid size={{xs: 12}} textAlign={"center"} mb={2}>
            {!SubContractMaterialIssued ? 'New Material Issued' : `Edit ${SubContractMaterialIssued.issueNo}`}
          </Grid>
          <Grid size={{xs: 12}} mb={1}>
            <form autoComplete='off'>
              <Grid container columnSpacing={1} rowSpacing={2}>
                <Grid size={{xs: 12, md: 4}}>
                  <Div sx={{ mt: 0.3}}>
                    <DateTimePicker
                      fullWidth
                      label="Issue Date" 
                      defaultValue={issue_date}              
                      slotProps={{
                        textField:{
                          size: 'small',
                          fullWidth: true,
                          readOnly: true,
                        }
                      }}
                      onChange={(newValue) => {
                        setValue('issue_date', newValue ? newValue.toISOString() : null,{
                          shouldValidate: true,
                          shouldDirty: true
                        });
                      }}
                    />
                  </Div>
                </Grid>
                <Grid size={{xs: 12, md: 3}}>
                  <Div sx={{ mt: 0.3}}>
                    <TextField
                      label="Reference"
                      size="small"
                      fullWidth
                      defaultValue={SubContractMaterialIssued?.reference}
                      {...register('reference')}
                    />
                  </Div>
                </Grid>
                <Grid size={{xs: 12, md: 5}}>
                  <Div sx={{ mt: 0.3}}>
                    <TextField
                      label="Remarks"
                      size="small"
                      defaultValue={SubContractMaterialIssued?.remarks}
                      error={!!errors?.remarks}
                      helperText={errors?.remarks?.message}
                      multiline={true}
                      minRows={2}
                      fullWidth
                      {...register('remarks')}
                    />
                  </Div>
                </Grid>
              </Grid>
            </form>
          </Grid>
          <Grid size={{xs: 12}}>
            <Divider />
            <SubContractMaterialIssuedItemForm 
              setClearFormKey={setClearFormKey} 
              submitMainForm={() => {
                const formData = {
                  ...watch(),
                  items: items
                };
                saveMutation(formData);
              }} 
              submitItemForm={submitItemForm} 
              setSubmitItemForm={setSubmitItemForm} 
              key={clearFormKey} 
              setIsDirty={setIsDirty} 
              setItems={setItems} 
              items={items} 
              issue_date={watch(`issue_date`)}
            />
          </Grid>
        </Grid>
      </DialogTitle>
      <DialogContent>
        {
          errors?.items?.message && items.length < 1 && <Alert severity='error'>{errors.items.message}</Alert>
        }
        {
          items.map((item,index) => (
            <SubContractMaterialIssuedItemRow 
              setClearFormKey={setClearFormKey} 
              submitMainForm={() => {
                const formData = {
                  ...watch(),
                  items: items
                };
                saveMutation(formData);
              }} 
              submitItemForm={submitItemForm} 
              setSubmitItemForm={setSubmitItemForm} 
              setIsDirty={setIsDirty} 
              key={index} 
              index={index} 
              setItems={setItems} 
              items={items} 
              item={item} 
              issue_date={watch(`issue_date`)}
            />
          ))
        }

        <Dialog open={showWarning} onClose={() => setShowWarning(false)}>
          <DialogTitle>            
            <Grid container alignItems="center" justifyContent="space-between">
              <Grid size={{xs: 11}}>
                Unsaved Changes
              </Grid>
              <Grid size={{xs: 1}} textAlign="right">
                <Tooltip title="Close">
                  <IconButton
                    size="small" 
                    onClick={() => setShowWarning(false)}
                  >
                    <HighlightOff color="primary" />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
          </DialogTitle>
          <DialogContent>
            Last Material was not added to the list
          </DialogContent>
          <DialogActions>
            <Button size="small" onClick={() => {setSubmitItemForm(true); setShowWarning(false);}}>
              Add and Submit
            </Button>
            <Button size="small" onClick={handleConfirmSubmitWithoutAdd} color="secondary">
              Submit without add
            </Button>
          </DialogActions>
        </Dialog>
      </DialogContent>
      <DialogActions>
        <Button size='small' onClick={() => toggleOpen(false)}>
          Cancel
        </Button>
        <LoadingButton
          loading={isAdding || isUpdating}
          variant='contained' 
          onClick={onSubmit}
          size='small'
        >
          Submit
        </LoadingButton>
      </DialogActions>
    </React.Fragment>
  )
}

export default SubContractMaterialIssuedForm