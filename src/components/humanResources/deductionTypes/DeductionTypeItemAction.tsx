'use client';

import DeductionTypeForm from '@/components/humanResources/deductionTypes/DeductionTypeForm';
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
import { DeductionType } from './DeductionType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const EditDeductionType = ({
  deductionType,
  setOpenEditDialog,
}: {
  deductionType: DeductionType;
  setOpenEditDialog: (open: boolean) => void;
}) => {
  const { data: deductionTypeData, isFetching } = useQuery({
    queryKey: ['showDeductionType', deductionType.id],
    queryFn: () => humanResourcesServices.showDeductionType(deductionType.id),
  });
  const queryClient = useQueryClient();

  if (isFetching) {
    return <LinearProgress />;
  }

  return (
    <DeductionTypeForm
      deductionType={deductionTypeData || deductionType}
      setOpenDialog={(v) => {
        setOpenEditDialog(v);
        if (!v) {
          queryClient.invalidateQueries({ queryKey: ['deductionTypes'] });
        }
      }}
    />
  );
};

const DeductionTypeItemAction = ({
  deductionType,
}: {
  deductionType: DeductionType;
}) => {
  const dictionary = useDictionary();
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: deleteDeductionType } = useMutation({
    mutationFn: humanResourcesServices.deleteDeductionType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deductionTypes'] });
      enqueueSnackbar(dictionary.humanResources.deductionTypes.actions.deleteSuccess, {
        variant: 'success',
      });
    },
    onError: (error: any) => {
      const data = (error as any)?.response?.data;

      // Still assigned to employees — offer to remove it from all of them
      // and delete the type, instead of just failing here.
      if (data?.confirm_required) {
        showDialog({
          title: dictionary.humanResources.deductionTypes.actions.inUseTitle,
          content: dictionary.humanResources.deductionTypes.actions.inUseContent.replace(
            '{message}',
            data.message.replace(
              ' Remove it from their deductions, or confirm to remove it from all of them and delete the type.',
              ''
            )
          ),
          onYes: () => {
            hideDialog();
            deleteDeductionType({ id: deductionType.id, force: true });
          },
          onNo: () => hideDialog(),
          variant: 'confirm',
        });
        return;
      }

      let message = dictionary.humanResources.deductionTypes.actions.somethingWrong;

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
      title: dictionary.humanResources.deductionTypes.actions.edit,
      action: 'edit',
    },
    {
      icon: <DeleteOutlined color='error' />,
      title: dictionary.humanResources.deductionTypes.actions.delete,
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
          title: dictionary.humanResources.deductionTypes.actions.confirmDeleteTitle,
          content: dictionary.humanResources.deductionTypes.actions.confirmDeleteContent,
          onYes: () => {
            hideDialog();
            deleteDeductionType({ id: deductionType.id });
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
          <EditDeductionType
            deductionType={deductionType}
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

export default DeductionTypeItemAction;
