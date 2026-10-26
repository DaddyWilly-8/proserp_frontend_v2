'use client'
import { DeleteOutlined, EditOutlined, HighlightOff, MoreHorizOutlined, VisibilityOutlined } from '@mui/icons-material';
import { Box, Button, Dialog,DialogContent,Grid,IconButton,LinearProgress,Tab,Tabs,Tooltip, useMediaQuery } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import PDFContent from '@/components/pdf/PDFContent';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { JumboDdMenu } from '@jumbo/components';
import projectsServices from '@/components/projectManagement/projects/project-services';
const SubContractMaterialIssuedOnScreen = dynamic(() => import('./SubContractMaterialIssuedOnScreen'), { ssr: false });
import SubContractMaterialIssuedPDF from './SubContractMaterialIssuedPDF';
import dynamic from 'next/dynamic';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const DocumentDialog = ({ setOpenDocumentDialog, SubContractMaterialIssued, organization }) => {
    const dictionary = useDictionary();
    const {data:SubContractMaterialIssuedDetails,isFetching} = useQuery({
        queryKey: ['SubContractMaterialIssuedDetails',{id:SubContractMaterialIssued.id}],
        queryFn: async() => projectsServices.getSubContractMaterialIssuedDetails(SubContractMaterialIssued.id)
    });
    const [selectedTab, setSelectedTab] = useState(0);
  
    //Screen handling constants
    const {theme} = useJumboTheme();
    const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  
    const handleTabChange = (event, newValue) => {
      setSelectedTab(newValue);
    };
  
    if(isFetching){
      return <LinearProgress/>;
    }
  
    return (
      <>
        <DialogContent>
          {belowLargeScreen ? (
              <Box>
                <Grid container alignItems="center" justifyContent="space-between">
                  <Grid size={{xs: belowLargeScreen ? 11 : 12}}>
                    <Tabs value={selectedTab} onChange={handleTabChange}>
                      <Tab label={dictionary.projectManagement.materialIssued.onScreen} />
                      <Tab label="PDF" />
                    </Tabs>
                  </Grid>
  
                  {belowLargeScreen && (
                    <Grid size={{xs: 1}} textAlign="right">
                      <Tooltip title={dictionary.tooltips.close}>
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
                  <SubContractMaterialIssuedOnScreen SubContractMaterialIssuedDetails={SubContractMaterialIssuedDetails} setOpenDocumentDialog={setOpenDocumentDialog} organization={organization} />
                )}
                {selectedTab === 1 && (
                  <PDFContent
                    document={<SubContractMaterialIssuedPDF organization={organization} SubContractMaterialIssuedDetails={SubContractMaterialIssuedDetails} dictionary={dictionary} />}
                    fileName={SubContractMaterialIssued.issueNo}
                  />
                )}
              </Box>
            </Box>
          ) : (
            <PDFContent
              document={<SubContractMaterialIssuedPDF organization={organization} SubContractMaterialIssuedDetails={SubContractMaterialIssuedDetails} dictionary={dictionary} />}
              fileName={SubContractMaterialIssued.issueNo}
            />
          )}
        </DialogContent>
        {belowLargeScreen &&
          <Box textAlign="right" margin={2}>
            <Button variant="outlined" size='small' color="primary" onClick={() => setOpenDocumentDialog(false)}>
            {dictionary.projectManagement.dashboard.close}
            </Button>
          </Box>
        }
      </>
    );
};

const SubContractMaterialIssuedItemAction = ({ SubContractMaterialIssued}) => {
    const dictionary = useDictionary();
    const {showDialog,hideDialog} = useJumboDialog();
    const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();
    const { authOrganization: { organization }} = useJumboAuth();

    //Screen handling constants
    const {theme} = useJumboTheme();
    const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

    // React Query v5 syntax for useMutation
    const { mutate: deleteSubContractMaterialIssued } = useMutation({
        mutationFn: projectsServices.deleteSubContractMaterialIssued,
        onSuccess: (data) => {
            queryClient.invalidateQueries({queryKey: ['SubContractMaterialIssued']});
            enqueueSnackbar(data.message, {
                variant: 'success',
            });
        },
        onError: (error) => {
            enqueueSnackbar(error?.response?.message,{variant : 'error'});
        },
    });

    const menuItems = [
        {icon: <VisibilityOutlined />, title: dictionary.projectManagement.common.view, action: "open" },
        {icon: <EditOutlined/>, title: dictionary.projectManagement.common.edit, action: 'edit'},
        {icon: <DeleteOutlined color='error'/>, title: dictionary.projectManagement.common.delete, action: 'delete'}
    ];

  const handleItemAction = (menuItem) => {
    switch (menuItem.action) {
      case 'open':
        setOpenDocumentDialog(true);
        break;
      case 'delete':
        showDialog({
            title: dictionary.projectManagement.common.confirmDelete,
            content: dictionary.projectManagement.materialIssued.confirmDeleteText,
            onYes: () =>{ 
                hideDialog();
                deleteSubContractMaterialIssued(SubContractMaterialIssued.id)
            },
            onNo: () => hideDialog(),
            variant:'confirm'
        });
        break;
        default:
        break;
    }
  }

  return (
    <>
        <Dialog
            open={openDocumentDialog}
            fullWidth  
            fullScreen={belowLargeScreen}
            maxWidth={'md'} 
            scroll={belowLargeScreen ? 'body' : 'paper'}
            onClose={() => setOpenDocumentDialog(false)}
        >
          {!!openDocumentDialog && <DocumentDialog SubContractMaterialIssued={SubContractMaterialIssued} organization={organization} setOpenDocumentDialog={setOpenDocumentDialog} openDocumentDialog={openDocumentDialog}/>}
        </Dialog>
        <JumboDdMenu
            icon={
                <Tooltip title={dictionary.tooltips.actions}>
                    <MoreHorizOutlined/>
                </Tooltip>
            }
            menuItems={menuItems}
            onClickCallback={handleItemAction}
        />
    </>
  );
};

export default SubContractMaterialIssuedItemAction;