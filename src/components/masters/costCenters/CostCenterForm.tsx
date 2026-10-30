import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { yupResolver } from '@hookform/resolvers/yup';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import React from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import UsersSelector from '../../sharedComponents/UsersSelector';
import costCenterservices from './cost-center-services';
import { CostCenter } from './CostCenterType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface User {
  id: number;
  name: string;
  [key: string]: any;
}

interface CostCenterFormProps {
  setOpenDialog: (open: boolean) => void;
  costCenter?: CostCenter | null;
}

interface FormData extends Omit<CostCenter, 'users' | 'cost_centerable'> {
  user_ids: number[];
}

interface CostCenterResponse {
  message: string;
}

const CostCenterForm: React.FC<CostCenterFormProps> = ({
  setOpenDialog,
  costCenter,
}) => {
  const dictionary = useDictionary();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { mutate: addCostCenter, isPending } = useMutation({
    mutationFn: costCenterservices.add,
    onSuccess: (data: CostCenterResponse) => {
      setOpenDialog(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['costCenters'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(getErrorMessage(error), {
        variant: 'error',
      });
    },
  });

  const { mutate: updateCostCenter, isPending: updateIsLoading } = useMutation({
    mutationFn: costCenterservices.update,
    onSuccess: (data: CostCenterResponse) => {
      setOpenDialog(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['costCenters'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(getErrorMessage(error), {
        variant: 'error',
      });
    },
  });

  const validationSchema = yup.object({
    name: yup.string().required(dictionary.forms.costCenters.form.errors.validation.nameRequired),
    description: yup.string().nullable(),
    user_ids: yup
      .array()
      .of(yup.number())
      .min(1, dictionary.forms.costCenters.form.errors.validation.usersRequired),
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: costCenter?.id,
      name: costCenter?.name || '',
      code: costCenter?.code || null,
      description: costCenter?.description || null,
      status: costCenter?.status || '',
      type: costCenter?.type || '',
      user_ids: costCenter?.users?.map((user: User) => Number(user.id)) || [],
    },
  });

  const onSubmit = (data: FormData) => {
    if (costCenter?.id) {
      updateCostCenter({ ...data, id: costCenter.id });
    } else {
      addCostCenter(data);
    }
  };

  return (
    <>
      <DialogTitle>
        <Grid container justifyContent='center'>
          {costCenter ? dictionary.forms.costCenters.form.title.edit.replace('{name}', costCenter.name) : dictionary.forms.costCenters.form.title.create}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <TextField
                label={dictionary.forms.costCenters.form.labels.name}
                fullWidth
                size='small'
                variant='outlined'
                error={!!errors.name}
                helperText={errors.name?.message}
                {...register('name')}
              />
            </Grid>

            <Grid size={12}>
              <UsersSelector
                label={dictionary.forms.costCenters.form.labels.users}
                multiple={true}
                defaultValue={costCenter?.users}
                onChange={(value: User | User[] | null) => {
                  const usersArray = value
                    ? Array.isArray(value)
                      ? value
                      : [value]
                    : [];
                  setValue(
                    'user_ids',
                    usersArray.map((u) => Number(u.id)),
                    {
                      shouldValidate: true,
                    }
                  );
                }}
                frontError={errors.user_ids}
              />
            </Grid>

            <Grid size={12}>
              <TextField
                label={dictionary.forms.costCenters.form.labels.description}
                fullWidth
                size='small'
                multiline
                rows={2}
                variant='outlined'
                {...register('description')}
              />
            </Grid>
          </Grid>

          <DialogActions sx={{ mt: 2 }}>
            <Button size='small' onClick={() => setOpenDialog(false)}>
              {dictionary.forms.costCenters.form.buttons.cancel}
            </Button>
            <LoadingButton
              type='submit'
              variant='contained'
              size='small'
              loading={isPending || updateIsLoading}
            >
              {costCenter ? dictionary.forms.costCenters.form.buttons.update : dictionary.forms.costCenters.form.buttons.create}
            </LoadingButton>
          </DialogActions>
        </form>
      </DialogContent>
    </>
  );
};

export default CostCenterForm;
