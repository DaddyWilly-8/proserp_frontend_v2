'use client';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import JumboSearch from '@jumbo/components/JumboSearch';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import {
  Alert,
  Box,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import { lazy, memo, useCallback, useMemo, useState } from 'react';
import { useProjectProfile } from '../ProjectProfileProvider';
import WBSActionTail from './WBSActionTail';
import WBSItemAction from './WBSItemAction';
import TasksActionTail from './task/TasksActionTail';
import TasksListItem from './task/TasksListItem';
import TasksTreeViewActionTail from './tasksTreeView/TasksTreeViewActionTail';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const GanttChartActionTail = lazy(
  () => import('./ganttChart/GanttChartActionTail')
);

const LARGE_LIST_THRESHOLD = 80;
const INITIAL_VISIBLE_COUNT = 60;
const BATCH_SIZE = 40;

function filterActivityChildren(children = [], normalizedQuery = '') {
  if (!normalizedQuery) {
    return children;
  }

  return children.reduce((acc, child) => {
    const filteredChildren = filterActivityChildren(child.children || [], normalizedQuery);
    const filteredTasks = (child.tasks || []).filter((task) => {
      const taskName = task?.name?.toLowerCase() || '';
      const taskDescription = task?.description?.toLowerCase() || '';
      return taskName.includes(normalizedQuery) || taskDescription.includes(normalizedQuery);
    });

    const childName = child?.name?.toLowerCase() || '';
    const childDescription = child?.description?.toLowerCase() || '';
    const childMatches =
      childName.includes(normalizedQuery) || childDescription.includes(normalizedQuery);

    if (childMatches || filteredTasks.length > 0 || filteredChildren.length > 0) {
      acc.push({
        ...child,
        tasks: filteredTasks,
        children: filteredChildren,
      });
    }

    return acc;
  }, []);
}

function LinearProgressWithLabel({
  value,
  color,
  execPercent,
  timePercent,
  hasTimeDates,
}) {
  const dictionary = useDictionary();
  const tooltipMsg = !hasTimeDates
    ? dictionary.projectManagement.wbs.common.noDatesSet
    : color === 'success'
      ? dictionary.projectManagement.wbs.common.onTrack
      : color === 'warning'
        ? dictionary.projectManagement.wbs.common.lagging
        : color === 'error'
          ? dictionary.projectManagement.wbs.common.behindSchedule
          : dictionary.projectManagement.wbs.common.progressStatus;
  return (
    <Box sx={{ width: '100%' }}>
      <Box
        sx={(theme) => ({
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: { xs: 'flex-start', sm: 'space-between' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: 0.5,
          gap: { xs: 0.5, sm: 0 },
        })}
      >
        <Typography variant='body2' color='text.secondary' fontWeight={500}>
          {dictionary.projectManagement.wbs.common.execution}: {Math.min(100, Number(execPercent).toFixed(2))}%
        </Typography>
        {hasTimeDates ? (
          <Typography variant='body2' color='text.secondary' fontWeight={500}>
            {dictionary.projectManagement.wbs.common.timeElapsed}: {Math.min(100, Number(timePercent).toFixed(2))}%
          </Typography>
        ) : (
          <Chip
            size='small'
            label={dictionary.projectManagement.wbs.common.timeNotSet}
            variant='outlined'
            sx={{ fontSize: '0.7rem', height: 20 }}
          />
        )}
      </Box>
      <Tooltip title={tooltipMsg}>
        <LinearProgress
          variant='determinate'
          value={Math.min(Number(value) || 0, 100)}
          color={color}
          sx={{ height: 8, borderRadius: 2 }}
        />
      </Tooltip>
    </Box>
  );
}

const TimelineActivityAccordion = memo(function TimelineActivityAccordion({ activity, expanded, handleChange }) {
  const dictionary = useDictionary();
  const [childExpanded, setChildExpanded] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const normalizedQuery = useMemo(
    () => searchQuery.trim().toLowerCase(),
    [searchQuery]
  );

  const filteredTasks = useMemo(() => {
    const tasks = activity?.tasks || [];
    if (!normalizedQuery) {
      return tasks;
    }

    return tasks.filter((task) => {
      const description = task?.description?.toLowerCase() || '';
      const name = task?.name?.toLowerCase() || '';
      return description.includes(normalizedQuery) || name.includes(normalizedQuery);
    });
  }, [activity?.tasks, normalizedQuery]);

  const filteredChildren = useMemo(
    () => filterActivityChildren(activity?.children || [], normalizedQuery),
    [activity?.children, normalizedQuery]
  );

  const handleChildChange = useCallback((childIndex) => {
    setChildExpanded((prev) => ({
      ...prev,
      [childIndex]: !prev[childIndex],
    }));
  }, []);

  // --- Improved Color Logic: execution vs time ---
  const execPercent = activity.executed_percentage ?? 0;
  // Clamp timePercent to 100 for display and calculation
  const rawTimePercent = activity.percentage_time_elapsed ?? 0;
  const timePercent = Math.min(100, rawTimePercent);
  const hasTimeDates = Boolean(activity.start_date && activity.end_date);

  let execColor = 'primary';
  if (hasTimeDates) {
    execColor = 'success';
    const diff = timePercent - execPercent;
    if (diff >= 10) {
      execColor = 'error';
    } else if (diff >= 5) {
      execColor = 'warning';
    }
  }

  return (
    <Accordion
      expanded={expanded}
      onChange={handleChange}
      TransitionProps={{ unmountOnExit: true }}
      square
      sx={{
        borderRadius: 2,
        borderTop: 2,
        width: '100%',
        px: 1,
        borderColor: 'divider',
        '&:hover': { bgcolor: 'action.hover' },
        '& > .MuiAccordionDetails-root:hover': { bgcolor: 'transparent' },
      }}
    >
      <AccordionSummary
        expandIcon={expanded ? <RemoveIcon /> : <AddIcon />}
        sx={{
          px: 3,
          flexDirection: 'row-reverse',
          '.MuiAccordionSummary-content': {
            alignItems: 'center',
            '&.Mui-expanded': { margin: '12px 0' },
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
            '& svg': { fontSize: '1.25rem' },
          },
        }}
      >
        <Grid
          container
          width={'100%'}
          spacing={1}
          alignItems='center'
          justifyContent='space-between'
          sx={{ mb: 1, px: 2 }}
        >
          <Grid size={{ xs: 8, md: 5 }}>
            <ListItemText
              primary={
                <>
                  <Tooltip title={dictionary.tooltips.activityName}>
                    <Typography component='span' color='text.primary'>
                      {activity.name}
                    </Typography>
                  </Tooltip>
                  {activity.code && (
                    <Tooltip title={dictionary.tooltips.activityCode}>
                      <Typography
                        component='h4'
                        variant='body2'
                        color='text.disabled'
                        fontWeight={400}
                      >
                        {activity.code}
                      </Typography>
                    </Tooltip>
                  )}
                </>
              }
              secondary={
                <Tooltip title={dictionary.tooltips.description}>
                  <Typography
                    component='span'
                    color='text.secondary'
                    fontSize={14}
                  >
                    {activity.description}
                  </Typography>
                </Tooltip>
              }
            />
          </Grid>

          <Grid size={{ xs: 12, md: 2.5 }}>
            <Tooltip title={dictionary.tooltips.startToEndDate}>
              <Typography variant='body2'>
                {activity.start_date || activity.end_date
                  ? `${activity.start_date ? readableDate(activity.start_date, false) : dictionary.projectManagement.wbs.common.notSet} ${
                      activity.end_date
                        ? '→ ' + readableDate(activity.end_date, false)
                        : ''
                    }`
                  : dictionary.projectManagement.wbs.common.notSet}
              </Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 12, md: 2.5 }}>
            <Tooltip title={dictionary.tooltips.durationInDaysAndDaysRemaining}>
              <ListItemText
                primary={
                  <Typography variant='body2' color='text.secondary'>
                    <strong>{dictionary.projectManagement.wbs.common.duration}:</strong>{' '}
                    {activity.number_of_days
                      ? `${activity.number_of_days} ${dictionary.projectManagement.wbs.common.days}`
                      : '-'}
                  </Typography>
                }
                secondary={
                  <Typography
                    variant='caption'
                    color={
                      activity.days_remaining < 0 && execColor !== 'success'
                        ? 'error.main'
                        : 'text.secondary'
                    }
                  >
                    <strong>{dictionary.projectManagement.wbs.common.remaining}:</strong>{' '}
                    {activity.days_remaining < 0
                      ? 0
                      : (activity.days_remaining ?? '—')}
                  </Typography>
                }
              />
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <Box>
              <LinearProgressWithLabel
                value={Math.min(100, Number(execPercent).toFixed(2))}
                label={`${dictionary.projectManagement.wbs.common.progress} (${Number(execPercent).toFixed(2)}%)`}
                color={execColor}
                execPercent={execPercent}
                timePercent={timePercent}
                hasTimeDates={hasTimeDates}
              />
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }} textAlign='end'>
            <Stack
              direction='row'
              spacing={1}
              alignItems='center'
              justifyContent='flex-end'
            >
              <Tooltip title={dictionary.tooltips.weightedPercentage}>
                <Chip
                  size='small'
                  label={`${typeof activity.weighted_percentage === 'number' ? activity.weighted_percentage.toFixed(2) : 0}% ${dictionary.projectManagement.wbs.common.weight}`}
                  color='default'
                />
              </Tooltip>
              <WBSItemAction activity={activity} />
            </Stack>
          </Grid>
        </Grid>
        <Divider />
      </AccordionSummary>

      {expanded && (
      <AccordionDetails
        sx={{
          backgroundColor: 'background.paper',
          mb: 3,
          px: 0,
        }}
      >
        <Grid container>
          <Grid
            size={12}
            textAlign='end'
            paddingTop={1}
            display='flex'
            justifyContent='flex-end'
            alignItems='center'
          >
            {(activity.children?.length > 0 || activity.tasks.length > 0) && (
              <Grid size={{ xs: 12, md: 4 }} pb={1}>
                <Tooltip title={dictionary.tooltips.searchTasksOrActivities}>
                  <div>
                    <JumboSearch
                      value={searchQuery}
                      onChange={(v) => setSearchQuery(v)}
                    />
                  </div>
                </Tooltip>
              </Grid>
            )}
            <Grid>
              {!activity.children.length > 0 && (
                <Tooltip title={dictionary.tooltips.addTask}>
                  <div>
                    <TasksActionTail
                      openDialog={openDialog}
                      setOpenDialog={setOpenDialog}
                      activity={activity}
                    />
                  </div>
                </Tooltip>
              )}
            </Grid>
            <Grid>
              {!activity.tasks?.length > 0 && (
                <Tooltip title={dictionary.tooltips.addSubActivity2}>
                  <div>
                    <WBSItemAction activity={activity} isAccDetails />
                  </div>
                </Tooltip>
              )}
            </Grid>
          </Grid>

          <TasksListItem filteredTasks={filteredTasks} activity={activity} />

          {filteredChildren.length > 0 && (
            <Grid size={12}>
              {filteredChildren.map((child, index) => (
                <TimelineActivityAccordion
                  key={child?.id ?? index}
                  activity={child}
                  expanded={!!childExpanded[index]}
                  handleChange={() => handleChildChange(index)}
                  openDialog={openDialog}
                  setOpenDialog={setOpenDialog}
                />
              ))}
            </Grid>
          )}
        </Grid>
      </AccordionDetails>
      )}
    </Accordion>
  );
});

