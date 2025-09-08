import { DeleteOutlined, DownloadOutlined, EditOutlined, HighlightOff, MoreHorizOutlined, VisibilityOutlined } from '@mui/icons-material';
import { Alert, Box, Button, Dialog, DialogContent, Grid, IconButton, LinearProgress, Tab, Tabs, Tooltip, useMediaQuery } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MenuItemProps } from '@jumbo/types';
import { JumboDdMenu } from '@jumbo/components';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import bomsServices from './boms-services';
import BomsForm from './form/BomForm';
import BomPDF from './BomPDF'; // New PDF component
import PDFContent from '../../pdf/PDFContent';
import BomOnScreen from './BomOnScreen'; // New on-screen preview component (create this separately)
import { Product } from '@/components/productAndServices/products/ProductType';
import { BOMItem, BOMPayload } from './BomType';
import { MeasurementUnit } from '@/components/masters/measurementUnits/MeasurementUnitType';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';

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

interface DocumentDialogProps {
  bom: BOM;
  authObject: ReturnType<typeof useJumboAuth>;
  openDocumentDialog: boolean;
  setOpenDocumentDialog: (open: boolean) => void;
}

const DocumentDialog: React.FC<DocumentDialogProps> = ({ 
  bom, 
  authObject, 
  openDocumentDialog, 
  setOpenDocumentDialog 
}) => {
  const { data: bomDetails, isLoading, isError } = useQuery({
    queryKey: ['bom', { id: bom.id }],
    queryFn: () => bomsServices.show(bom.id),
    enabled: true,
  });

  const [selectedTab, setSelectedTab] = useState(0);

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  if (isLoading) return <LinearProgress />;
  if (isError) return <Alert severity="error">Error loading BOM data</Alert>;

  return (
    <Dialog
      open={openDocumentDialog}
      onClose={() => setOpenDocumentDialog(false)}
      fullWidth
      scroll='body'
      maxWidth={'md'}
      fullScreen={belowLargeScreen}
    >
      <DialogContent>
        {belowLargeScreen ? (
          <Box>
            <Grid container alignItems="center" justifyContent="space-between">
              <Grid size={{ xs: 11, md: 12 }}>
                <Tabs value={selectedTab} onChange={handleTabChange}>
                  <Tab label="On Screen" />
                  <Tab label="PDF" />
                </Tabs>
              </Grid>

              {belowLargeScreen && (
                <Grid size={{ xs: 1 }} textAlign="right">
                  <Tooltip title="Close">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => setOpenDocumentDialog(false)}
                    >
                      <HighlightOff color="primary" />
                    </IconButton>
                  </Tooltip>
                </Grid>
              )}
            </Grid>
            <Box>
              {selectedTab === 0 && (
                authObject.checkOrganizationPermission(PERMISSIONS.BOM_READ) ? (
                  <BomOnScreen 
                    bom={bomDetails} 
                    authObject={authObject} 
                  />
                ) : (
                  <UnauthorizedAccess />
                )
              )}
              {selectedTab === 1 && (
                authObject.checkOrganizationPermission(PERMISSIONS.BOM_READ) ? (
                  <PDFContent
                    document={<BomPDF authObject={authObject} bom={bomDetails} />}
                    fileName={`BOM_${bom.id}_${readableDate(new Date().toISOString())}`}
                  />
                ) : (
                  <UnauthorizedAccess />
                )
              )}
            </Box>
          </Box>
        ) : (
          authObject.checkOrganizationPermission(PERMISSIONS.BOM_READ) ? (
            <PDFContent
              document={<BomPDF authObject={authObject} bom={bomDetails} />}
              fileName={`BOM_${bom.id}_${readableDate(new Date().toISOString())}`}
            />
          ) : (
            <UnauthorizedAccess />
          )
        )}
      </DialogContent>
      {belowLargeScreen && (
        <Box textAlign="right" margin={2}>
          <Button 
            variant="outlined" 
            size='small' 
            color="primary" 
            onClick={() => setOpenDocumentDialog(false)}
          >
            Close
          </Button>
        </Box>
      )}
    </Dialog>
  );
};

const BomsListItemAction: React.FC<{ bom: BOM }> = ({ bom }) => {
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
  const { showDialog, hideDialog } = useJumboDialog();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { theme } = useJumboTheme();
  const authObject = useJumboAuth();
  const { checkOrganizationPermission } = authObject;
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
    {
      icon: belowLargeScreen ? <DownloadOutlined /> : <VisibilityOutlined />,
      title: belowLargeScreen ? 'Download' : 'View',
      action: 'open',
    },
    checkOrganizationPermission(PERMISSIONS.BOM_EDIT)
      ? { icon: <EditOutlined />, title: 'Edit', action: 'edit' }
      : null,
    checkOrganizationPermission(PERMISSIONS.BOM_DELETE)
      ? { icon: <DeleteOutlined color="error" />, title: 'Delete', action: 'delete' }
      : null,
  ].filter(Boolean) as MenuItemProps[];

  const handleItemAction = (menuItem: MenuItemProps) => {
    if (openEditDialog || openDocumentDialog) return; // Prevent multiple dialogs
    switch (menuItem.action) {
      case 'open':
        setOpenDocumentDialog(true);
        break;
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

  const handleClose = () => {
    setOpenEditDialog(false);
    setOpenDocumentDialog(false);
  };

  useEffect(() => {
    return () => {
      setOpenEditDialog(false);
      setOpenDocumentDialog(false); // Clean up on unmount
    };
  }, []);

  return (
    <>
      <Dialog
        open={openEditDialog || openDocumentDialog}
        fullWidth
        maxWidth={openDocumentDialog ? 'md' : 'lg'}
        fullScreen={belowLargeScreen}
        scroll={belowLargeScreen ? 'body' : 'paper'}
        onClose={handleClose}
      >
        {openEditDialog && (
          isLoading ? (
            <LinearProgress />
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
          )
        )}
        {openDocumentDialog && (
          <DocumentDialog 
            bom={bom} 
            authObject={authObject} 
            openDocumentDialog={openDocumentDialog}
            setOpenDocumentDialog={setOpenDocumentDialog}
          />
        )}
      </Dialog>

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