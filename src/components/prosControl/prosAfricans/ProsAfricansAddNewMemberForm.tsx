import { yupResolver } from '@hookform/resolvers/yup'
import { Grid, LinearProgress, TextField } from '@mui/material'
import { useSnackbar } from 'notistack'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import { LoadingButton } from '@mui/lab'
import prosAfricansServices from './prosAfricansServices'
import { ProsAfricansAddNewMemberQueue } from './addQueue/ProsAfricansAddNewMemberQueue'
import { useQuery } from '@tanstack/react-query'
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface Role {
  id: string;
  name: string;
  [key: string]: any;
}

interface User {
  id?: string;
  name: string;
  email: string;
  roles?: Role[];
  selectedRoles?: Role[] | number[];
}

interface FormData {
  email: string;
}

function ProsAfricansAddNewMemberForm() {
    const dictionary = useDictionary();
    const [addNewProsAfrican, setAddNewProsAfrican] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    // Hooks definitions
    const { enqueueSnackbar } = useSnackbar();

    // ValidationSchema
    const validationSchema = yup.object({
        email: yup.string()
          .required(dictionary.forms.prosAfricans.form.errors.emailRequired)
          .matches(
            /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
            { message: dictionary.forms.prosAfricans.form.errors.emailInvalid },
          ),
    });

    const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
        resolver: yupResolver(validationSchema),
        defaultValues: {
            email: '',
        }
    });

    const { data: ProsAfricansroles = [], isLoading: isLoadingRoles, isFetching: isFetchingRoles } = useQuery<Role[]>({
        queryKey: ['prosAfricansRoles'],
        queryFn: prosAfricansServices.roles
    });

    if (isLoadingRoles || isFetchingRoles) {
        return <LinearProgress/>;
    }
      
    const checkMember = async (data: FormData) => {
        const { email } = data;
        
        try {
            setLoading(true);
            const response = await prosAfricansServices.checkMember(email);
      
            // Check if the response contains the message indicating that the user is already a ProsAfrican
            if (response.message === "This user is already a ProsAfrican") {
                enqueueSnackbar(response.message, { variant: 'error' });
                reset();
            } else {
                // if not a member continue
                const user: User = {
                    ...response,
                    roles: ProsAfricansroles,
                    selectedRoles: [],
                };
      
                if (addNewProsAfrican.some(obj => obj.email === user.email)) {
                    enqueueSnackbar(dictionary.forms.prosAfricans.form.messages.alreadyQueued, { variant: 'error' });
                } else {
                    setAddNewProsAfrican(prev => [...prev, user]);
                    reset();
                }
            }
        } catch (error: any) {
            // Handle errors
            if (error?.response) {
                if (error.response.status === 404) {
                    const user: User = {
                        name: 'Not Registered',
                        email: email,
                    };
      
                    let message;
                    if (addNewProsAfrican.some(obj => obj.email === user.email)) {
                        message = dictionary.forms.prosAfricans.form.messages.alreadyQueued;
                        reset();
                    } else {
                        message = dictionary.forms.prosAfricans.form.messages.notFound;
                        reset();
                    }
      
                    enqueueSnackbar(message, { variant: 'info' });
                } else {
                    enqueueSnackbar(error.response?.data?.message, { variant: 'error' });
                    reset();
                }
            } else {
                enqueueSnackbar(dictionary.forms.prosAfricans.form.messages.somethingWrong, { variant: 'error' });
                reset();
            }
        } finally {
            setLoading(false);
        }
    };
      

    return (
        <form onSubmit={handleSubmit(checkMember)}>
            <Grid container columnSpacing={1} paddingRight={1}>
                <Grid size={{ xs: 10 }}>
                    <TextField
                        label={dictionary.forms.prosAfricans.form.labels.email}
                        fullWidth
                        size='small'
                        error={!!errors?.email}
                        helperText={errors?.email?.message}
                        {...register('email')}
                    />
                </Grid>
                <Grid size={{ xs: 2 }}>
                    <LoadingButton 
                        size='small'
                        variant='contained'
                        type='submit'
                        sx={{ mb: 4, display: 'flex' }}
                        loading={loading}
                    >
                        {dictionary.forms.prosAfricans.form.buttons.add}
                    </LoadingButton>
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <ProsAfricansAddNewMemberQueue 
                        addNewProsAfrican={addNewProsAfrican as any}
                        setAddNewProsAfrican={setAddNewProsAfrican as any}
                    />
                </Grid>
            </Grid>
        </form>
    );
}

export default ProsAfricansAddNewMemberForm;