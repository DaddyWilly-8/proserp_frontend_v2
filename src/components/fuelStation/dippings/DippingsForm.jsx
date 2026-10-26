import React, { useContext } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Grid,
  TextField,
  DialogActions,
  Button,
  DialogContent,
  Tooltip,
  IconButton,
  DialogTitle,
  Divider,
  Stack,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useSnackbar } from 'notistack';
import { AddOutlined, DisabledByDefault } from '@mui/icons-material';
import ProductSelect from '../../productAndServices/products/ProductSelect';
import StoreSelector from '../../procurement/stores/StoreSelector';
import fuelStationServices from '../fuelStationServices';
import { useProductsSelect } from '../../productAndServices/products/ProductsSelectProvider';
import { DippingsFormContext } from './Dippings';
import dayjs from 'dayjs';
import { DateTimePicker } from '@mui/x-date-pickers';
import { Div } from '@jumbo/shared';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const DippingsForm = ({ setOpenDialog, dippingData }) => {
  const dictionary = useDictionary();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { productOptions } = useProductsSelect();
  const { activeStation } = useContext(DippingsFormContext);
  const {authOrganization : {organization}} = useJumboAuth();
  const { tanks, products } = activeStation;

  const validationSchema = yup.object({
    as_at: yup.string().required(dictionary.forms.dippings.validation.dippingDateRequired).typeError(dictionary.forms.dippings.validation.dippingDateRequired),
    readings: yup.array().of(
      yup.object().shape({
        reading: yup.number().required(dictionary.forms.dippings.validation.tankReadingRequired).typeError(dictionary.forms.dippings.validation.tankReadingRequired),
        product_id: yup.number().required(dictionary.forms.dippings.validation.fuelNameRequired).typeError(dictionary.forms.dippings.validation.fuelNameRequired),
        tank_id: yup.number().required(dictionary.forms.dippings.validation.tankNameRequired).typeError(dictionary.forms.dippings.validation.tankNameRequired),
      })
    ),
  });

  const { control, register, setValue, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      remarks: dippingData && dippingData.remarks,
      as_at: dippingData && dayjs(dippingData?.as_at).toISOString(),
      readings: dippingData ? dippingData.readings.map(r => ({
        reading: r.reading,
        tank_id: r.tank.id,
        product_id: r.product.id,
      })) : [{ reading: '', tank_id: '', product_id: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'readings',
  });

    const addDipping = useMutation({
    mutationFn: fuelStationServices.addDipping,
    onSuccess: (data) => {
        setOpenDialog(false);
        enqueueSnackbar(data.message, { variant: 'success' });
        queryClient.invalidateQueries({ queryKey: ['stationDippings'] });
    },
    onError: (error) => {
        enqueueSnackbar(error.response.data.message, {
        variant: 'error',
        });
    },
    });

    const editDipping = useMutation({
    mutationFn: fuelStationServices.EditDipping,
    onSuccess: (data) => {
        setOpenDialog(false);
        enqueueSnackbar(data.message, { variant: 'success' });
        queryClient.invalidateQueries({ queryKey: ['stationDippings'] });
    },
    onError: (error) => {
        enqueueSnackbar(error.response.data.message, {
        variant: 'error',
        });
    },
    });

  const onSubmit = (data) => {
    if (dippingData) {
      editDipping.mutate(data);
    } else {
      addDipping.mutate(data);
    }
  };

  return (
    <>
        <DialogTitle textAlign={'center'}>{dippingData ? dictionary.forms.dippings.titles.edit : dictionary.forms.dippings.titles.new}</DialogTitle>
        <DialogContent>
            <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
                <Grid container columnSpacing={1}>
                    <Grid size={{xs:12, md:4}}>
                        <Div sx={{mt: 1 }}>
                            <DateTimePicker
                                label={dictionary.forms.dippings.labels.asAt}
                                fullWidth
                                defaultValue={dippingData ? dayjs(dippingData?.as_at) : null}
                                minDate={dayjs(organization.recording_start_date)}
                                slotProps={{
                                    textField : {
                                        size: 'small',
                                        fullWidth: true,
                                        readOnly: true,
                                        error: !!errors?.as_at,
                                        helperText: errors?.as_at?.message
                                    }
                                }}
                                onChange={(newValue) => {
                                    setValue('as_at', newValue ? newValue.toISOString() : null,{
                                        shouldValidate: true,
                                        shouldDirty: true
                                    });
                                }}
                            />
                        </Div>
                    </Grid>
                   <Grid size={{xs:12, md:8}}>
                        <Div sx={{ mt: 1 }}>
                            <TextField
                                size="small"
                                fullWidth
                                multiline={true}
                                rows={2}
                                error={!!errors?.remarks}
                                helperText={errors?.remarks?.message}
                                label={dictionary.forms.dippings.labels.remarks}
                                {...register('remarks')}
                            />
                        </Div>
                    </Grid>

                    <Grid size={12} marginTop={2}>
                        {fields.map((field, index) => (
                            <Grid key={field.id} container columnSpacing={1}>
                                <Grid size={fields.length > 1 ? 11 : 12} marginBottom={0.5}>
                                    <Divider />
                                    <Grid container columnSpacing={1}>
                                        <Grid size={{xs:12, md:4}}>
                                            <Div sx={{ mt: 1 }}>
                                                <StoreSelector
                                                    id={`readings-${index}-tank_id`}
                                                    allowSubStores={true}
                                                    label={dictionary.forms.dippings.labels.tank}
                                                    proposedOptions={tanks}
                                                    defaultValue={tanks.find(tank => tank.id === field.tank_id)}
                                                    frontError={errors?.readings?.[index]?.tank_id}
                                                    onChange={(newValue) => {
                                                        setValue(`readings.${index}.tank_id`, newValue ? newValue.id : '', {
                                                            shouldValidate: true,
                                                            shouldDirty: true,
                                                        });
                                                    }}
                                                />
                                            </Div>
                                        </Grid>
                                        <Grid size={{xs:12, md:4}}>
                                            <Div sx={{ mt: 1 }}>
                                                <ProductSelect
                                                    id={`readings-${index}-product_id`}
                                                    label={dictionary.forms.dippings.labels.fuel}
                                                    requiredProducts={products}
                                                    frontError={errors?.readings?.[index]?.product_id}
                                                    defaultValue={productOptions.find(product => product.id === field.product_id)}
                                                    multiple={false}
                                                    onChange={(newValue) => {
                                                        setValue(`readings.${index}.product_id`, newValue ? newValue.id : '', {
                                                            shouldValidate: true,
                                                            shouldDirty: true,
                                                        });
                                                    }}
                                                />
                                            </Div>
                                        </Grid>
                                       <Grid size={{xs:12, md:4}}>
                                            <Div sx={{ mt: 1 }}>
                                                <TextField
                                                    id={`readings-${index}-reading`}
                                                    size="small"
                                                    fullWidth
                                                    error={!!errors?.readings?.[index]?.reading}
                                                    defaultValue={field.reading}
                                                    helperText={errors?.readings?.[index]?.reading?.message}
                                                    label={dictionary.forms.dippings.labels.reading}
                                                    InputProps={{
                                                    inputComponent: CommaSeparatedField,
                                                    }}
                                                    onChange={(e) => {
                                                        setValue(`readings.${index}.reading`, sanitizedNumber(e.target.value), {
                                                            shouldValidate: true,
                                                            shouldDirty: true,
                                                        });
                                                    }}
                                                />
                                            </Div>
                                        </Grid>
                                    </Grid>
                                </Grid>
                                {fields.length > 1 && (
                                    <Grid size={1}>
                                        <Div sx={{ mt: 1 }}>
                                            <Tooltip title={dictionary.tooltips.removeReading}>
                                                <IconButton size="small" onClick={() => remove(index)}>
                                                    <DisabledByDefault fontSize="small" color="error" />
                                                </IconButton>
                                            </Tooltip>
                                        </Div>
                                    </Grid>
                                )}
                            </Grid>
                        ))}
                        <Grid size={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Div sx={{ mt: 1 }}>
                                <Tooltip title={dictionary.tooltips.addReading}>
                                    <Button size="small" variant="outlined" onClick={() => append({ reading: '', tank_id: '', product_id: '' })}>
                                        <AddOutlined fontSize="10" /> {dictionary.forms.dippings.buttons.add}
                                    </Button>
                                </Tooltip>
                            </Div>
                        </Grid>
                    </Grid>
                </Grid>
            </form>
        </DialogContent>
        <DialogActions>
            <Stack spacing={1} direction={'row'} justifyContent={'end'} sx={{ mt: 1, mb: 1 }}>
                <Button size='small' onClick={() => setOpenDialog(false)}>
                    {dictionary.forms.dippings.buttons.cancel}
                </Button>
                <LoadingButton
                    type="submit"
                    onClick={handleSubmit(onSubmit)}
                    variant="contained"
                    size="small"
                    sx={{ display: 'flex' }}
                >
                    {dictionary.forms.dippings.buttons.submit}
                </LoadingButton>
            </Stack>
        </DialogActions>
    </>
  );
};

export default DippingsForm;
