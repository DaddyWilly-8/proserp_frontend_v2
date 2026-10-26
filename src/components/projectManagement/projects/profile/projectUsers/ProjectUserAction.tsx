import React, { useState } from 'react';
import { IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { LinkOffOutlined } from '@mui/icons-material';
import projectsServices from '../../project-services';
import { useProjectProfile } from '../ProjectProfileProvider';
import { LoadingButton } from '@mui/lab';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface ProjectUserActionProps {
    user: {
        id: string;
        name: string;
    };
}

function ProjectUserAction({ user }: ProjectUserActionProps) {
    const dictionary = useDictionary();
    const [openDialog, setOpenDialog] = useState(false);
    const { project }: any = useProjectProfile();
    const costCenterId = project?.cost_center?.id;

    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    const detachUserMutation = useMutation({
        mutationFn: (payload: { user_ids: string[] }) =>
            projectsServices.detachUsers(costCenterId, payload),

        onSuccess: (data) => {
            enqueueSnackbar(data?.message || dictionary.projectManagement.projectUsers.detachSuccess, { variant: "success" });
            queryClient.invalidateQueries({ queryKey: ["projectUsers"] });
            setOpenDialog(false);
        },
        onError: (error: any) => {
            const msg = error?.response?.data?.message || dictionary.projectManagement.projectUsers.errorOccurred;
            enqueueSnackbar(msg, { variant: "error" });
        }
    });

    const handleDetach = () => {
        detachUserMutation.mutate({ user_ids: [user.id] });
    };

    return (
        <>
            <Tooltip title={dictionary.tooltips.detachUser}>
                <IconButton color="error" onClick={() => setOpenDialog(true)}>
                    <LinkOffOutlined />
                </IconButton>
            </Tooltip>

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>{dictionary.projectManagement.projectUsers.detachUser}</DialogTitle>

                <DialogContent>
                    <Typography>
                        {dictionary.projectManagement.projectUsers.detachConfirmPrefix}<strong>{user.name}</strong>{dictionary.projectManagement.projectUsers.detachConfirmSuffix}
                    </Typography>
                </DialogContent>

                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)} size="small">
                        {dictionary.projectManagement.common.cancel}
                    </Button>
                    <LoadingButton
                        variant="contained"
                        color="error"
                        onClick={handleDetach}
                        size="small"
                        loading={detachUserMutation.isPending}
                    >
                        {detachUserMutation.isPending ? dictionary.projectManagement.projectUsers.detaching : dictionary.projectManagement.projectUsers.detach}
                    </LoadingButton>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default ProjectUserAction;