import { DeleteOutlined, DownloadOutlined, EditOutlined, HighlightOff, MoreHorizOutlined, VisibilityOutlined } from '@mui/icons-material';
import { Alert, Box, Button, Dialog, DialogContent, Fade, Grid, IconButton, LinearProgress, Tab, Tabs, Tooltip, useMediaQuery } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MenuItemProps } from '@jumbo/types';
import { JumboDdMenu } from '@jumbo/components';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import bomsServices from './boms-services';
import PDFContent from '../../pdf/PDFContent';
import { BOM } from './BomType';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import BomOnScreen from './preview/BomOnScreen';
import BomPDF from './preview/BomPDF';
import BomForm from './form/BomForm';
import { Organization } from '@/types/auth-types';

interface DocumentDialogProps {
  bom: BOM;
  authObject: ReturnType<typeof useJumboAuth>;
  organization: Organization;
  openDocumentDialog: boolean;
  setOpenDocumentDialog: (open: boolean) => void;
}

const DocumentDialog: React.FC<DocumentDialogProps> = ({ 
  bom,  
  openDocumentDialog, 
  setOpenDocumentDialog,
  organization 
}) => {
  const { data: bomDetails, isPending} = useQuery({
    queryKey: ['bomDetails', { id: bom.id }],
    queryFn: () => bomsServices.show(bom.id),
    enabled: true,
  });

  const [selectedTab, setSelectedTab] = useState(0);

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  if (isPending) return <LinearProgress />;


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
                <BomOnScreen 
                  bom={bomDetails}
                  organization={organization} 
                />
              )}
              {selectedTab === 1 && (
                <PDFContent
                  document={<BomPDF organization={organization} bom={bomDetails as any} />}
                  fileName={bom.bomNo}
                />
              )}
            </Box>
          </Box>
        ) : (
          <PDFContent
            document={<BomPDF organization={organization} bom={bomDetails as any} />}
            fileName={bom.bomNo}
          />
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
  const { authOrganization, checkOrganizationPermission } = useJumboAuth();
  const organization = authOrganization?.organization;
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
    { icon: <VisibilityOutlined />, title: 'View', action: 'open' },
    checkOrganizationPermission(PERMISSIONS.BOM_EDIT) && { icon: <EditOutlined />, title: 'Edit', action: 'edit' },
    checkOrganizationPermission(PERMISSIONS.BOM_DELETE) && { icon: <DeleteOutlined color="error" />, title: 'Delete', action: 'delete' },
  ].filter(menuItem => !!menuItem);

  const handleItemAction = (menuItem: MenuItemProps) => {
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

  return (
  <>
     <Dialog
        open={openEditDialog || openDocumentDialog}
        onClose={() => {
          setOpenEditDialog(false);
          setOpenDocumentDialog(false);
        }}
        scroll={belowLargeScreen ? 'body' : 'paper'}
        fullWidth
        fullScreen={belowLargeScreen}
        maxWidth="lg"
        aria-modal="true"
      >
        {!!openEditDialog && (
          isLoading ? (
            <LinearProgress />
          ) : isError ? (
            <Alert severity="error">Error loading BOM data</Alert>
          ) : (
            <BomForm
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
        {!!openDocumentDialog && (
          <DocumentDialog 
            bom={bom} 
            authObject={authObject} 
            organization={organization as Organization}
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