'use client';

import { JumboDdMenu } from '@jumbo/components';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { MenuItemProps } from '@jumbo/types';
import {
  DeleteOutlined,
  EditOutlined,
  MoreHorizOutlined,
} from '@mui/icons-material';
import { Dialog, LinearProgress, Tooltip, useMediaQuery } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import DesignationForm from './DesignationForm';
import { Designation } from './DesignationsType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const EditDesignation = ({
  designation,
  setOpenEditDialog,
}: {
  designation: Designation;
  setOpenEditDialog: (open: boolean) => void;
}) => {
  const { data: designationData, isFetching } = useQuery({
    queryKey: ['showDesignation', designation.id],
    queryFn: () => humanResourcesServices.showDesignation(designation.id),
  });
  const queryClient = useQueryClient();

  if (isFetching) {
    return <LinearProgress />;
  }

  return (
    <DesignationForm
      designation={designationData || designation}
      setOpenDialog={(v) => {
        setOpenEditDialog(v);
        if (!v) {
          queryClient.invalidateQueries({ queryKey: ['designations'] });
        }
      }}
    />
  );
};

const DesignationItemAction = ({
  designation,
}: {
  designation: Designation;
}) => {
  const dictionary = useDictionary();
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  //Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: deleteDesignation } = useMutation({
    mutationFn: humanResourcesServices.deleteDesignation,
    onSuccess: (data: { message: string }) => {
      queryClient.invalidateQueries({ queryKey: ['designations'] });
      enqueueSnackbar(dictionary.humanResources.designations.actions.deleteSuccess, {
        variant: 'success',
      });
    },
    onError: (error: any) => {
      let message = dictionary.humanResources.designations.actions.somethingWrong;

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

  const menuItems = [
    {
      icon: <EditOutlined />,
      title: dictionary.humanResources.designations.actions.edit,
      action: 'edit',
    },
    {
      icon: <DeleteOutlined color='error' />,
      title: dictionary.humanResources.designations.actions.delete,
      action: 'delete',
    },
  ];

  const handleItemAction = (menuItem: MenuItemProps) => {
    switch (menuItem.action) {
      case 'edit':
        setOpenEditDialog(true);
        break;
      case 'delete':
        showDialog({
          title: dictionary.humanResources.designations.actions.confirmDeleteTitle,
          content: dictionary.humanResources.designations.actions.confirmDeleteContent,
          onYes: () => {
            hideDialog();
            deleteDesignation(designation.id);
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
        maxWidth='md'
        fullScreen={belowLargeScreen}
      >
        {openEditDialog && (
          <EditDesignation
            designation={designation}
            setOpenEditDialog={setOpenEditDialog}
          />
        )}
      </Dialog>
      <JumboDdMenu
        icon={
          <Tooltip title={dictionary.tooltips.actions}>
            <MoreHorizOutlined fontSize='small' />
          </Tooltip>
        }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />
    </>
  );
};

export default DesignationItemAction;
