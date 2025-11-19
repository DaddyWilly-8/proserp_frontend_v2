import { LoadingButton } from '@mui/lab';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, TextField, Tooltip, Typography } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from "yup";
import { yupResolver } from '@hookform/resolvers/yup';
import { useSnackbar } from 'notistack';
import { HighlightOff } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Div } from '@jumbo/shared';
import projectsServices from '@/components/projectManagement/projects/project-services';
import CertificateItemForm from './CertificateItemForm';
import CertificateItemRow from './CertificateItemRow';

const CertificateForm = ({ setOpenDialog, certificate, subContract }) => {
    const queryClient = useQueryClient();
    const { enqueueSnackbar } = useSnackbar();
    const [items, setItems] = useState(certificate?.items || []);

    const [showWarning, setShowWarning] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [clearFormKey, setClearFormKey] = useState(0);
    const [submitItemForm, setSubmitItemForm] = useState(false);

    const addCertificate = useMutation({
      mutationFn: projectsServices.addCertificates,
      onSuccess: (data) => {
        data?.message && enqueueSnackbar(data.message, { variant: 'success' });
        queryClient.invalidateQueries({ queryKey: ['Certificates'] });
        setOpenDialog(false);
      },
      onError: (error) => {
        if (error instanceof Error && 'response' in error) {
        const axiosError = error;
        if (axiosError.response?.status === 400) {
        } else {
          enqueueSnackbar(axiosError.response?.data?.message, { variant: 'error' });
        }
        }
      }
    });

    const updateCertificate = useMutation({
      mutationFn: projectsServices.updateCertificates,
      onSuccess: (data) => {
        data?.message && enqueueSnackbar(data.message, { variant: 'success' });
        queryClient.invalidateQueries({ queryKey: ['Certificates'] });
        setOpenDialog(false);
      },
      onError: (error) => {
        if (error instanceof Error && 'response' in error) {
        const axiosError = error;
        if (axiosError.response?.status === 400) {
        } else {
          enqueueSnackbar(axiosError.response?.data?.message, { variant: 'error' });
        }
        }
      }
    });
   
  const validationSchema = yup.object({
    remarks: yup
      .string()
      .required('Remarks is required')
      .typeError('Remarks is required'),

    certificate_date: yup
      .string()
      .required('Certificate date is required')
      .typeError('Certificate date is required')
  });

  const { handleSubmit, setError, setValue, register, clearErrors, formState: { errors }, watch } = useForm(
    {
      resolver: yupResolver(validationSchema),
      defaultValues: {
        remarks: certificate?.remarks,
        project_subcontract_id: subContract?.id,
        certificate_date: certificate?.certificate_date ? dayjs(certificate.certificate_date).toISOString() : dayjs().toISOString(),
        certified_tasks: certificate?.certified_tasks || items,
        id: undefined
    }
  });

  useEffect(() => {
      setValue('items', items);
  }, [items, setValue]);

  const saveCertificate = React.useMemo(() => {
    return certificate ? updateCertificate : addCertificate;
  }, [certificate, updateCertificate, addCertificate]);

  const onSubmit = (data) => {
    if (items.length === 0) {
      clearErrors("items");
      setError("items", { type: "manual", message: "You must add at least one item" });
      return;
    }
    if (isDirty) {
      setShowWarning(true);
    } else {
      handleSubmit((data) => handleSubmitForm(data))();
    }
  };

  const handleConfirmSubmitWithoutAdd = async (data) => {
    handleSubmit((data) => handleSubmitForm(data))();
    setIsDirty(false);
    setShowWarning(false);
    setClearFormKey((prev) => prev + 1);
  };

  const handleSubmitForm = async (data) => {
    const updatedData = {
      ...data,
      certified_tasks: items.map((item) => ({
        project_subcontract_task_id: item.project_subcontract_task_id,
        remarks: item.remarks,
        certified_quantity: item.certified_quantity,
      })),
    };
    await saveCertificate.mutate(updatedData);
  };

  const CertificateDate = watch('certificate_date')

  return (
    <>
      <DialogTitle textAlign={'center'}>
        {`New Certificate Form`}
      </DialogTitle>
      <DialogContent>
        <form autoComplete='false' onSubmit={handleSubmit(onSubmit)}>
          <Grid container columnSpacing={1} marginBottom={2}>
            <Grid size={{xs: 12, md: 4}}>
              <Div sx={{ mt: 1 }}>
                <DateTimePicker
                  label="Certificate Date (MM/DD/YYYY)"
                  value={dayjs(watch("certificate_date"))}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      InputProps: { readOnly: true },
                      error: !!errors?.certificate_date,
                      helperText: errors?.certificate_date?.message
                    }
                  }}
                  onChange={(newValue) => {
                    setValue(
                      'certificate_date',
                      newValue ? newValue.toISOString() : '',
                      {
                        shouldValidate: true,
                        shouldDirty: true
                      }
                    );
                  }}
                />
              </Div>
            </Grid>
            <Grid size={{xs: 12, md: 8}}>
              <Div sx={{mt: 1}}>
                <TextField
                  size="small"
                  label="Remarks"
                  fullWidth
                  multiline
                  rows={2}
                  {...register('remarks')}
                  error={!!errors.remarks}
                  helperText={errors.remarks?.message}
                />
              </Div>
            </Grid>
          </Grid>

          <CertificateItemForm 
            setClearFormKey={setClearFormKey} 
            submitMainForm={handleSubmit((data) => saveCertificate.mutate(data))} 
            submitItemForm={submitItemForm} 
            setSubmitItemForm={setSubmitItemForm} 
            key={clearFormKey} 
            setIsDirty={setIsDirty} 
            items={items}
            CertificateDate={CertificateDate} 
            setItems={setItems} 
            iscertificate={true}
          />

          {errors?.items?.message && items.length < 1 && <Alert severity='error'>{errors.items.message}</Alert>}

          {items.map((item, index) => (
            <CertificateItemRow 
              setClearFormKey={setClearFormKey} 
              submitMainForm={handleSubmit((data) => saveCertificate.mutate(data))} 
              submitItemForm={submitItemForm} 
              setSubmitItemForm={setSubmitItemForm} 
              setIsDirty={setIsDirty} 
              key={index} 
              index={index} 
              item={item} 
              items={items}
              CertificateDate={CertificateDate} 
              setItems={setItems} 
              iscertificate={true}
            />
          ))}
        </form>

        <Dialog open={showWarning} onClose={() => setShowWarning(false)}>
          <DialogTitle>            
            <Grid container alignItems="center" justifyContent="space-between">
              <Grid size={11}>
                Unsaved Changes
              </Grid>
              <Grid size={1} textAlign="right">
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
            Last item was not added to the list
          </DialogContent>
          <DialogActions>
            <Button size="small" onClick={() => { setSubmitItemForm(true); setShowWarning(false); }}>
              Add and Submit
            </Button>
            <Button size="small" onClick={() => handleConfirmSubmitWithoutAdd(watch())} color="secondary">
              Submit without add
            </Button>
          </DialogActions>
        </Dialog>
      </DialogContent>
      <DialogActions>
        <Button size='small' onClick={() => setOpenDialog(false)}>
          Cancel
        </Button>
        <LoadingButton
          type='submit'
          loading={addCertificate.isPending || updateCertificate.isPending}
          size="small"
          variant='contained'
          onClick={handleSubmit(onSubmit)}
        >
          Submit
        </LoadingButton>
      </DialogActions>
    </>
  );
};

export default CertificateForm;