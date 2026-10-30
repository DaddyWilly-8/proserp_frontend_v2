import JumboChipsGroup from '@jumbo/components/JumboChipsGroup';
import { Avatar, Grid, ListItemAvatar, Tooltip, Typography } from '@mui/material'
import React from 'react'
import { Div } from '@jumbo/shared';
import ProjectUserAction from './ProjectUserAction';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface Role {
  id: number;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  profile_pic: any
  phone: string
  roles: Role[];
}

interface ProjectUsersListItemProps {
  user: User;
}

function ProjectUsersListItem({ user }: ProjectUsersListItemProps) {
  const dictionary = useDictionary();
  return (
    <React.Fragment>
        <Grid 
            container 
            columnSpacing={1}
            padding={1}  
            sx={{
                cursor: 'pointer',
                borderBottom: 1,
                borderColor: 'divider',
                '&:hover': {
                    bgcolor: 'action.hover',
                }
            }}
        >
            <Grid size={{ md: 0.5 }} paddingTop={0.5}>
                <ListItemAvatar sx={{ display: { 'xs' : 'none', md:'block'} }}>
                    <Avatar alt={user.name} src={user?.profile_pic ? user.profile_pic : '#'}/>
                </ListItemAvatar>
            </Grid>
            <Grid size={{ xs: 10, md: 5, lg: 5 }}>
                <Div sx={{ mt: 1}}>
                    <Tooltip title={dictionary.tooltips.name}>
                        <Typography>{user.name}</Typography>
                    </Tooltip>
                </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 3.5, lg: 3.5 }}>
                <Div sx={{ mt: 1, paddingLeft: 1 }}>
                    <Tooltip title={dictionary.tooltips.email}>
                        <Typography>{user.email}</Typography>
                    </Tooltip>
                </Div>
            </Grid>
            <Grid size={{ xs: 11, md: 2, lg: 2 }}>
                <Div sx={{ mt: 1, paddingLeft: 1 }}>
                    <Tooltip title={dictionary.tooltips.phone}>
                        <Typography>{user.phone || dictionary.projectManagement.projectUsers.notAvailable}</Typography>
                    </Tooltip>
                </Div>
            </Grid>
            <Grid size={1} textAlign={'end'}>
                <ProjectUserAction user={user}/>
            </Grid>
        </Grid>
    </React.Fragment>
  )
}

export default ProjectUsersListItem