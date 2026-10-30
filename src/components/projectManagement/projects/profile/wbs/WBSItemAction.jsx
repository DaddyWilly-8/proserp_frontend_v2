'use client'
import { Dialog, IconButton, Tooltip, useMediaQuery } from '@mui/material'
import React, {  useState} from 'react'
import { DeleteOutlined, EditOutlined, MoreHorizOutlined, PlaylistAddCheck} from '@mui/icons-material'
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog'
import { useSnackbar } from 'notistack'
import WBSForm from './WBSForm'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks'
import projectsServices from '../../project-services'
import { JumboDdMenu } from '@jumbo/components'
import { useJumboAuth } from '@/app/providers/JumboAuthProvider'
import { PERMISSIONS } from '@/utilities/constants/permissions'
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

function WBSItemAction({activity, isAccDetails}) {
    const dictionary = useDictionary();
    const {showDialog,hideDialog} = useJumboDialog();
    const {enqueueSnackbar} = useSnackbar();
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const queryClient = useQueryClient();
    const { checkOrganizationPermission } = useJumboAuth();

      //Screen handling constants
    const {theme} = useJumboTheme();
    const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

    // React Query v5 syntax for useMutation
    const deleteTimelineActivity = useMutation({
        mutationFn: projectsServices.deleteTimelineActivity,
        onSuccess: (data) => {
            enqueueSnackbar(data.message,{variant : 'success'});
            queryClient.invalidateQueries({queryKey: ['projectTimelineActivities']});
        },
        onError: (error) => {
            enqueueSnackbar(error?.response?.data.message,{variant : 'error'});
        },
    });

    const menuItems = [
        checkOrganizationPermission(PERMISSIONS.PROJECTS_EDIT) && {icon: <EditOutlined/>, title: dictionary.projectManagement.wbs.common.edit, action: 'edit'},
        checkOrganizationPermission(PERMISSIONS.PROJECTS_DELETE) &&
          !(activity.children.length > 0 || activity.tasks.length > 0) &&{icon: <DeleteOutlined color='error'/>, title: dictionary.projectManagement.wbs.common.delete, action: 'delete'}
    ].filter(Boolean);

    const handleItemAction = (menuItem) => {
        switch (menuItem.action) {
          case 'edit':
            setOpenEditDialog(true);
            break;
          case 'delete':
            showDialog({
                title: dictionary.projectManagement.wbs.common.confirmDelete,
                content: dictionary.projectManagement.wbs.activity.confirmDeleteText,
                onYes: () =>{ 
                    hideDialog();
                    deleteTimelineActivity.mutate(activity);
                },
                onNo: () => hideDialog(),
                variant:'confirm'
            });
            break;
            default:
            break;
        }
      }

  return  (
    <React.Fragment>
        <Dialog
            open={openEditDialog || openDialog}
            fullScreen={belowLargeScreen}
            fullWidth
            maxWidth={'md'}
            scroll={belowLargeScreen ? 'body' : 'paper'}
        >
            {openEditDialog && <WBSForm timelineActivity={activity} setOpenDialog={setOpenEditDialog} /> }
            {openDialog && <WBSForm setOpenDialog={setOpenDialog} parentActivity={activity}/> }
        </Dialog>

        {!isAccDetails &&
            <JumboDdMenu
                icon={
                    <Tooltip title={dictionary.tooltips.actions}>
                        <MoreHorizOutlined/>
                    </Tooltip>
                }
                menuItems={menuItems}
                onClickCallback={handleItemAction}
            />
        }

        {!!isAccDetails && checkOrganizationPermission(PERMISSIONS.PROJECTS_EDIT) &&
            <Tooltip title={dictionary.tooltips.addSubActivity}>
                <IconButton onClick={() => setOpenDialog(true)}>
                    <PlaylistAddCheck/>
                </IconButton>
            </Tooltip>
        }

      </React.Fragment>
  )
}

export default WBSItemAction