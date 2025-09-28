import React, { useMemo } from 'react';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import UsersSelector from '@/components/sharedComponents/UsersSelector';
import StationTabs from './StationTabs';
import stationServices from './station-services';
import type { AddStationResponse, Station, UpdateStationResponse } from './StationType';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { User } from '@/components/prosControl/userManagement/UserManagementType';

interface StationFormProps {
  station?: Station;
  setOpenDialog: (open: boolean) => void;
}

interface FormData {
  id?: any;
  name: string;
  address?: string;
  users: User[];
}

const validationSchema = yup.object({
  name: yup.string().required('Station name is required'),
  address: yup.string().optional(),
  users: yup
    .array()
    .of(
      yup.object({
        id: yup.number().required(),
        name: yup.string().required(),
      })
    )
    .optional(),
});

const StationForm: React.FC<StationFormProps> = ({ station, setOpenDialog }) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { checkOrganizationPermission } = useJumboAuth();
  const canCreateOrEdit = checkOrganizationPermission([PERMISSIONS.FUEL_STATIONS_CREATE, PERMISSIONS.FUEL_STATIONS_UPDATE]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    defaultValues: {
      id: station?.id,
      name: station ? station.name : '',
      address: station?.address || '',
      users: station?.user || [],
    },
    resolver: yupResolver(validationSchema) as any,
  });

  // Watch users field to see current value
  const usersValue = watch('users');

  const { mutate: addStation, isPending: addLoading } = useMutation<AddStationResponse, unknown, Station>({
    mutationFn: stationServices.add,
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['Station'] });
      setOpenDialog(false);
    },
    onError: (error: unknown) => {
      let message = 'Something went wrong';
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as any).response?.data?.message === 'string'
      ) {
        message = (error as any).response.data.message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const { mutate: updateStation, isPending: updateLoading } = useMutation<UpdateStationResponse, unknown, Station & { id: number }>({
    mutationFn: stationServices.update,
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['Station'] });
      setOpenDialog(false);
    },
    onError: (error: unknown) => {
      let message = 'Something went wrong';
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as any).response?.data?.message === 'string'
      ) {
        message = (error as any).response.data.message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const saveMutation = useMemo(() => {
    return station?.id ? updateStation : addStation;
  }, [station, updateStation, addStation]);

  const onSubmit = (formData: FormData) => {
    
    const dataToSend = {
      ...formData,
      user_ids: formData.users.map((user: User) => user.id),
      ...(station?.id ? { id: station.id } : {}),
    };
    
    saveMutation(dataToSend as any);
  };

  // Custom handler for UsersSelector
  const handleUsersChange = (selectedUsers: User[]) => {
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <DialogTitle>
        <Grid container spacing={1}>
          <Grid size={12}>
            <Typography variant="h5" sx={{ textAlign: 'center', mb: 2 }}>
              {station ? `Edit ${station.name}` : 'New Fuel Station'}
            </Typography>
          </Grid>
          
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Station Name"
              size="small"
              {...register('name')}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          </Grid>
          
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Address"
              size="small"
              {...register('address')}
              error={!!errors.address}
              helperText={errors.address?.message}
            />
          </Grid>
          
          <Grid size={{ xs: 12, md: 4 }}>
            <Controller
              name="users"
              control={control}
              render={({ field }) => (
                <UsersSelector
                  multiple
                  defaultValue={field.value || []}
                  onChange={(users) => {
                    console.log('UsersSelector onChange:', users);
                    field.onChange(users || []);
                  }}
                  frontError={errors.users}
                />
              )}
            />
       
          </Grid>
        </Grid>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={1}>
          <Grid size={12}>
            <StationTabs station={station} />
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={() => setOpenDialog(false)} size="small">
          Cancel
        </Button>
        <LoadingButton
          type="submit"
          variant="contained"
          size="small"
          loading={addLoading || updateLoading}
          disabled={!canCreateOrEdit}
        >
          Submit
        </LoadingButton>
      </DialogActions>
    </form>
  );
};

export default StationForm;