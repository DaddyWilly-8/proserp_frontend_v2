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
import BankForm from './BankForm';
import { BankType } from './BankType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const EditBank = ({ bank, setOpenEditDialog }: { bank: BankType; setOpenEditDialog: (open: boolean) => void }) => {
  const { data: bankData, isFetching } = useQuery({
    queryKey: ['showBank', bank.id],
    queryFn: () => humanResourcesServices.showBank(bank.id),
  });
  const queryClient = useQueryClient();

  if (isFetching) {
    return <LinearProgress />;
  }

  return (
    <BankForm
      bank={bankData || bank}
      setOpenDialog={(v) => {
        setOpenEditDialog(v);
        if (!v) {
          queryClient.invalidateQueries({ queryKey: ['banks'] });
        }
      }}
    />
  );
};

const BankItemAction = ({ bank }: { bank: BankType }) => {
  const dictionary = useDictionary();
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: deleteBank } = useMutation({
    mutationFn: humanResourcesServices.deleteBank,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banks'] });
      enqueueSnackbar(dictionary.humanResources.banks.messages.deleted, { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(dictionary.humanResources.banks.messages.deleteError, { variant: 'error' });
      console.log('error deleting bank: ', error);
    },
  });

  const menuItems = [
    { icon: <EditOutlined />, title: dictionary.humanResources.banks.menu.edit, action: 'edit' },
    {
      icon: <DeleteOutlined color='error' />,
      title: dictionary.humanResources.banks.menu.delete,
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
          title: dictionary.humanResources.banks.dialog.confirmDeleteTitle,
          content: dictionary.humanResources.banks.dialog.confirmDeleteContent,
          onYes: () => {
            hideDialog();
            deleteBank(bank.id);
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
          <EditBank
            bank={bank}
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

export default BankItemAction;
