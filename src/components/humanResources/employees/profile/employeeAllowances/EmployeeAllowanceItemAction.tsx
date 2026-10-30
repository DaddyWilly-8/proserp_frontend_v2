'use client';

import EmployeeAllowanceForm from '@/components/humanResources/employees/profile/employeeAllowances/EmployeeAllowanceForm';
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
import humanResourcesServices from '../../../humanResourcesServices';
import { EmployeeAllowanceType } from './EmployeeAllowanceType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const EditEmployeeAllowance = ({
  employeeAllowance,
  setOpenEditDialog,
}: {
  employeeAllowance: EmployeeAllowanceType;
  setOpenEditDialog: (open: boolean) => void;
}) => {
  const { data: employeeAllowanceData, isFetching } = useQuery({
    queryKey: ['showEmployeeAllowance', employeeAllowance.id],
    queryFn: () =>
      humanResourcesServices.showEmployeeAllowance(employeeAllowance.id),
  });
  const queryClient = useQueryClient();

  if (isFetching) {
    return <LinearProgress />;
  }

  return (
    <EmployeeAllowanceForm
      employeeAllowance={employeeAllowanceData || employeeAllowance}
      setOpenDialog={(v) => {
        setOpenEditDialog(v);
        if (!v) {
          queryClient.invalidateQueries({ queryKey: ['employeeAllowances'] });
        }
      }}
    />
  );
};

const EmployeeAllowanceItemAction = ({
  employeeAllowance,
}: {
  employeeAllowance: EmployeeAllowanceType;
}) => {
  const dictionary = useDictionary();
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: deleteEmployeeAllowance } = useMutation({
    mutationFn: humanResourcesServices.deleteEmployeeAllowance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employeeAllowances'] });
      enqueueSnackbar(dictionary.humanResources.employeeAllowances.messages.deleted, {
        variant: 'success',
      });
    },
    onError: (error: any) => {
      let message = dictionary.humanResources.profileSectionsCommon.somethingWentWrong;

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
      title: dictionary.humanResources.profileSectionsCommon.edit,
      action: 'edit',
    },
    {
      icon: <DeleteOutlined color='error' />,
      title: dictionary.humanResources.profileSectionsCommon.delete,
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
          title: dictionary.humanResources.profileSectionsCommon.confirmDelete,
          content: dictionary.humanResources.employeeAllowances.messages.deleteConfirm,
          onYes: () => {
            hideDialog();
            deleteEmployeeAllowance(employeeAllowance.id);
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
          <EditEmployeeAllowance
            employeeAllowance={employeeAllowance}
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

export default EmployeeAllowanceItemAction;
