'use client';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { JumboDdMenu } from '@jumbo/components';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import {
  DeleteOutlined,
  EditOutlined,
  MoreHorizOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import { Dialog, Tooltip, useMediaQuery } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import RecurringTransactionEditDialogContent from './RecurringTransactionEditDialogContent';
import RecurringTransactionViewDialogContent from './RecurringTransactionViewDialogContent';
import recurringTransactionServices from './recurringTransactions-services';

interface RecurringTransactionItemActionProps {
  schedule: any;
}

const RecurringTransactionItemAction: React.FC<RecurringTransactionItemActionProps> = ({ schedule }) => {
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const dictionary = useDictionary();
  const t = dictionary.recurringTransactions;
  const { checkOrganizationPermission } = useJumboAuth();
  const [openView, setOpenView] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const refresh = (data: any) => {
    enqueueSnackbar(data.message, { variant: 'success' });
    queryClient.invalidateQueries({ queryKey: ['recurringTransactions'] });
    queryClient.invalidateQueries({ queryKey: ['recurringTransaction', schedule.id] });
  };
  const onError = (error: any) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' });

  const pause = useMutation({ mutationFn: recurringTransactionServices.pause, onSuccess: refresh, onError });
  const resume = useMutation({ mutationFn: recurringTransactionServices.resume, onSuccess: refresh, onError });
  const remove = useMutation({ mutationFn: recurringTransactionServices.delete, onSuccess: refresh, onError });

  const canEdit = checkOrganizationPermission([PERMISSIONS.RECURRING_TRANSACTIONS_EDIT]);
  const canDelete = checkOrganizationPermission([PERMISSIONS.RECURRING_TRANSACTIONS_DELETE]);

  const menuItems = [
    { icon: <VisibilityOutlined />, title: t.list.actionsTitle.view, action: 'view' },
    ...(canEdit && schedule.status !== 'completed' ? [{ icon: <EditOutlined />, title: t.list.actionsTitle.edit, action: 'edit' }] : []),
    ...(canEdit && schedule.status === 'active' ? [{ icon: <PauseCircleOutlined />, title: t.list.actionsTitle.pause, action: 'pause' }] : []),
    ...(canEdit && schedule.status === 'paused' ? [{ icon: <PlayCircleOutlined />, title: t.list.actionsTitle.resume, action: 'resume' }] : []),
    ...(canDelete ? [{ icon: <DeleteOutlined color="error" />, title: t.list.actionsTitle.delete, action: 'delete' }] : []),
  ];

  const handleItemAction = (menuItem: any) => {
    switch (menuItem.action) {
      case 'view':
        setOpenView(true);
        break;
      case 'edit':
        setOpenEdit(true);
        break;
      case 'pause':
        pause.mutate(schedule);
        break;
      case 'resume':
        showDialog({
          title: t.list.dialog.resume.title,
          content: t.list.dialog.resume.content,
          onYes: () => {
            hideDialog();
            resume.mutate(schedule);
          },
          onNo: () => hideDialog(),
          variant: 'confirm',
        });
        break;
      case 'delete':
        showDialog({
          title: t.list.dialog.delete.title,
          content: t.list.dialog.delete.content,
          onYes: () => {
            hideDialog();
            remove.mutate(schedule);
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
    <React.Fragment>
      <Dialog open={openView} onClose={() => setOpenView(false)} scroll="paper" fullWidth fullScreen={belowLargeScreen} maxWidth="md">
        {openView && <RecurringTransactionViewDialogContent scheduleId={schedule.id} onClose={() => setOpenView(false)} />}
      </Dialog>
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} scroll="paper" fullWidth fullScreen={belowLargeScreen} maxWidth="sm">
        {openEdit && <RecurringTransactionEditDialogContent scheduleId={schedule.id} onClose={() => setOpenEdit(false)} />}
      </Dialog>
      <JumboDdMenu
        icon={
          <Tooltip title={t.list.labels.actions}>
            <MoreHorizOutlined />
          </Tooltip>
        }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />
    </React.Fragment>
  );
};

export default RecurringTransactionItemAction;
