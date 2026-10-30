'use client'
import { DeleteOutlined, EditOutlined, MoreHorizOutlined } from '@mui/icons-material';
import { Dialog, Tooltip, useMediaQuery } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MenuItemProps } from '@jumbo/types';
import { JumboDdMenu } from '@jumbo/components';
import ProjectCategoryFormDialog from './ProjectCategoryFormDialog';
import projectCategoryServices from './project-category-services';
import { Category } from './ProjectCategoriesType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const ProjectCategoryListItemAction = ({ projectCategory }: { projectCategory: Category }) => {
  const dictionary = useDictionary();
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: deleteProjectCategory } = useMutation({
    mutationFn: (params: { id: number }) => projectCategoryServices.delete(params),
    onSuccess: (data: { message: string }) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['projectCategories'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || dictionary.projectManagement.projectCategories.deleteFailed,
        { variant: 'error' }
      );
    },
  });

  const menuItems: MenuItemProps[] = [
    { icon: <EditOutlined />, title: dictionary.projectManagement.common.edit, action: 'edit' },
    { icon: <DeleteOutlined color="error" />, title: dictionary.projectManagement.common.delete, action: 'delete' },
  ];

  const handleItemAction = (menuItem: MenuItemProps) => {
    switch (menuItem.action) {
      case 'edit':
        setOpenEditDialog(true);
        break;
      case 'delete':
        showDialog({
          title: dictionary.projectManagement.projectCategories.confirmDeletionTitle,
          content: dictionary.projectManagement.projectCategories.confirmDeletionText,
          onYes: () => {
            hideDialog();
          deleteProjectCategory({ id: projectCategory.id ? projectCategory.id : 0 });
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
<>
  <Dialog
    open={openEditDialog}
    fullWidth
    maxWidth="sm"
    fullScreen={belowLargeScreen}
  >
    <ProjectCategoryFormDialog
      category={projectCategory}
      setOpenDialog={setOpenEditDialog}
    />
  </Dialog>
  <JumboDdMenu
    icon={
      <Tooltip title={dictionary.tooltips.actions}>
        <MoreHorizOutlined fontSize="small" />
      </Tooltip>
    }
    menuItems={menuItems}
    onClickCallback={handleItemAction}
  />
</>
);
};

export default ProjectCategoryListItemAction;
