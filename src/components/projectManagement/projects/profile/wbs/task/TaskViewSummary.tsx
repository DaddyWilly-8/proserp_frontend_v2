import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { FlagOutlined } from '@mui/icons-material';
import {
  Box,
  Chip,
  Grid,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface LinearProgressWithLabelProps {
  value: any;
  execPercent: any;
  timePercent: any;
  color: any;
  hasTimeDates: any;
}

function LinearProgressWithLabel({
  value,
  execPercent,
  timePercent,
  color,
  hasTimeDates,
}: LinearProgressWithLabelProps) {
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
          {dictionary.projectManagement.wbs.common.execution}: {Math.min(100, Math.round(execPercent))}%
        </Typography>
        {hasTimeDates ? (
          <Typography variant='body2' color='text.secondary' fontWeight={500}>
            {dictionary.projectManagement.wbs.common.timeElapsed}: {Math.min(100, Math.round(timePercent))}%
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

const TaskViewSummary = ({ task }: { task: any }) => {
  const dictionary = useDictionary();
  const execPercent = task.executed_percentage ?? 0;
  const rawTimePercent = task.percentage_time_elapsed ?? 0;
  const timePercent = Math.min(100, rawTimePercent);
  const hasTimeDates = Boolean(task.start_date && task.end_date);
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
    <Grid
      container
      columnSpacing={2}
      alignItems='center'
      sx={{
        cursor: 'pointer',
        borderTop: 1,
        borderColor: 'divider',
        p: 1.5,
      }}
    >
      {/* Row 1: Milestone, Name, Code */}
      <Grid size={12} mb={1}>
        <Stack direction='row' spacing={2} alignItems='center'>
          {!!task?.is_milestone && (
            <Tooltip title={dictionary.tooltips.milestoneTask}>
              <FlagOutlined fontSize='small' color='success' />
            </Tooltip>
          )}
          {task.code && (
            <Tooltip title={dictionary.tooltips.taskCode}>
              <Typography variant='body2' color='text.secondary'>
                {task.code}
              </Typography>
            </Tooltip>
          )}
        </Stack>
      </Grid>

      {/* Row 2: Details and Weighted Percentage */}
      <Grid size={12} mb={1}>
        <Grid container spacing={1} alignItems='center'>
          <Grid size={{ xs: 6, md: 3 }}>
            <Tooltip title={dictionary.tooltips.quantity}>
              <Typography variant='body2'>
                {dictionary.projectManagement.wbs.common.quantity}: {task.quantity?.toLocaleString?.() ?? '—'}{' '}
                {task.measurement_unit?.symbol ?? ''}
              </Typography>
            </Tooltip>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Box>
              <Tooltip title={dictionary.tooltips.executedQuantity}>
                <Typography variant='body2'>
                  {dictionary.projectManagement.wbs.common.executed}: {task.executed_quantity?.toLocaleString?.() ?? '—'}{' '}
                  {task.measurement_unit?.symbol ?? ''}
                </Typography>
              </Tooltip>
              <Tooltip title={dictionary.tooltips.remainingQuantity}>
                <Typography variant='caption' color='text.secondary'>
                  {dictionary.projectManagement.wbs.common.remaining}:{' '}
                  {(
                    task.quantity - task.executed_quantity
                  )?.toLocaleString?.() ?? '—'}{' '}
                  {task.measurement_unit?.symbol ?? ''}
                </Typography>
              </Tooltip>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Box>
              <Tooltip title={dictionary.tooltips.startEndDate}>
                <Typography variant='body2' noWrap>
                  {task.start_date || task.end_date
                    ? `${task.start_date ? readableDate(task.start_date, false) : dictionary.projectManagement.wbs.common.notSet} → ${
                        task.end_date
                          ? readableDate(task.end_date, false)
                          : dictionary.projectManagement.wbs.common.notSet
                      }`
                    : dictionary.projectManagement.wbs.common.notSet}
                </Typography>
              </Tooltip>
              <Tooltip title={dictionary.tooltips.duration}>
                <Typography variant='caption' color='text.secondary'>
                  {dictionary.projectManagement.wbs.common.duration}: {task.number_of_days ?? '—'} {dictionary.projectManagement.wbs.common.days}
                </Typography>
              </Tooltip>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, md: 2.5 }}>
            <Tooltip title={dictionary.tooltips.remainingDays}>
              <Typography
                variant='caption'
                color={
                  task.days_remaining < 0 && execColor !== 'success'
                    ? 'error.main'
                    : 'text.secondary'
                }
              >
                <strong>{dictionary.projectManagement.wbs.common.remaining}:</strong>{' '}
                {task.days_remaining < 0 ? 0 : (task.days_remaining ?? '—')}{' '}
                {dictionary.projectManagement.wbs.common.days}
              </Typography>
            </Tooltip>
          </Grid>
        </Grid>
      </Grid>

      {/* Row 3: Single Progress Bar Row */}
      <Grid size={12} mb={1}>
        <Grid container alignItems='center' spacing={2}>
          <Grid size={{ xs: 12 }}>
            <LinearProgressWithLabel
              value={execPercent}
              execPercent={execPercent}
              timePercent={timePercent}
              color={execColor}
              hasTimeDates={hasTimeDates}
            />
          </Grid>
          {/* <Grid size={{ xs: 4 }} textAlign={'end'}>
            <Tooltip title={dictionary.tooltips.weightedPercentage}>
              <Chip
                size='small'
                color='default'
                label={`${task.weighted_percentage?.toLocaleString() ?? 0}% ${dictionary.projectManagement.wbs.common.weight}`}
              />
            </Tooltip>
          </Grid> */}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default TaskViewSummary;
