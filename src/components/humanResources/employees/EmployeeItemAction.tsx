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
      enqueueSnackbar('Employee Deleted Successfully', {
        variant: 'success',
      });
    },
    // The backend refuses to delete an employee with payslips, loans or
    // leave on record, and says why — show that instead of a generic error.
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || 'Error Deleting Employee',
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
        error?.response?.data?.message || 'Error deactivating employee',
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
        error?.response?.data?.message || 'Error reactivating employee',
        { variant: 'error' }
      );
    },
  });

  const isActive = employee.is_active !== false;

  const menuItems = [
    {
      icon: <EditOutlined />,
      title: 'Edit',
      action: 'edit',
    },
    isActive
      ? {
          icon: <PersonOffOutlined color='warning' />,
          title: 'Deactivate',
          action: 'deactivate',
        }
      : {
          icon: <PersonOutlined color='success' />,
          title: 'Reactivate',
          action: 'reactivate',
        },
    {
      icon: <DeleteOutlined color='error' />,
      title: 'Delete',
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
          title: 'Deactivate Employee',
          content:
            'They will stop appearing in employee selectors and payroll, and lose My HR access. Their history stays intact and you can reactivate them at any time. Continue?',
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
          title: 'Reactivate Employee',
          content:
            'They will appear in employee selectors and payroll again, and regain My HR access. Continue?',
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
          title: 'Confirm Delete',
          content: 'Are you sure you want to delete this Employee?',
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
          <Tooltip title='Actions'>
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
