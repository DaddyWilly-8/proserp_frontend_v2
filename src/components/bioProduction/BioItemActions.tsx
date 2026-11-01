'use client'

import React, { useState } from 'react';
import { DeleteOutlined, EditOutlined, MoreHorizOutlined } from '@mui/icons-material';
import { Dialog, Tooltip, useMediaQuery } from '@mui/material';
import { JumboDdMenu } from '@jumbo/components';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { MenuItemProps } from '@jumbo/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { BioFormProps } from './types';

interface BioItemActionsProps<T extends { id: number }> {
  item: T;
  queryKey: string;
  deleteService: (id: number) => Promise<{ message: string }>;
  deleteContent: string;
  Form: React.ComponentType<BioFormProps<T>>;
  canEdit?: boolean;
  canDelete?: boolean;
}

/** The edit / delete menu on a Bio Production master's list row. */
function BioItemActions<T extends { id: number }>({ item, queryKey, deleteService, deleteContent, Form, canEdit = true, canDelete = true }: BioItemActionsProps<T>) {
  const dictionary = useDictionary();
  const common = dictionary.bioProduction.common;
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: remove } = useMutation({
    mutationFn: deleteService,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      enqueueSnackbar(data.message, { variant: 'success' });
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const menuItems = [
    ...(canEdit ? [{ icon: <EditOutlined />, title: common.edit, action: 'edit' }] : []),
    ...(canDelete ? [{ icon: <DeleteOutlined color='error' />, title: common.delete, action: 'delete' }] : []),
  ];

  const handleItemAction = (menuItem: MenuItemProps) => {
    if (menuItem.action === 'edit') {
      setOpenEditDialog(true);
    } else if (menuItem.action === 'delete') {
      showDialog({
        title: common.confirmDeleteTitle,
        content: deleteContent,
        onYes: () => {
          hideDialog();
          remove(item.id);
        },
        onNo: () => hideDialog(),
        variant: 'confirm',
      });
    }
  };

  if (menuItems.length === 0) return null;

  return (
    <>
      <Dialog open={openEditDialog} fullWidth maxWidth='md' fullScreen={belowLargeScreen}>
        {openEditDialog && <Form item={item} setOpenDialog={setOpenEditDialog} />}
      </Dialog>
      <JumboDdMenu
        icon={
          <Tooltip title={common.actions}>
            <MoreHorizOutlined fontSize='small' />
          </Tooltip>
        }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />
    </>
  );
}

export default BioItemActions;
