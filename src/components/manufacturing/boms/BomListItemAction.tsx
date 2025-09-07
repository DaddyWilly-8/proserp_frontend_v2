import { DeleteOutlined, EditOutlined, MoreHorizOutlined } from '@mui/icons-material';
import { Dialog, Tooltip, useMediaQuery, LinearProgress, Alert } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MenuItemProps } from '@jumbo/types';
import { JumboDdMenu } from '@jumbo/components';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import bomsServices from './boms-services';
import BomsForm from './form/BomForm';
import { Product } from '@/components/productAndServices/products/ProductType';
import { BOMItem, BOMPayload } from './BomType';
import { MeasurementUnit } from '@/components/masters/measurementUnits/MeasurementUnitType';

interface BOM {
  id: number;
  product?: Product | null;
  product_id: number | undefined;
  quantity: number;
  measurement_unit_id?: number | null;
  conversion_factor?: number | null;
  measurement_unit?: MeasurementUnit | null;
  symbol?: string | null;
  items: BOMItem[];
  alternatives?: BOMItem[];
}

const BomsListItemAction: React.FC<{ bom: BOM }> = ({ bom }) => {
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const { showDialog, hideDialog } = useJumboDialog();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  // Fetch BOM data for editing
  const { data: bomData, isLoading, isError } = useQuery({
    queryKey: ['bom', bom.id],
    queryFn: () => bomsServices.show(bom.id),
    enabled: openEditDialog,
  });

  const { mutate: deleteBom } = useMutation({
    mutationFn: (params: { id: number }) => bomsServices.delete(params),
    onSuccess: (data: { message: string }) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['boms'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || 'Failed to delete BOM',
        { variant: 'error' }
      );
    },
  });

  const menuItems: MenuItemProps[] = [
    { icon: <EditOutlined />, title: 'Edit', action: 'edit' },
    { icon: <DeleteOutlined color="error" />, title: 'Delete', action: 'delete' },
  ];

  const handleItemAction = (menuItem: MenuItemProps) => {
  if (openEditDialog) return; // Prevent multiple dialog openings
  switch (menuItem.action) {
    case 'edit':
      setOpenEditDialog(true);
      break;
      case 'delete':
        showDialog({
          title: 'Confirm BOM Deletion',
          content: `Are you sure you want to delete BOM ${bom.id}?`,
          onYes: () => {
            hideDialog();
            deleteBom({ id: bom.id });
          },
          onNo: hideDialog,
          variant: 'confirm',
        });
        break;
      default:
        break;
    }
  };

useEffect(() => {
  return () => {
    setOpenEditDialog(false); // Ensure dialog is closed on unmount
  };
}, []);

  return (
    <>
      {/* Edit Dialog */}
      <Dialog
        open={openEditDialog}
        fullWidth
        maxWidth="md"
        fullScreen={belowLargeScreen}
        onClose={() => setOpenEditDialog(false)}
      >
        {isLoading ? (
          <div>
            <LinearProgress />
          </div>
        ) : isError ? (
          <Alert severity="error">Error loading BOM data</Alert>
        ) : (
          <BomsForm
            open={openEditDialog}
            bomId={bom.id}
            bomData={bomData}
            toggleOpen={setOpenEditDialog}
            onSuccess={() => {
              setOpenEditDialog(false);
              queryClient.invalidateQueries({ queryKey: ['boms'] });
            }}
          />
        )}
      </Dialog>

      {/* Actions Menu */}
      <JumboDdMenu
        icon={
          <Tooltip title="BOM Actions">
            <MoreHorizOutlined fontSize="small" />
          </Tooltip>
        }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />
    </>
  );
};

export default BomsListItemAction;