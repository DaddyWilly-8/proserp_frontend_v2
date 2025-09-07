import React from 'react';
import {
  Grid,
  Tooltip,
  Typography,
  ListItemText,
  Chip,
  Alert,
} from '@mui/material';

function DeliverableTasks({ deliverableDetails }) {
  return (
    <Grid size={{ xs: 12 }} padding={1}>
      {deliverableDetails?.tasks.length > 0 ? (
        <>
          <Typography>Tasks</Typography>
          {deliverableDetails.tasks.map((task, index) => (
            <Grid
              key={index}
              container
              columnSpacing={2}
              alignItems="center"
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
              <Grid size={{ xs: 12, md: 4 }}>
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

              <Grid size={{ xs: 6, md: 4 }}>
                <Tooltip title="Quantity">
                  <Typography
                    variant="h5"
                    fontSize={14}
                    lineHeight={1.25}
                    mb={0}
                    noWrap
                  >
                    {task.quantity?.toLocaleString()} {task.measurement_unit?.symbol}
                  </Typography>
                </Tooltip>
              </Grid>

              <Grid size={{ xs: 6, md: 4 }}>
                <Tooltip title="Contribution Percentage">
                  <Chip
                    size="small"
                    color="default"
                    label={`${task.contribution_percentage?.toLocaleString()}%`}
                  />
                </Tooltip>
              </Grid>
            </Grid>
          ))}
        </>
      ) : (
        <Alert variant="outlined" severity="info">
          This Deliverable has no Task to contribute
        </Alert>
      )}
    </Grid>
  );
}

export default DeliverableTasks;
