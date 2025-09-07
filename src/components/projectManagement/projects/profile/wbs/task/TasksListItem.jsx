import React from 'react';
import {
  Grid,
  Tooltip,
  Typography,
  ListItemText,
  Chip,
} from '@mui/material';
import TasksItemAction from './TasksItemAction';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';

function TasksListItem({ filteredTasks, activity }) {

  return (
    <Grid size={{xs: 12}} padding={1}>
      {filteredTasks.length > 0 && <Typography>Tasks</Typography>}
      {filteredTasks.map((task, index) => {

        return (
            <Grid
                key={index}
                container 
                columnSpacing={2}  
                width={'100%'} 
                alignItems={'center'}
                sx={{
                    cursor: 'pointer',
                    borderTop: 1,
                    borderColor: 'divider',
                    '&:hover': {
                        bgcolor: 'action.hover',
                    },
                    padding: 1,
                }}
            >
                <Grid size={{xs: 12, md: 4}}>
                    <ListItemText
                        primary={
                        <Tooltip title="Name">
                            <Typography component="span">
                            {task.name}
                            </Typography>
                        </Tooltip>
                        }
                        secondary={
                        <Tooltip title="Code">
                            <Typography component="span">
                            {task.code}
                            </Typography>
                        </Tooltip>
                        }
                    />
                </Grid>
                <Grid size={{xs: 12, md: 2}}>
                    <Tooltip title="Weighted Percentage">
                      <Chip
                        size='small'
                        color='default'
                        label={`${task.weighted_percentage?.toLocaleString()}% Weight`}
                      />
                    </Tooltip>
                </Grid>
                <Grid size={{xs: 6, md: 2.5}}>
                    <Tooltip title='Start Date'>
                        <Typography variant="h5" fontSize={14} lineHeight={1.25} mb={0} noWrap>
                           {readableDate(task.start_date, false)}
                        </Typography>
                    </Tooltip>
                </Grid>
                <Grid size={{xs: 6, md: 2.5}}>
                    <Tooltip title='End Date'>
                        <Typography variant="h5" fontSize={14} lineHeight={1.25} mb={0} noWrap>
                           {readableDate(task.end_date, false)}
                        </Typography>
                    </Tooltip>
                </Grid>
                <Grid size={{xs: 12, md: 1}} textAlign="end">
                   <TasksItemAction task={task} activity={activity}/>
                </Grid>
            </Grid>
        );
      })}
    </Grid>
  );
}

export default TasksListItem;