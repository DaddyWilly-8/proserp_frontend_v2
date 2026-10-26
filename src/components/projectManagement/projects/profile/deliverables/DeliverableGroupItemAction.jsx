'use client'
import { Dialog, IconButton, Tooltip, useMediaQuery } from '@mui/material';
import React, { useState } from 'react';
import {
  DeleteOutlined,
  EditOutlined,
  MoreHorizOutlined,
  PlaylistAddCheck,
} from '@mui/icons-material';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useSnackbar } from 'notistack';
import DeliverablesForm from './DeliverablesForm';
import DeliverableGroupForm from './DeliverableGroupForm';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import projectsServices from '../../project-services';
import { JumboDdMenu } from '@jumbo/components';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

function DeliverableGroupItemAction({ group, isAccDetails }) {
  const dictionary = useDictionary();
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const queryClient = useQueryClient();
  const { checkOrganizationPermission } = useJumboAuth();

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const deleteDeliverableGroup = useMutation({
    mutationFn: projectsServices.deleteDeliverableGroup,
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['projectDeliverableGroups'] });
    },
    onError: (error) => {
      enqueueSnackbar(error?.response?.data?.message || dictionary.projectManagement.deliverables.failedToDelete, {
        variant: 'error',
      });
    },
  });

  const menuItems = [
    checkOrganizationPermission(PERMISSIONS.PROJECTS_EDIT) && {
      icon: <EditOutlined />,
      title: dictionary.projectManagement.deliverables.edit,
      action: 'edit',
    },
    checkOrganizationPermission(PERMISSIONS.PROJECTS_DELETE) &&
      !(group.children.length > 0 || group.deliverables.length > 0) && {
        icon: <DeleteOutlined color="error" />,
        title: dictionary.projectManagement.deliverables.delete,
        action: 'delete',
      },
  ].filter(Boolean); // ✅ filter to remove false entries

  const handleItemAction = (menuItem) => {
    switch (menuItem.action) {
      case 'edit':
        setOpenEditDialog(true);
        break;
      case 'delete':
        showDialog({
          title: dictionary.projectManagement.deliverables.confirmDelete,
          content: dictionary.projectManagement.deliverables.confirmDeleteGroupText,
          onYes: () => {
            hideDialog();
            deleteDeliverableGroup.mutate(group);
          },
          onNo: () => hideDialog(),
          variant: 'confirm',
        });
        break;
      default:
        break;
    }
  };

  return (
    <React.Fragment>
      {/* Dialog for editing & adding deliverables */}
      <Dialog
        open={openEditDialog || openDialog}
        fullScreen={belowLargeScreen}
        fullWidth
        maxWidth="md"
        scroll={belowLargeScreen ? 'body' : 'paper'}
      >
        {openEditDialog && (
          <DeliverableGroupForm
            deliverableGroup={group}
            setOpenDialog={setOpenEditDialog}
          />
        )}
        {openDialog && (
          <DeliverablesForm setOpenDialog={setOpenDialog} group={group} />
        )}
      </Dialog>

      {!isAccDetails && (
        <JumboDdMenu
          icon={
            <Tooltip title={dictionary.tooltips.actions}>
              <MoreHorizOutlined />
            </Tooltip>
          }
          menuItems={menuItems}
          onClickCallback={handleItemAction}
        />
      )}

      {/* Add Deliverable (for account details view) */}
      {!!isAccDetails && checkOrganizationPermission(PERMISSIONS.PROJECTS_EDIT) && (
        <Tooltip title={dictionary.tooltips.addDeliverable}>
          <IconButton onClick={() => setOpenDialog(true)}>
            <PlaylistAddCheck />
          </IconButton>
        </Tooltip>
      )}
    </React.Fragment>
  );
}

export default DeliverableGroupItemAction;