function WBSListItem() {
  const { projectTimelineActivities } = useProjectProfile();
  const [openDialog, setOpenDialog] = useState(false);
  const [expandedById, setExpandedById] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  const normalizedQuery = useMemo(
    () => searchQuery.trim().toLowerCase(),
    [searchQuery]
  );

  const filteredTimelineActivity = useMemo(() => {
    const activities = Array.isArray(projectTimelineActivities)
      ? projectTimelineActivities
      : [];

    if (!normalizedQuery) {
      return activities;
    }

    return activities.filter((activity) => {
      const name = activity?.name?.toLowerCase() || '';
      const description = activity?.description?.toLowerCase() || '';
      return name.includes(normalizedQuery) || description.includes(normalizedQuery);
    });
  }, [projectTimelineActivities, normalizedQuery]);

  const sortedTimelineActivity = useMemo(() => {
    return [...filteredTimelineActivity].sort((a, b) => {
      if (a.position_index === null) return 1;
      if (b.position_index === null) return -1;
      return a.position_index - b.position_index;
    });
  }, [filteredTimelineActivity]);

  const isLargeList = sortedTimelineActivity.length > LARGE_LIST_THRESHOLD;
  const visibleTimelineActivities = useMemo(() => {
    if (!isLargeList) {
      return sortedTimelineActivity;
    }
    return sortedTimelineActivity.slice(0, visibleCount);
  }, [sortedTimelineActivity, isLargeList, visibleCount]);

  const hasMore = isLargeList && visibleCount < sortedTimelineActivity.length;

  const handleChange = useCallback((activityId) => {
    setExpandedById((prevState) => ({
      ...prevState,
      [activityId]: !prevState[activityId],
    }));
  }, []);

  const loadMore = useCallback(() => {
    if (!hasMore) return;
    setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, sortedTimelineActivity.length));
  }, [hasMore, sortedTimelineActivity.length]);

  const handleListScroll = useCallback(
    (event) => {
      if (!hasMore) return;
      const target = event.currentTarget;
      const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
      if (distanceToBottom < 220) {
        loadMore();
      }
    },
    [hasMore, loadMore]
  );

  const { theme } = useJumboTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('md'));

  return (
    <>
      <Grid
        container
        columnSpacing={1}
        justifyContent='flex-end'
        alignItems='center'
        width={'100%'}
      >
        {projectTimelineActivities?.length > 0 && (
          <Grid size={{ xs: 11, md: 3.5 }}>
            <JumboSearch
              value={searchQuery}
              onChange={(value) => setSearchQuery(value)}
            />
          </Grid>
        )}
        {isLargeScreen && (
          <>
            <Grid size={0.5}>
              <GanttChartActionTail />
            </Grid>
            <Grid size={0.5}>
              <TasksTreeViewActionTail />
            </Grid>
          </>
        )}
        <Grid size={{ xs: 1, md: 1 }}>
          <WBSActionTail
            openDialog={openDialog}
            setOpenDialog={setOpenDialog}
            activity={null}
          />
        </Grid>
      </Grid>

      {isLargeScreen && isLargeList && (
        <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1 }}>
          Showing {visibleTimelineActivities.length} of {sortedTimelineActivity.length}
        </Typography>
      )}

      <Stack
        direction='column'
        onScroll={isLargeList ? handleListScroll : undefined}
        sx={
          isLargeList
            ? {
                maxHeight: '70vh',
                overflowY: 'auto',
                pr: 0.5,
              }
            : undefined
        }
      >
        {visibleTimelineActivities?.length > 0 ? (
          visibleTimelineActivities.map((activity, index) => (
            <TimelineActivityAccordion
              key={activity?.id ?? index}
              activity={activity}
              expanded={!!expandedById[activity?.id]}
              handleChange={() => handleChange(activity?.id)}
              openDialog={openDialog}
              setOpenDialog={setOpenDialog}
            />
          ))
        ) : (
          <Alert variant='outlined' severity='info'>
            {dictionary.projectManagement.wbs.activity.notFound}
          </Alert>
        )}
        {hasMore && (
          <Box display='flex' justifyContent='center' py={1}>
            <Chip label={dictionary.projectManagement.wbs.activity.loadMore} onClick={loadMore} clickable variant='outlined' />
          </Box>
        )}
      </Stack>
    </>
  );
}

export default WBSListItem;
