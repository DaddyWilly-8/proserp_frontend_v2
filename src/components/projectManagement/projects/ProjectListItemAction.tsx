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
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const ProjectListItemAction = ({ project }: { project: Project }) => {
  const dictionary = useDictionary();
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { checkOrganizationPermission } = useJumboAuth();

  const { mutate: deleteProject } = useMutation({
    mutationFn: (params: { id: number }) => projectsServices.deleteProject(params.id),
      onSuccess: (data: { message: string }) => {
        enqueueSnackbar(data.message || dictionary.projectManagement.projects.deleteSuccess, { variant: 'success' });
        queryClient.invalidateQueries({ queryKey: ['projects'] });
      },
      onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || dictionary.projectManagement.projects.deleteFailed,
        { variant: 'error' }
      );
    },
  });

  const menuItems: MenuItemProps[] = [
    checkOrganizationPermission(PERMISSIONS.PROJECTS_DELETE) && {
      icon: <DeleteOutlined color="error" />,
      title: dictionary.projectManagement.projects.delete,
      action: 'delete',
    },
  ].filter(Boolean) as MenuItemProps[];

  const handleItemAction = (menuItem: MenuItemProps) => {
    switch (menuItem.action) {
      case 'delete':
        showDialog({
          title: dictionary.projectManagement.projects.confirmDeletionTitle,
          content: dictionary.projectManagement.projects.confirmDeletionText,
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
        <Tooltip title={dictionary.tooltips.actions}>
          <MoreHorizOutlined fontSize="small" />
        </Tooltip>
      }
      menuItems={menuItems}
      onClickCallback={handleItemAction}
    />
  );
};

export default ProjectListItemAction;
