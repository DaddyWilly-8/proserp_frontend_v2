import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  Checkbox,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import InfoHint from '@/components/bioProduction/InfoHint';
import measurementUnitServices from './measurement-unit-services';
import { MeasurementUnit } from './MeasurementUnitType';

interface MeasurementUnitFormProps {
  setOpenDialog: (open: boolean) => void;
  measurementUnit?: MeasurementUnit | null;
  addNewUnit?: (value: any) => void;
}

interface FormData extends Omit<MeasurementUnit, 'id'> {
  id?: number;
}

interface ApiResponse {
  message: string;
  validation_errors?: {
    name?: string;
    symbol?: string;
  };
}

const MeasurementUnitForm: React.FC<MeasurementUnitFormProps> = ({
  setOpenDialog,
  measurementUnit = null,
  addNewUnit = () => {},
}) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const dictionary = useDictionary();

  const {
    mutate: addMeasurementUnit,
    isPending,
    error,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: measurementUnitServices.add,
    onSuccess: (data) => {
      setOpenDialog(false);
      addNewUnit?.(data);
      enqueueSnackbar(dictionary.measurementUnits.form.messages.createSuccess, {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['allMeasurementUnits'] });
      queryClient.invalidateQueries({ queryKey: ['measurementUnitsOptions'] });
      queryClient.invalidateQueries({ queryKey: ['measurementUnits'] });
    },
    onError: (error) => {
      enqueueSnackbar(
        dictionary.measurementUnits.form.errors.messages.createResponse,
        {
          variant: 'error',
        }
      );
    },
  });

  const {
    mutate: updateMeasurementUnit,
    isPending: updateIsLoading,
    error: updateError,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: measurementUnitServices.update,
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar(dictionary.measurementUnits.form.messages.updateSuccess, {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['measurementUnits'] });
    },
    onError: (error) => {
      enqueueSnackbar(
        dictionary.measurementUnits.form.errors.messages.deleteResponse,
        {
          variant: 'error',
        }
      );
    },
  });

  const saveMutation = React.useMemo(() => {
    return measurementUnit?.id ? updateMeasurementUnit : addMeasurementUnit;
  }, [measurementUnit, updateMeasurementUnit, addMeasurementUnit]);

  const validationSchema = yup.object({
    name: yup
      .string()
      .required(
        dictionary.measurementUnits.form.errors.validation.name.required
      ),
    symbol: yup
      .string()
      .required(
        dictionary.measurementUnits.form.errors.validation.symbol.required
      )
      .max(
        10,
        dictionary.measurementUnits.form.errors.validation.symbol.invalid
      ),
    description: yup.string().nullable(),
    dimension: yup.string().nullable(),
    base_factor: yup
      .number()
      .transform((value, original) => (original === '' || original == null ? null : value))
      .nullable()
      .when('dimension', {
        is: (dimension: string) => !!dimension,
        then: (schema) => schema.required(dictionary.measurementUnits.form.labels.factorRequired).moreThan(0, dictionary.measurementUnits.form.labels.factorRequired),
      }),
  });
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      name: measurementUnit?.name || '',
      symbol: measurementUnit?.symbol || '',
      description: measurementUnit?.description || '',
      // Matches the column's own default: every existing/new unit allows
      // fractional quantities until someone explicitly turns it off for a
      // discrete unit (Pieces, Units, Boxes...).
      dimension: (measurementUnit?.dimension ?? '') as FormData['dimension'],
      base_factor: measurementUnit?.base_factor != null ? Number(measurementUnit.base_factor) : ('' as any),
      allows_fractional: measurementUnit?.id
        ? measurementUnit?.allows_fractional !== false
        : true,
    },
  });

  useEffect(() => {
    if (measurementUnit?.id) {
      setValue('id', measurementUnit.id);
    }
  }, [measurementUnit, setValue]);

  const onSubmit = (data: FormData) => {
    saveMutation(data);
  };

  return (
    <>
      <DialogTitle>
        <Grid size={12} textAlign={'center'}>
          {!measurementUnit?.id
            ? dictionary.measurementUnits.form.title
            : dictionary.measurementUnits.form.pageTitle.replace(
                '{name}',
                measurementUnit.name ?? ''
              )}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label={dictionary.measurementUnits.list.labels.name}
                  placeholder={
                    dictionary.measurementUnits.form.placeholders.UnitName
                  }
                  size='small'
                  fullWidth
                  error={
                    !!errors?.name ||
                    !!error?.response?.data?.validation_errors?.name ||
                    !!updateError?.response?.data?.validation_errors?.name
                  }
                  helperText={
                    errors.name?.message ||
                    error?.response?.data?.validation_errors?.name ||
                    updateError?.response?.data?.validation_errors?.name
                  }
                  {...register('name')}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label={dictionary.measurementUnits.form.labels.symbol}
                  placeholder={
                    dictionary.measurementUnits.form.placeholders.unitSymbol
                  }
                  size='small'
                  fullWidth
                  error={
                    !!errors?.symbol ||
                    !!error?.response?.data?.validation_errors?.symbol ||
                    !!updateError?.response?.data?.validation_errors?.symbol
                  }
                  helperText={
                    errors.symbol?.message ||
                    error?.response?.data?.validation_errors?.symbol ||
                    updateError?.response?.data?.validation_errors?.symbol
                  }
                  {...register('symbol')}
                />
              </Div>
            </Grid>
            <Grid size={12}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label={dictionary.measurementUnits.form.labels.description}
                  placeholder={
                    dictionary.measurementUnits.form.placeholders.description
                  }
                  size='small'
                  multiline
                  minRows={2}
                  fullWidth
                  {...register('description')}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: watch('dimension') ? 6 : 12 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Stack direction='row' alignItems='center' spacing={0.5}>
                <TextField
                  select
                  size='small'
                  fullWidth
                  label={dictionary.measurementUnits.form.labels.dimension}
                  value={watch('dimension') ?? ''}
                  onChange={(event) => {
                    setValue('dimension', (event.target.value || null) as FormData['dimension']);
                    if (!event.target.value) setValue('base_factor', '' as any);
                  }}
                >
                  <MenuItem value=''>{dictionary.measurementUnits.form.labels.dimensions.none}</MenuItem>
                  {(['mass', 'volume', 'length'] as const).map((dimension) => (
                    <MenuItem key={dimension} value={dimension}>{dictionary.measurementUnits.form.labels.dimensions[dimension]}</MenuItem>
                  ))}
                </TextField>
                <InfoHint text={dictionary.measurementUnits.form.labels.dimensionHelp} />
                </Stack>
              </Div>
            </Grid>
            {!!watch('dimension') && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <TextField
                    type='number'
                    size='small'
                    fullWidth
                    label={`${dictionary.measurementUnits.form.labels.baseFactor} (${dictionary.measurementUnits.form.labels.reference[watch('dimension') as 'mass']})`}
                    slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                    error={!!errors.base_factor}
                    helperText={errors.base_factor?.message as string}
                    {...register('base_factor')}
                  />
                </Div>
              </Grid>
            )}
            <Grid size={12}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!watch('allows_fractional')}
                      onChange={(e) =>
                        setValue('allows_fractional', e.target.checked)
                      }
                    />
                  }
                  label='Allows fractional quantities (uncheck for whole-units-only, e.g. Pieces)'
                />
              </Div>
            </Grid>
          </Grid>
          <DialogActions>
            <Button size='small' onClick={() => setOpenDialog(false)}>
              {dictionary.measurementUnits.form.buttons.cancel}
            </Button>
            <LoadingButton
              type='submit'
              variant='contained'
              size='small'
              sx={{ display: 'flex' }}
              loading={isPending || updateIsLoading}
            >
              {dictionary.measurementUnits.form.buttons.submit}
            </LoadingButton>
          </DialogActions>
        </form>
      </DialogContent>
    </>
  );
};

export default MeasurementUnitForm;
