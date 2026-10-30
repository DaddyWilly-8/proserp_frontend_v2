'use client';

import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { yupResolver } from '@hookform/resolvers/yup';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  TextField,
} from '@mui/material';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { FC, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface ChangePasswordFormValues {
  current_password: string;
  password: string;
  password_confirmation: string;
}

interface ChangePasswordFormProps {
  open: boolean;
  toggleOpen: (open: boolean) => void;
}

const buildValidationSchema = (dictionary: any) => yup.object({
  current_password: yup.string().required(dictionary.forms.changePassword.errors.currentRequired),
  password: yup
    .string()
    .required(dictionary.forms.changePassword.errors.newRequired)
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/,
      dictionary.forms.changePassword.errors.complexity
    ),
  password_confirmation: yup
    .string()
    .required(dictionary.forms.changePassword.errors.confirmationRequired)
    .oneOf([yup.ref('password')], dictionary.forms.changePassword.errors.mismatch),
});

const ChangePasswordForm: FC<ChangePasswordFormProps> = ({
  open,
  toggleOpen,
}) => {
  const dictionary = useDictionary();
  const { enqueueSnackbar } = useSnackbar();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] =
    useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: yupResolver(buildValidationSchema(dictionary)),
    defaultValues: {
      current_password: '',
      password: '',
      password_confirmation: '',
    },
  });

  const handleClose = () => {
    reset();
    toggleOpen(false);
  };

  const onSubmit = async (data: ChangePasswordFormValues) => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await axios.post('/api/auth/change-password', {
        ...data,
        timezone,
      });
      enqueueSnackbar(response.data.message, { variant: 'success' });
      handleClose();
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err), { variant: 'error' });
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth='xs'>
      <form onSubmit={handleSubmit(onSubmit)} noValidate autoComplete='off'>
        <DialogTitle>{dictionary.forms.changePassword.title}</DialogTitle>
        <DialogContent>
          <Controller
            name='current_password'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                margin='normal'
                label={dictionary.forms.changePassword.labels.currentPassword}
                type={showCurrentPassword ? 'text' : 'password'}
                error={!!errors.current_password}
                helperText={errors.current_password?.message}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton
                          onClick={() =>
                            setShowCurrentPassword((show) => !show)
                          }
                          edge='end'
                          tabIndex={-1}
                        >
                          {showCurrentPassword ? (
                            <VisibilityOff />
                          ) : (
                            <Visibility />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            )}
          />
          <Controller
            name='password'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                margin='normal'
                label={dictionary.forms.changePassword.labels.newPassword}
                type={showPassword ? 'text' : 'password'}
                error={!!errors.password}
                helperText={errors.password?.message}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton
                          onClick={() => setShowPassword((show) => !show)}
                          edge='end'
                          tabIndex={-1}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            )}
          />
          <Controller
            name='password_confirmation'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                margin='normal'
                label={dictionary.forms.changePassword.labels.confirmNewPassword}
                type={showPasswordConfirmation ? 'text' : 'password'}
                error={!!errors.password_confirmation}
                helperText={errors.password_confirmation?.message}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton
                          onClick={() =>
                            setShowPasswordConfirmation((show) => !show)
                          }
                          edge='end'
                          tabIndex={-1}
                        >
                          {showPasswordConfirmation ? (
                            <VisibilityOff />
                          ) : (
                            <Visibility />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isSubmitting}>
            {dictionary.forms.changePassword.buttons.cancel}
          </Button>
          <LoadingButton
            type='submit'
            variant='contained'
            loading={isSubmitting}
          >
            {dictionary.forms.changePassword.buttons.submit}
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ChangePasswordForm;
