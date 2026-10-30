import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useSnackbar } from 'notistack';
import { Button, DialogActions, DialogContent, DialogTitle, Grid, TextField } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import * as yup from 'yup';
import purchaseServices from '../purchase-services';
import { DateTimePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Div } from '@jumbo/shared';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const CloseOrReopenForm = ({ setOpenDialog, order, isReOpen }) => {
  const dictionary = useDictionary();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const {authOrganization,checkOrganizationPermission} = useJumboAuth();

  const closeOrder = useMutation({
    mutationFn: purchaseServices.closeOrder,
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
    onError: (error) => {
      enqueueSnackbar(error?.response?.data?.message, { variant: 'error' });
    },
  });

  const reOpenOrder = useMutation({
    mutationFn: purchaseServices.reOpenOrder,
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
    onError: (error) => {
      enqueueSnackbar(error?.response?.data?.message, { variant: 'error' });
    },
  });

  const validationSchema = yup.object({
    datetime_closed: yup.string().when([], (val, schema, context) => {
      if (!context || context.isReOpen) return schema;
      return schema.required(dictionary.forms.purchases.closeOrReopen.errors.validation.closingDate.required).typeError(dictionary.forms.purchases.closeOrReopen.errors.validation.closingDate.required);
    }),
    datetime_reopened: yup.string().when([], (val, schema, context) => {
      if (!context || !context.isReOpen) return schema;
      return schema.required(dictionary.forms.purchases.closeOrReopen.errors.validation.reopeningDate.required).typeError(dictionary.forms.purchases.closeOrReopen.errors.validation.reopeningDate.required);
    }),
  });

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      id: order.id,
      closure_id: isReOpen ? order.closure.id : null,
      datetime_closed: dayjs().toISOString(),
      datetime_reopened: dayjs().toISOString(),
      remarks: '',
    },
    context: { isReOpen },
  });

  const saveMutation = React.useMemo(() => {
    return isReOpen ? reOpenOrder.mutate : closeOrder.mutate;
  }, [isReOpen, reOpenOrder, closeOrder]);

  return (
    <>
      <DialogTitle>
        <Grid size={12} textAlign={"center"}>
          {(isReOpen ? dictionary.forms.purchases.closeOrReopen.titles.reopen : dictionary.forms.purchases.closeOrReopen.titles.close).replace('{orderNo}', order.orderNo)}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={handleSubmit(saveMutation)}>
          <Grid container spacing={1}>
            <Grid size={{xs: 12, md: 4}}>
                <Div sx={{ mt: 1, mb: 1 }}>
                    <DateTimePicker
                        fullWidth
                        label={isReOpen ? dictionary.forms.purchases.closeOrReopen.labels.reopeningDate : dictionary.forms.purchases.closeOrReopen.labels.closingDate}
                        defaultValue={dayjs()}
                        minDate={checkOrganizationPermission(PERMISSIONS.PURCHASES_BACKDATE) ? dayjs(authOrganization?.organization.recording_start_date) : dayjs().startOf('day')}
                        maxDate={checkOrganizationPermission(PERMISSIONS.PURCHASES_POSTDATE) ? dayjs().add(10,'year').endOf('year') : dayjs().endOf('day')}
                        slotProps={{
                          textField: {
                            size: 'small',
                            fullWidth: true,
                            readOnly: true,
                            error: !!(isReOpen ? errors?.datetime_reopened : errors?.datetime_closed),
                            helperText: isReOpen 
                              ? errors?.datetime_reopened?.message 
                              : errors?.datetime_closed?.message
                          }
                        }}
                        onChange={(newValue) => {
                          setValue(
                            isReOpen ? 'datetime_reopened' : 'datetime_closed',
                            newValue ? newValue.toISOString() : null,
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
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  name='remarks'
                  label={dictionary.forms.purchases.closeOrReopen.labels.remarks}
                  size='small'
                  multiline={true}
                  minRows={2}
                  fullWidth
                  {...register('remarks')}
                />
              </Div>
            </Grid>
          </Grid>
          <DialogActions>
            <Button size='small' onClick={() => setOpenDialog(false)}>
              {dictionary.forms.purchases.closeOrReopen.buttons.cancel}
            </Button>
            <LoadingButton  
              type="submit"
              variant="contained"
              size="small"
              sx={{ display: 'flex' }}
              loading={closeOrder.isPending || reOpenOrder.isPending}
            >
              {dictionary.forms.purchases.closeOrReopen.buttons.submit}
            </LoadingButton>
          </DialogActions>
        </form>
      </DialogContent>
    </>
  );
};

export default CloseOrReopenForm;
