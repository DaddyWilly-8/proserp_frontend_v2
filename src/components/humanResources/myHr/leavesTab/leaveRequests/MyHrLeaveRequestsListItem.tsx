import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { LeaveRequestType } from '@/components/humanResources/employees/profile/leaveRequests/LeaveRequestType';
import LeaveRequestPDF from '@/components/humanResources/employees/profile/leaveRequests/LeaveRequestPDF';
import LeaveRequestPreview from '@/components/humanResources/employees/profile/leaveRequests/LeaveRequestPreview';
import humanResourcesServices from '@/components/humanResources/humanResourcesServices';
import PDFContent from '@/components/pdf/PDFContent';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import PreviewOutlined from '@mui/icons-material/PreviewOutlined';
import PrintOutlined from '@mui/icons-material/PrintOutlined';
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  Grid,
  IconButton,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const MyHrLeaveRequestsListItem = ({
  leaveRequest,
}: {
  leaveRequest: LeaveRequestType;
}) => {
  const dictionary = useDictionary();
  const t = dictionary.humanResources.myHr.leaves.requests;
  const [openPrint, setOpenPrint] = useState(false);
  const [openPreview, setOpenPreview] = useState(false);
  const { authOrganization, authUser } = useJumboAuth() as any;
  const organization = authOrganization?.organization;
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { data: leaveDetails } = useQuery({
    queryKey: ['myHrShowLeaveRequest', leaveRequest.id],
    queryFn: () => humanResourcesServices.myHrShowLeaveRequest(leaveRequest.id),
    enabled: openPrint || openPreview,
  });

  const details: LeaveRequestType = (leaveDetails || leaveRequest) as LeaveRequestType;

  const statusColor: any =
    leaveRequest.status === 'approved'
      ? 'success'
      : leaveRequest.status === 'rejected'
        ? 'error'
        : leaveRequest.status === 'cancelled'
          ? 'default'
          : 'warning';

  // status_label is backend-computed — "Waiting for {Role}" while a chain-driven
  // request sits at a pending level, same convention as Requisitions.
  const formattedStatus =
    leaveRequest.status_label ||
    (leaveRequest.status === 'in_review'
      ? t.statuses.inReview
      : leaveRequest.status === 'approved'
        ? t.statuses.approved
        : leaveRequest.status === 'cancelled'
          ? t.statuses.cancelled
          : leaveRequest.status === 'rejected'
            ? t.statuses.rejected
            : leaveRequest.status || t.statuses.pending);

  return (
    <>
      <Divider />
      <Grid
        container
        spacing={1}
        alignItems='center'
        width='100%'
        paddingLeft={1}
        paddingRight={1}
        my={1}
      >
        <Grid size={{ xs: 12, md: 3.2 }}>
          <Tooltip title={dictionary.tooltips.leaveType}>
            <Typography>
              {leaveRequest.leave_type?.name ||
                t.typeNumber.replace('{id}', String(leaveRequest.leave_type_id))}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 1.8 }}>
          <Tooltip title={dictionary.tooltips.startDate}>
            <Typography>
              {dayjs(leaveRequest.start_date).format('YYYY-MM-DD')}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 1.8 }}>
          <Tooltip title={dictionary.tooltips.endDate}>
            <Typography>
              {dayjs(leaveRequest.end_date).format('YYYY-MM-DD')}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2.2 }}>
          <Tooltip title={dictionary.tooltips.days}>
            <Typography>
              {leaveRequest.days_granted != null
                ? `${leaveRequest.days_granted}/${leaveRequest.days_requested}`
                : leaveRequest.days_requested}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 8, md: 2 }}>
          <Chip
            label={formattedStatus}
            size='small'
            color={statusColor}
            variant='outlined'
            sx={{ textTransform: 'capitalize' }}
          />
        </Grid>

        <Grid size={{ xs: 4, md: 1 }} textAlign='end'>
          <Tooltip title={dictionary.tooltips.preview}>
            <IconButton size='small' onClick={() => setOpenPreview(true)}>
              <PreviewOutlined color='primary' fontSize='small' />
            </IconButton>
          </Tooltip>
          <Tooltip title={dictionary.tooltips.printLeaveApplicationForm}>
            <IconButton size='small' onClick={() => setOpenPrint(true)}>
              <PrintOutlined color='primary' fontSize='small' />
            </IconButton>
          </Tooltip>
        </Grid>
      </Grid>

      <Dialog
        open={openPreview}
        fullWidth
        maxWidth='sm'
        fullScreen={belowLargeScreen}
        scroll={belowLargeScreen ? 'body' : 'paper'}
        onClose={() => setOpenPreview(false)}
      >
        <DialogContent>
          <LeaveRequestPreview leaveRequest={details} title={t.yourLeaveRequest} />
        </DialogContent>
        <DialogActions>
          <Button size='small' onClick={() => setOpenPreview(false)}>
            {t.close}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openPrint}
        onClose={() => setOpenPrint(false)}
        maxWidth='md'
        fullWidth
        fullScreen={belowLargeScreen}
      >
        <DialogContent sx={{ height: belowLargeScreen ? '100%' : '80vh', p: 0 }}>
          {openPrint && details && (
            <PDFContent
              document={
                <LeaveRequestPDF
                  data={details}
                  dictionary={dictionary}
                  organization={organization}
                  userName={authUser?.user?.name || 'ProsERP'}
                  employeeName={authUser?.user?.name}
                />
              }
              fileName={`Leave Application - ${authUser?.user?.name || 'Employee'}`}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MyHrLeaveRequestsListItem;
