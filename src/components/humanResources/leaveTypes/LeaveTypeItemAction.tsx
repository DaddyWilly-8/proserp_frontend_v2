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
import LeaveTypeForm from './LeaveTypeForm';
import { LeaveType } from './LeaveTypesType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const EditLeaveType = ({
  leaveType,
  setOpenEditDialog,
}: {
  leaveType: LeaveType;
  setOpenEditDialog: (open: boolean) => void;
}) => {
  const { data: leaveTypeData, isFetching } = useQuery({
    queryKey: ['showLeaveType', leaveType.id],
    queryFn: () => humanResourcesServices.showLeaveType(leaveType.id),
  });
  const queryClient = useQueryClient();

  if (isFetching) {
    return <LinearProgress />;
  }

  return (
    <LeaveTypeForm
      leaveType={leaveTypeData || leaveType}
      setOpenDialog={(v) => {
        setOpenEditDialog(v);
        if (!v) {
          queryClient.invalidateQueries({ queryKey: ['leaveTypes'] });
        }
      }}
    />
  );
};

const LeaveTypeItemAction = ({ leaveType }: { leaveType: LeaveType }) => {
  const dictionary = useDictionary();
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  //Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: deleteLeaveType } = useMutation({
    mutationFn: humanResourcesServices.deleteLeaveType,
    onSuccess: (data: { message: string }) => {
      queryClient.invalidateQueries({ queryKey: ['leaveTypes'] });
      enqueueSnackbar(dictionary.humanResources.leaveTypes.actions.deleteSuccess, {
        variant: 'success',
      });
    },
    onError: (error: any) => {
      let message = dictionary.humanResources.leaveTypes.actions.somethingWrong;

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
      title: dictionary.humanResources.leaveTypes.actions.edit,
      action: 'edit',
    },
    {
      icon: <DeleteOutlined color='error' />,
      title: dictionary.humanResources.leaveTypes.actions.delete,
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
          title: dictionary.humanResources.leaveTypes.actions.confirmDeleteTitle,
          content: dictionary.humanResources.leaveTypes.actions.confirmDeleteContent,
          onYes: () => {
            hideDialog();
            deleteLeaveType(leaveType.id);
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
          <EditLeaveType
            leaveType={leaveType}
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

export default LeaveTypeItemAction;
