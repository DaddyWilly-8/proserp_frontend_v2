'use client';

import OvertimeTypeForm from '@/components/humanResources/overtimeTypes/OvertimeTypeForm';
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
import { OvertimeType } from './OvertimeType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const EditOvertimeType = ({
  overtimeType,
  setOpenEditDialog,
}: {
  overtimeType: OvertimeType;
  setOpenEditDialog: (open: boolean) => void;
}) => {
  const { data: overtimeTypeData, isFetching } = useQuery({
    queryKey: ['showOvertimeType', overtimeType.id],
    queryFn: () => humanResourcesServices.showOvertimeType(overtimeType.id),
  });
  const queryClient = useQueryClient();

  if (isFetching) {
    return <LinearProgress />;
  }

  return (
    <OvertimeTypeForm
      overtimeType={overtimeTypeData || overtimeType}
      setOpenDialog={(v) => {
        setOpenEditDialog(v);
        if (!v) {
          queryClient.invalidateQueries({ queryKey: ['overtimeTypes'] });
        }
      }}
    />
  );
};

const OvertimeTypeItemAction = ({
  overtimeType,
}: {
  overtimeType: OvertimeType;
}) => {
  const dictionary = useDictionary();
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: deleteOvertimeType } = useMutation({
    mutationFn: humanResourcesServices.deleteOvertimeType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overtimeTypes'] });
      enqueueSnackbar(dictionary.humanResources.overtimeTypes.actions.deleteSuccess, {
        variant: 'success',
      });
    },
    onError: (error: any) => {
      let message = dictionary.humanResources.overtimeTypes.actions.somethingWrong;

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
      title: dictionary.humanResources.overtimeTypes.actions.edit,
      action: 'edit',
    },
    {
      icon: <DeleteOutlined color='error' />,
      title: dictionary.humanResources.overtimeTypes.actions.delete,
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
          title: dictionary.humanResources.overtimeTypes.actions.confirmDeleteTitle,
          content: dictionary.humanResources.overtimeTypes.actions.confirmDeleteContent,
          onYes: () => {
            hideDialog();
            deleteOvertimeType(overtimeType.id);
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
          <EditOvertimeType
            overtimeType={overtimeType}
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

export default OvertimeTypeItemAction;
