'use client';

import useProsERPStyles from '@/app/helpers/style-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import UnsubscribedAccess from '@/shared/Information/UnsubscribedAccess';
import PageLoadingSkeleton from '@/shared/ProgressIndicators/PageLoadingSkeleton';
import { MODULES } from '@/utilities/constants/modules';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import JumboCardQuick from '@jumbo/components/JumboCardQuick';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { AssessmentOutlined } from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  Grid,
  Typography,
  useMediaQuery,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import ProjectStatusReport from '../projectStatusReport/ProjectStatusReport';

// Mirrors ProcurementReports/AccountsReports - an independent Reports page for Project
// Management (not a Reports submenu entry), opening each report in a shared dialog. Only one
// report exists today; more land here as tiles the same way the other sections' hubs grew.
function ProjectReports() {
  const css = useProsERPStyles();
  const [openDialog, setOpenDialog] = useState(false);
  const [report, setReport] = useState<React.ReactNode>(null);
  const [mounted, setMounted] = useState(false);

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { checkOrganizationPermission, organizationHasSubscribed } = useJumboAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <PageLoadingSkeleton />;

  if (!organizationHasSubscribed(MODULES.PROJECT_MANAGEMENT)) {
    return <UnsubscribedAccess modules={'Project Management'} />;
  }

  if (!checkOrganizationPermission(PERMISSIONS.PROJECTS_REPORTS)) {
    return <UnauthorizedAccess />;
  }

  return (
    <React.Fragment>
      <Dialog
        scroll={belowLargeScreen ? 'body' : 'paper'}
        fullWidth
        fullScreen={belowLargeScreen}
        maxWidth='lg'
        open={openDialog}
      >
        {report}
        <DialogActions className={css.hiddenOnPrint}>
          <Button
            sx={{ m: 1 }}
            size='small'
            variant='outlined'
            onClick={() => setOpenDialog(false)}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Typography variant='h4' mb={2}>
        Project Management Reports
      </Typography>

      <JumboCardQuick sx={{ height: '100%' }}>
        <Grid container textAlign='center' columnSpacing={2} rowSpacing={2}>
          <Grid
            sx={{
              cursor: 'pointer',
              '&:hover': { bgcolor: 'action.hover' },
            }}
            size={{ xs: 6, md: 3, lg: 2 }}
            p={1}
            textAlign='center'
            onClick={() => {
              setReport(<ProjectStatusReport setOpenDialog={setOpenDialog} />);
              setOpenDialog(true);
            }}
          >
            <AssessmentOutlined sx={{ fontSize: '40px' }} />
            <Typography>Project Status Report</Typography>
          </Grid>
        </Grid>
      </JumboCardQuick>
    </React.Fragment>
  );
}

export default ProjectReports;
