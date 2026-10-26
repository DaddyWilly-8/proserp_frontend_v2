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
import DepartmentForm from './DepartmentForm';
import { Department } from './DepartmentsType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const EditDepartment = ({
  department,
  setOpenEditDialog,
}: {
  department: Department;
  setOpenEditDialog: (open: boolean) => void;
}) => {
  const { data: departmentData, isFetching } = useQuery({
    queryKey: ['showDepartment', department.id],
    queryFn: () => humanResourcesServices.showDepartment(department.id),
  });
  const queryClient = useQueryClient();

  if (isFetching) {
    return <LinearProgress />;
  }

  return (
    <DepartmentForm
      department={departmentData || department}
      setOpenDialog={(v) => {
        setOpenEditDialog(v);
        if (!v) {
          queryClient.invalidateQueries({ queryKey: ['departments'] });
        }
      }}
    />
  );
};

const DepartmentItemAction = ({ department }: { department: Department }) => {
  const dictionary = useDictionary();
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  //Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: deleteDepartment } = useMutation({
    mutationFn: humanResourcesServices.deleteDepartment,
    onSuccess: (data: { message: string }) => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      enqueueSnackbar(dictionary.humanResources.departments.actions.deleteSuccess, {
        variant: 'success',
      });
    },
    onError: (error: any) => {
      let message = dictionary.humanResources.departments.actions.somethingWrong;

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
      title: dictionary.humanResources.departments.actions.edit,
      action: 'edit',
    },
    {
      icon: <DeleteOutlined color='error' />,
      title: dictionary.humanResources.departments.actions.delete,
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
          title: dictionary.humanResources.departments.actions.confirmDeleteTitle,
          content: dictionary.humanResources.departments.actions.confirmDeleteContent,
          onYes: () => {
            hideDialog();
            deleteDepartment(department.id);
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
          <EditDepartment
            department={department}
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

export default DepartmentItemAction;
