import React, { lazy, useState, useMemo, useEffect } from 'react';
import { Alert, Grid, ListItemText, Stack, Typography, Divider, Tooltip, useMediaQuery } from '@mui/material';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import JumboSearch from '@jumbo/components/JumboSearch';
import WBSActionTail from './WBSActionTail';
import { useProjectProfile } from '../ProjectProfileProvider';
import WBSItemAction from './WBSItemAction';
import TasksActionTail from './task/TasksActionTail';
import TasksListItem from './task/TasksListItem';
import TasksTreeViewActionTail from './tasksTreeView/TasksTreeViewActionTail';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';

const GanttChartActionTail = lazy(() => import('./ganttChart/GanttChartActionTail'));

const TimelineActivityAccordion = ({ activity, expanded, handleChange }) => {
  const [childExpanded, setChildExpanded] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTasks = activity?.tasks?.filter(task => {
    const description = task.description?.toLowerCase() || '';
    const name = task.name?.toLowerCase() || '';

    return description.includes(searchQuery.toLowerCase()) ||
           name.includes(searchQuery.toLowerCase());
    });

  const filterActivityChildren = (children) => {
    return children
      .filter(child => 
        child.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (child.description && child.description.toLowerCase().includes(searchQuery.toLowerCase())) || 
        child.tasks?.some(task => task.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .map(child => ({
        ...child,
        tasks: child.tasks?.filter(task => task.name.toLowerCase().includes(searchQuery.toLowerCase())),
        children: filterActivityChildren(child.children)
      }));
  };  

  const filteredChildren = filterActivityChildren(activity?.children || []);

  const handleChildChange = (childIndex) => {
    setChildExpanded((prevState) => ({
      ...prevState,
      [childIndex]: !prevState[childIndex],
    }));
  };

  return (
    <Accordion
      expanded={expanded === true}
      onChange={handleChange}
      square
      sx={{
        borderRadius: 2,
        borderTop: 2,
        width: '100%',
        paddingLeft: 1,
        paddingRight: 1,
        borderColor: 'divider',
        '&:hover': {
          bgcolor: 'action.hover',
        },
        '& > .MuiAccordionDetails-root:hover': {
          bgcolor: 'transparent',
        },
      }}
    >
      <AccordionSummary
        expandIcon={expanded ? <RemoveIcon /> : <AddIcon />}
        sx={{
          px: 3,
          flexDirection: 'row-reverse',
          '.MuiAccordionSummary-content': {
            alignItems: 'center',
            '&.Mui-expanded': {
              margin: '12px 0',
            },
          },
          '.MuiAccordionSummary-expandIconWrapper': {
            borderRadius: 1,
            border: 1,
            color: 'text.secondary',
            transform: 'none',
            mr: 1,
            '&.Mui-expanded': {
              transform: 'none',
              color: 'primary.main',
              borderColor: 'primary.main',
            },
            '& svg': {
              fontSize: '1.25rem',
            },
          },
        }}
      >
        <Grid container paddingLeft={0.1} width={'100%'} paddingRight={0.1} columnSpacing={1} rowSpacing={1} alignItems={'center'}>
          <Grid size={{xs: 8, md: 5.5}}>
            <ListItemText
              primary={
                <Tooltip title={'Activity Name'}>
                  <Typography component="span">{activity.name}</Typography>
                </Tooltip>
              }
              secondary={
                <Tooltip title={'Code'}>
                  <Typography component="span">{activity.code}</Typography>
                </Tooltip>
              }
            />
          </Grid>
          {activity.description &&
            <Grid size={{xs: 8, md: 5.5}}>
              <ListItemText
                secondary={
                  <Tooltip title={'Description'}>
                    <Typography component="span">{activity.description}</Typography>
                  </Tooltip>
                }
              />
            </Grid>
          }
          <Grid size={{xs: 4, md: activity.description ? 1 : 6.5}} textAlign={'end'}>
            <WBSItemAction activity={activity} />
          </Grid>
        </Grid>
        <Divider />
      </AccordionSummary>

      <AccordionDetails
        sx={{
          backgroundColor: 'background.paper',
          marginBottom: 3,
          paddingLeft: 0,
          paddingRight: 0,
        }}
      >
        <Grid container width={'100%'}>
          <Grid size={{xs: 12}} textAlign={'end'} display="flex" justifyContent="flex-end" alignItems="center">
            {((activity.children?.length > 0) || (activity.tasks?.length > 0)) &&
              <Grid paddingBottom={1} >
                <JumboSearch
                  value={searchQuery}
                  onChange={(value) => setSearchQuery(value)}
                />
              </Grid>
            }
            <Grid>
              {!activity.children?.length && <TasksActionTail openDialog={openDialog} setOpenDialog={setOpenDialog} activity={activity} />}
            </Grid>
            <Grid>
              {!activity.tasks?.length && <WBSItemAction activity={activity} isAccDetails={true} />}
            </Grid>
          </Grid>

          {/* Tasks List Item */}
          <TasksListItem filteredTasks={filteredTasks} activity={activity}/>

          {/* Render child activity as nested Accordions */}
          {filteredChildren?.length > 0 && (
            <Grid size={{xs: 12}}>
              {filteredChildren?.map((child, index) => (
                <TimelineActivityAccordion
                  key={child.id || index}
                  activity={child}
                  expanded={childExpanded[index] === true}
                  handleChange={() => handleChildChange(index)}
                  openDialog={openDialog}
                  setOpenDialog={setOpenDialog}
                />
              ))}
            </Grid>
          )}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

function WBSListItem() {
  const { projectTimelineActivities, timelineLoading } = useProjectProfile();
  const [openDialog, setOpenDialog] = useState(false);
  const [expanded, setExpanded] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize expanded state with proper boolean values when data loads
  useEffect(() => {
    if (projectTimelineActivities) {
      // Initialize with all accordions closed (false)
      setExpanded(Array(projectTimelineActivities.length).fill(false));
    }
  }, [projectTimelineActivities]);

  const filteredTimelineActivity = projectTimelineActivities?.filter(activity =>
    activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (activity.description && activity.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const sortedTimelineActivity = filteredTimelineActivity?.sort((a, b) => {
    if (a.position_index === null) return 1; 
    if (b.position_index === null) return -1;
    return a.position_index - b.position_index;
  });

  const handleChange = (index) => {
    const newExpanded = [...expanded];
    newExpanded[index] = !newExpanded[index];
    setExpanded(newExpanded);
  };

  const { theme } = useJumboTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('md'));

  if (timelineLoading) {
    return <Alert variant="outlined" color="info" severity="info">Loading timeline activities...</Alert>;
  }

  return (
    <React.Fragment>
      <Grid container columnSpacing={1} width={'100%'} justifyContent="flex-end" alignItems="center">
        {projectTimelineActivities?.length > 0 &&
          <Grid>
            <JumboSearch
              value={searchQuery}
              onChange={(value) => setSearchQuery(value)}
            />
          </Grid>
        }
        {isLargeScreen &&
          <Grid>
            <GanttChartActionTail/>
          </Grid>
        }
        {isLargeScreen &&
          <Grid>
            <TasksTreeViewActionTail/>
          </Grid>
        }
        <Grid>
          <WBSActionTail openDialog={openDialog} setOpenDialog={setOpenDialog} activity={null}/>
        </Grid>
      </Grid>
      <Stack direction={'column'}>
        {sortedTimelineActivity && sortedTimelineActivity.length > 0 ? (
          sortedTimelineActivity.map((activity, index) => (
            <TimelineActivityAccordion
              key={activity.id || index}
              activity={activity}
              expanded={expanded[index] === true}
              handleChange={() => handleChange(index)}
              openDialog={openDialog}
              setOpenDialog={setOpenDialog}
            />
          ))
        ) : (
          <Alert variant="outlined" severity="info">
            No Timeline Activity Found
          </Alert>
        )}
      </Stack>
    </React.Fragment>
  );
}

export default WBSListItem;