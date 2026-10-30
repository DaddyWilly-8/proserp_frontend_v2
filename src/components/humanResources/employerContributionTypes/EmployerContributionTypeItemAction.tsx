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
import { EmployerContributionType } from './EmployerContributionType';
import EmployerContributionTypeForm from './EmployerContributionTypeForm';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const EditEmployerContributionType = ({
  contributionType,
  setOpenEditDialog,
}: {
  contributionType: EmployerContributionType;
  setOpenEditDialog: (open: boolean) => void;
}) => {
  const { data: contributionTypeData, isFetching } = useQuery({
    queryKey: ['showEmployerContributionType', contributionType.id],
    queryFn: () =>
      humanResourcesServices.showEmployerContributionType(contributionType.id),
  });
  const queryClient = useQueryClient();

  if (isFetching) {
    return <LinearProgress />;
  }

  return (
    <EmployerContributionTypeForm
      contributionType={contributionTypeData || contributionType}
      setOpenDialog={(v) => {
        setOpenEditDialog(v);
        if (!v) {
          queryClient.invalidateQueries({
            queryKey: ['employerContributionTypes'],
          });
        }
      }}
    />
  );
};

const EmployerContributionTypeItemAction = ({
  contributionType,
}: {
  contributionType: EmployerContributionType;
}) => {
  const dictionary = useDictionary();
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: deleteEmployerContributionType } = useMutation({
    mutationFn: humanResourcesServices.deleteEmployerContributionType,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['employerContributionTypes'],
      });
      enqueueSnackbar(dictionary.humanResources.employerContributionTypes.actions.deleteSuccess, {
        variant: 'success',
      });
    },
    onError: (error: any) => {
      const data = (error as any)?.response?.data;

      // Still assigned to employees — offer to remove it from all of them
      // and delete the type, instead of just failing here.
      if (data?.confirm_required) {
        showDialog({
          title: dictionary.humanResources.employerContributionTypes.actions.inUseTitle,
          content: dictionary.humanResources.employerContributionTypes.actions.inUseContent.replace(
            '{message}',
            data.message.replace(
              ' Remove it from their contributions, or confirm to remove it from all of them and delete the type.',
              ''
            )
          ),
          onYes: () => {
            hideDialog();
            deleteEmployerContributionType({
              id: contributionType.id,
              force: true,
            });
          },
          onNo: () => hideDialog(),
          variant: 'confirm',
        });
        return;
      }

      let message = dictionary.humanResources.employerContributionTypes.actions.somethingWrong;

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
      title: dictionary.humanResources.employerContributionTypes.actions.edit,
      action: 'edit',
    },
    {
      icon: <DeleteOutlined color='error' />,
      title: dictionary.humanResources.employerContributionTypes.actions.delete,
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
          title: dictionary.humanResources.employerContributionTypes.actions.confirmDeleteTitle,
          content: dictionary.humanResources.employerContributionTypes.actions.confirmDeleteContent,
          onYes: () => {
            hideDialog();
            deleteEmployerContributionType({ id: contributionType.id });
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
          <EditEmployerContributionType
            contributionType={contributionType}
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

export default EmployerContributionTypeItemAction;
