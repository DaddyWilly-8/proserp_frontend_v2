import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { DeleteOutlined, MoreHorizOutlined } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { useSnackbar } from 'notistack';
import React from 'react';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MenuItemProps } from '@jumbo/types';
import { JumboDdMenu } from '@jumbo/components';
import projectsServices from './project-services';
import { Project } from './ProjectTypes';

const ProjectListItemAction = ({ project }: { project: Project }) => {
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { checkOrganizationPermission } = useJumboAuth();

  const { mutate: deleteProject } = useMutation({
    mutationFn: (params: { id: number }) => projectsServices.deleteProject(params.id),
      onSuccess: (data: { message: string }) => {
        enqueueSnackbar(data.message || 'Successfull delete project', { variant: 'success' });
        queryClient.invalidateQueries({ queryKey: ['projects'] });
      },
      onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || 'Failed to delete project',
        { variant: 'error' }
      );
    },
  });

  const menuItems: MenuItemProps[] = [
    checkOrganizationPermission(PERMISSIONS.PROJECTS_DELETE) && {
      icon: <DeleteOutlined color="error" />,
      title: 'Delete',
      action: 'delete',
    },
  ].filter(Boolean) as MenuItemProps[];

  const handleItemAction = (menuItem: MenuItemProps) => {
    switch (menuItem.action) {
      case 'delete':
        showDialog({
          title: 'Confirm Project Deletion',
          content: 'Are you sure you want to delete this project?',
          onYes: () => {
            hideDialog();
            deleteProject({ id: project.id ?? 0 });
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
    <JumboDdMenu
      icon={
        <Tooltip title="Actions">
          <MoreHorizOutlined fontSize="small" />
        </Tooltip>
      }
      menuItems={menuItems}
      onClickCallback={handleItemAction}
    />
  );
};

export default ProjectListItemAction;
