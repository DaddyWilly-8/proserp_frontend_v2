import { DeleteOutlined, EditOutlined, HighlightOff, MoreHorizOutlined } from '@mui/icons-material';
import { Box, Button, Dialog, DialogContent, Grid, IconButton, LinearProgress, Tooltip, Typography, useMediaQuery } from '@mui/material';
import React, { useState } from 'react';
import { useSnackbar } from 'notistack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MenuItemProps } from '@jumbo/types';
import { JumboDdMenu } from '@jumbo/components';
import bomsServices from './boms-services';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import BomsForm from './form/BomsForm';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';

// Type for BOM object (adjust fields as per your backend)
interface BOM {
  id: number;
  [key: string]: any;
}

interface ActionDialogContentProps {
  bom: BOM;
  setOpenDialog: React.Dispatch<React.SetStateAction<boolean>>;
  action?: 'edit' | 'view';
}

const ActionDialogContent: React.FC<ActionDialogContentProps> = ({ bom, setOpenDialog, action = 'edit' }) => {
  const { data, isFetching } = useQuery({
    queryKey: ['bom', bom.id],
    queryFn: ({ queryKey }) => {
      const [, id] = queryKey;
      return bomsServices.show(id as number);
    },
    enabled: !!bom.id,
  });

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  if (isFetching) {
    return <LinearProgress />;
  }

  return (
    <BomsForm
      open={true}
      bom={data}
      toggleOpen={setOpenDialog}
      onSuccess={() => {
        setOpenDialog(false);
      }}
    />
  );
};

interface BomsListItemActionProps {
  bom: BOM;
  onEditSuccess?: () => void;
}

const BomsListItemAction: React.FC<BomsListItemActionProps> = ({ bom, onEditSuccess }) => {
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const {showDialog,hideDialog} = useJumboDialog();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: deleteBom } = useMutation({
    mutationFn: (params: { id: number }) => bomsServices.delete(params),
    onSuccess: (data: { message: string }) => {
      queryClient.invalidateQueries({ queryKey: ['boms'] });
      enqueueSnackbar(data.message, { variant: 'success' });
      onEditSuccess?.();
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || 'Failed to delete BOM',
        { variant: 'error' }
      );
    },
  });

  const handleDeleteClick = () => {
    showDialog({
      title: 'Confirm BOM Deletion',
      content: `Are you sure you want to delete BOM ${bom.id}?`,
      dialogProps: { variant: 'confirm' },
      onYes: () => deleteBom({ id: bom.id }),
      onNo: hideDialog,
    });
  };

  const menuItems: MenuItemProps[] = [
    { 
      icon: <EditOutlined fontSize="small" color="primary" />, 
      title: 'Edit', 
      action: 'edit',
    },
    { 
      icon: <DeleteOutlined fontSize="small" color="error" />, 
      title: 'Delete', 
      action: 'delete',
    },
  ];

  const handleItemAction = (menuItem: MenuItemProps) => {
    switch (menuItem.action) {
      case 'edit':
        setOpenEditDialog(true);
        break;
      case 'delete':
        handleDeleteClick();
        break;
      default:
        break;
    }
  };

  return (
    <>
      <Dialog
        scroll={belowLargeScreen ? 'body' : 'paper'}
        maxWidth="lg"
        fullScreen={belowLargeScreen}
        fullWidth
        onClose={() => setOpenEditDialog(false)}
        open={openEditDialog}
      >
        <DialogContent>
          <Grid container alignItems="center" justifyContent="space-between" marginBottom={2}>
            <Grid size={11}>
              <Typography variant="h5">Edit Bill of Material</Typography>
            </Grid>
            <Grid size={1} textAlign="right">
              <Tooltip title="Close">
                <IconButton size="small" onClick={() => setOpenEditDialog(false)}>
                  <HighlightOff color="primary" />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
          <ActionDialogContent 
            bom={bom} 
            setOpenDialog={setOpenEditDialog} 
            action="edit" 
          />
        </DialogContent>
      </Dialog>

      <JumboDdMenu
        icon={
          <Tooltip title="BOM Actions" arrow>
            <IconButton size="small">
              <MoreHorizOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />
    </>
  );
};

export default BomsListItemAction;
