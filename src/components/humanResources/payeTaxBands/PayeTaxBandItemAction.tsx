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
import PayeTaxBandForm from './PayeTaxBandForm';
import { PayeTaxBandType } from './PayeTaxBandType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const EditPayeTaxBand = ({
  payeTaxBand,
  setOpenEditDialog,
}: {
  payeTaxBand: PayeTaxBandType;
  setOpenEditDialog: (open: boolean) => void;
}) => {
  const { data: payeTaxBandData, isFetching } = useQuery({
    queryKey: ['showPayeTaxBand', payeTaxBand.id],
    queryFn: () => humanResourcesServices.showPayeTaxBand(payeTaxBand.id),
  });
  const queryClient = useQueryClient();

  if (isFetching) {
    return <LinearProgress />;
  }

  return (
    <PayeTaxBandForm
      payeTaxBand={payeTaxBandData || payeTaxBand}
      setOpenDialog={(v) => {
        setOpenEditDialog(v);
        if (!v) {
          queryClient.invalidateQueries({ queryKey: ['payeTaxBands'] });
        }
      }}
    />
  );
};

const PayeTaxBandItemAction = ({
  payeTaxBand,
}: {
  payeTaxBand: PayeTaxBandType;
}) => {
  const dictionary = useDictionary();
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: deletePayeTaxBand } = useMutation({
    mutationFn: humanResourcesServices.deletePayeTaxBand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payeTaxBands'] });
      enqueueSnackbar(dictionary.humanResources.payeTaxBands.actions.deleteSuccess, {
        variant: 'success',
      });
    },
    onError: (error: any) => {
      let message = dictionary.humanResources.payeTaxBands.actions.somethingWrong;

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
      title: dictionary.humanResources.payeTaxBands.actions.edit,
      action: 'edit',
    },
    {
      icon: <DeleteOutlined color='error' />,
      title: dictionary.humanResources.payeTaxBands.actions.delete,
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
          title: dictionary.humanResources.payeTaxBands.actions.confirmDeleteTitle,
          content: dictionary.humanResources.payeTaxBands.actions.confirmDeleteContent,
          onYes: () => {
            hideDialog();
            deletePayeTaxBand(payeTaxBand.id);
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
          <EditPayeTaxBand
            payeTaxBand={payeTaxBand}
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

export default PayeTaxBandItemAction;
