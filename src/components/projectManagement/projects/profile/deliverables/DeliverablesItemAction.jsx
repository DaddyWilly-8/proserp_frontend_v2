'use client'
import { DeleteOutlined, EditOutlined, MoreHorizOutlined } from '@mui/icons-material';
import { Dialog,Tooltip, useMediaQuery } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import DeliverablesForm from './DeliverablesForm';
import projectsServices from '../../project-services';
import { JumboDdMenu } from '@jumbo/components';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const DeliverablesItemAction = ({ deliverable}) => {
    const dictionary = useDictionary();
    const [openEditDialog,setOpenEditDialog] = useState(false);
    const {showDialog,hideDialog} = useJumboDialog();
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();
    const { checkOrganizationPermission } = useJumboAuth();

    //Screen handling constants
    const {theme} = useJumboTheme();
    const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

    // React Query v5 syntax for useMutation
    const { mutate: deleteDeliverable } = useMutation({
        mutationFn: projectsServices.deleteDeliverable,
        onSuccess: (data) => {
            queryClient.invalidateQueries({queryKey: ['projectDeliverableGroups']});
            enqueueSnackbar(data.message, {
                variant: 'success',
            });
        },
        onError: (error) => {
            enqueueSnackbar(error?.response?.data.message,{variant : 'error'});
        },
    });

    const menuItems = [
        checkOrganizationPermission(PERMISSIONS.PROJECTS_EDIT) && {icon: <EditOutlined/>, title: dictionary.projectManagement.deliverables.edit, action: 'edit'},
        checkOrganizationPermission(PERMISSIONS.PROJECTS_DELETE) && {icon: <DeleteOutlined color='error'/>, title: dictionary.projectManagement.deliverables.delete, action: 'delete'}
    ].filter(Boolean);

  const handleItemAction = (menuItem) => {
    switch (menuItem.action) {
      case 'edit':
        setOpenEditDialog(true);
        break;
      case 'delete':
        showDialog({
            title: dictionary.projectManagement.deliverables.confirmDelete,
            content: dictionary.projectManagement.deliverables.confirmDeleteText,
            onYes: () =>{ 
                hideDialog();
                deleteDeliverable(deliverable.id)
            },
            onNo: () => hideDialog(),
            variant:'confirm'
        });
        break;
        default:
        break;
    }
  }

  return (
    <>
        <Dialog
            open={openEditDialog}
            fullWidth  
            fullScreen={belowLargeScreen}
            maxWidth={'md'} 
            scroll={belowLargeScreen ? 'body' : 'paper'}
        >
            <DeliverablesForm deliverable={deliverable} setOpenDialog={setOpenEditDialog} />
        </Dialog>
        <JumboDdMenu
            icon={
                <Tooltip title={dictionary.tooltips.actions}>
                    <MoreHorizOutlined/>
                </Tooltip>
            }
            menuItems={menuItems}
            onClickCallback={handleItemAction}
        />
    </>
  );
};

export default DeliverablesItemAction;