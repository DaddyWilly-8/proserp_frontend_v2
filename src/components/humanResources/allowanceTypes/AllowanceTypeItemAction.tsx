'use client';

import AllowanceTypeForm from '@/components/humanResources/allowanceTypes/AllowanceTypeForm';
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
import { AllowanceType } from './AllowanceType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const EditAllowanceType = ({
  allowanceType,
  setOpenEditDialog,
}: {
  allowanceType: AllowanceType;
  setOpenEditDialog: (open: boolean) => void;
}) => {
  const { data: allowanceTypeData, isFetching } = useQuery({
    queryKey: ['showAllowanceType', allowanceType.id],
    queryFn: () => humanResourcesServices.showAllowanceType(allowanceType.id),
  });
  const queryClient = useQueryClient();

  if (isFetching) {
    return <LinearProgress />;
  }

  return (
    <AllowanceTypeForm
      allowanceType={allowanceTypeData || allowanceType}
      setOpenDialog={(v) => {
        setOpenEditDialog(v);
        if (!v) {
          queryClient.invalidateQueries({ queryKey: ['allowanceTypes'] });
        }
      }}
    />
  );
};

const AllowanceTypeItemAction = ({
  allowanceType,
}: {
  allowanceType: AllowanceType;
}) => {
  const dictionary = useDictionary();
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: deleteAllowanceType } = useMutation({
    mutationFn: humanResourcesServices.deleteAllowanceType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allowanceTypes'] });
      enqueueSnackbar(dictionary.humanResources.allowanceTypes.actions.deleteSuccess, {
        variant: 'success',
      });
    },
    onError: (error: any) => {
      const data = (error as any)?.response?.data;

      // Still assigned to employees — offer to remove it from all of them
      // and delete the type, instead of just failing here.
      if (data?.confirm_required) {
        showDialog({
          title: dictionary.humanResources.allowanceTypes.actions.inUseTitle,
          content: dictionary.humanResources.allowanceTypes.actions.inUseContent.replace(
            '{message}',
            data.message.replace(
              ' Remove it from their allowances, or confirm to remove it from all of them and delete the type.',
              ''
            )
          ),
          onYes: () => {
            hideDialog();
            deleteAllowanceType({ id: allowanceType.id, force: true });
          },
          onNo: () => hideDialog(),
          variant: 'confirm',
        });
        return;
      }

      let message = dictionary.humanResources.allowanceTypes.actions.somethingWrong;

      if (typeof data?.message === 'string') {
        message = data.message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const menuItems = [
    {
      icon: <EditOutlined />,
      title: dictionary.humanResources.allowanceTypes.actions.edit,
      action: 'edit',
    },
    {
      icon: <DeleteOutlined color='error' />,
      title: dictionary.humanResources.allowanceTypes.actions.delete,
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
          title: dictionary.humanResources.allowanceTypes.actions.confirmDeleteTitle,
          content: dictionary.humanResources.allowanceTypes.actions.confirmDeleteContent,
          onYes: () => {
            hideDialog();
            deleteAllowanceType({ id: allowanceType.id });
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
          <EditAllowanceType
            allowanceType={allowanceType}
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

export default AllowanceTypeItemAction;
