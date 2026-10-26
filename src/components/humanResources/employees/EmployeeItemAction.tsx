'use client';
import { JumboDdMenu } from '@jumbo/components';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { MenuItemProps } from '@jumbo/types';
import {
  DeleteOutlined,
  EditOutlined,
  MoreHorizOutlined,
  PersonOffOutlined,
  PersonOutlined,
} from '@mui/icons-material';
import { Dialog, LinearProgress, Tooltip, useMediaQuery } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { DepartmentsProvider } from '../departments/DepartmentsProvider';
import humanResourcesServices from '../humanResourcesServices';
import EmployeeForm from './EmployeeForm';
import { Employee } from './EmployeesType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const EditEmployee = ({
  employee,
  setOpenEditDialog,
}: {
  employee: Employee;
  setOpenEditDialog: (open: boolean) => void;
}) => {
  const { data: employeeData, isFetching } = useQuery({
    queryKey: ['showEmployee', employee.id],
    queryFn: () => humanResourcesServices.showEmployee(employee.id),
  });
  const queryClient = useQueryClient();

  if (isFetching) {
    return <LinearProgress />;
  }

  return (
    <DepartmentsProvider>
      <EmployeeForm
        employee={employeeData || employee}
        setOpenDialog={(v) => {
          setOpenEditDialog(v);
          if (!v) {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
          }
        }}
      />
    </DepartmentsProvider>
  );
};

const EmployeeItemAction = ({ employee }: { employee: Employee }) => {
  const dictionary = useDictionary();
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: deleteEmployee } = useMutation({
    mutationFn: humanResourcesServices.deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      enqueueSnackbar(dictionary.humanResources.employees.list.messages.deleted, {
        variant: 'success',
      });
    },
    // The backend refuses to delete an employee with payslips, loans or
    // leave on record, and says why — show that instead of a generic error.
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || dictionary.humanResources.employees.list.messages.deleteError,
        { variant: 'error' }
      );
    },
  });

  const { mutate: deactivateEmployee } = useMutation({
    mutationFn: humanResourcesServices.deactivateEmployee,
    onSuccess: (data: { message: string }) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['fetchEmployees'] });
      enqueueSnackbar(data.message, { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || dictionary.humanResources.employees.list.messages.deactivateError,
        { variant: 'error' }
      );
    },
  });

  const { mutate: reactivateEmployee } = useMutation({
    mutationFn: humanResourcesServices.reactivateEmployee,
    onSuccess: (data: { message: string }) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['fetchEmployees'] });
      enqueueSnackbar(data.message, { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || dictionary.humanResources.employees.list.messages.reactivateError,
        { variant: 'error' }
      );
    },
  });

  const isActive = employee.is_active !== false;

  const menuItems = [
    {
      icon: <EditOutlined />,
      title: dictionary.humanResources.employees.list.actions.edit,
      action: 'edit',
    },
    isActive
      ? {
          icon: <PersonOffOutlined color='warning' />,
          title: dictionary.humanResources.employees.list.actions.deactivate,
          action: 'deactivate',
        }
      : {
          icon: <PersonOutlined color='success' />,
          title: dictionary.humanResources.employees.list.actions.reactivate,
          action: 'reactivate',
        },
    {
      icon: <DeleteOutlined color='error' />,
      title: dictionary.humanResources.employees.list.actions.delete,
      action: 'delete',
    },
  ];

  const handleItemAction = (menuItem: MenuItemProps) => {
    switch (menuItem.action) {
      case 'edit':
        setOpenEditDialog(true);
        break;
      case 'deactivate':
        showDialog({
          title: dictionary.humanResources.employees.list.dialogs.deactivateTitle,
          content: dictionary.humanResources.employees.list.dialogs.deactivateContent,
          onYes: () => {
            hideDialog();
            deactivateEmployee({ id: employee.id });
          },
          onNo: () => hideDialog(),
          variant: 'confirm',
        });
        break;
      case 'reactivate':
        showDialog({
          title: dictionary.humanResources.employees.list.dialogs.reactivateTitle,
          content: dictionary.humanResources.employees.list.dialogs.reactivateContent,
          onYes: () => {
            hideDialog();
            reactivateEmployee(employee.id);
          },
          onNo: () => hideDialog(),
          variant: 'confirm',
        });
        break;
      case 'delete':
        showDialog({
          title: dictionary.humanResources.employees.list.dialogs.deleteTitle,
          content: dictionary.humanResources.employees.list.dialogs.deleteContent,
          onYes: () => {
            hideDialog();
            deleteEmployee(employee.id);
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
          <EditEmployee
            employee={employee}
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

export default EmployeeItemAction;
