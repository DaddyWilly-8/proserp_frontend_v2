'use client';

import { CloseOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  DialogActions,
  DialogContent,
  DialogTitle,
  Dialog,
  Grid,
  IconButton,
  LinearProgress,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useSnackbar } from 'notistack';
import humanResourcesServices from '../../humanResourcesServices';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

type LeaveTypeOption = { id: number; name: string };

type RenewalRow = {
  employee_id: number;
  employee_number: string;
  employee_name: string;
  department: string | null;
  action: 'create' | 'update' | 'skip';
  prior_allocation_id: number | null;
  prior_start_date: string | null;
  prior_end_date: string | null;
  prior_allocated_days: number | null;
  prior_used_days: number | null;
};

type PreviewResponse = {
  rows: RenewalRow[];
  new_cycle_start_date: string;
  would_create: number;
  would_update: number;
  would_skip: number;
};

const statusChip = (action: RenewalRow['action'], dictionary: any) => {
  if (action === 'create') {
    return <Chip label={dictionary.humanResources.reports.leaveRenewals.status.needsRenewal} size='small' color='warning' />;
  }
  if (action === 'update') {
    return <Chip label={dictionary.humanResources.reports.leaveRenewals.status.active} size='small' color='info' />;
  }
  return <Chip label={dictionary.humanResources.reports.leaveRenewals.status.midCycle} size='small' />;
};

function LeaveRenewalsReportContent({ onClose }: { onClose?: () => void }) {
  const dictionary = useDictionary();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState<number | ''>('');
  const [scope, setScope] = useState<'all' | 'active_contracts'>('all');
  const [gender, setGender] = useState<'' | 'male' | 'female'>('');
  const [startDate, setStartDate] = useState<string>('');
  const [appliedLeaveTypeId, setAppliedLeaveTypeId] = useState<number | ''>('');
  const [appliedScope, setAppliedScope] = useState<'all' | 'active_contracts'>('all');
  const [appliedGender, setAppliedGender] = useState<'' | 'male' | 'female'>('');
  const [appliedStartDate, setAppliedStartDate] = useState<string>('');
  const [confirmApply, setConfirmApply] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [confirmBulkRealign, setConfirmBulkRealign] = useState(false);

  const { data: leaveTypes } = useQuery<LeaveTypeOption[]>({
    queryKey: ['all-leave-types-for-report'],
    queryFn: async () => {
      const response = await humanResourcesServices.getAllLeaveTypes();
      return response?.data || response || [];
    },
    staleTime: 5 * 60_000,
  });

  const { data, isFetching, isError, error, refetch } = useQuery<PreviewResponse>({
    queryKey: ['leave-renewals-preview', appliedLeaveTypeId, appliedScope, appliedGender, appliedStartDate],
    queryFn: () =>
      humanResourcesServices.previewLeaveAllocation({
        leaveTypeId: appliedLeaveTypeId,
        scope: appliedScope,
        gender: appliedGender || undefined,
        start_date: appliedStartDate || undefined,
      }),
    enabled: !!appliedLeaveTypeId,
  });

  const { mutate: applyAllocation, isPending: isApplying } = useMutation({
    mutationFn: humanResourcesServices.applyLeaveAllocation,
    onSuccess: (result) => {
      enqueueSnackbar(
        dictionary.humanResources.reports.leaveRenewals.messages.applied
          .replace('{created}', String(result.created))
          .replace('{updated}', String(result.updated))
          .replace('{skipped}', String(result.skipped)),
        { variant: 'success' }
      );
      setConfirmApply(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['leave-balances-report'] });
    },
    onError: (mutationError: any) => {
      enqueueSnackbar(
        mutationError?.response?.data?.message || dictionary.humanResources.reports.leaveRenewals.messages.applyError,
        { variant: 'error' }
      );
      setConfirmApply(false);
    },
  });

  const { mutate: bulkDelete, isPending: isBulkDeleting } = useMutation({
    mutationFn: humanResourcesServices.bulkDeleteLeaveAllocations,
    onSuccess: (result) => {
      enqueueSnackbar(result?.message || dictionary.humanResources.reports.leaveRenewals.messages.allocationsDeleted, { variant: 'success' });
      setSelectedIds([]);
      setConfirmBulkDelete(false);
      refetch();
    },
    onError: (mutationError: any) => {
      enqueueSnackbar(
        mutationError?.response?.data?.message || dictionary.humanResources.reports.leaveRenewals.messages.deleteError,
        { variant: 'error' }
      );
      setConfirmBulkDelete(false);
    },
  });

  const { mutate: bulkRealign, isPending: isBulkRealigning } = useMutation({
    mutationFn: humanResourcesServices.bulkUpdateLeaveAllocationsStartDate,
    onSuccess: (result) => {
      enqueueSnackbar(result?.message || dictionary.humanResources.reports.leaveRenewals.messages.startDateUpdated, { variant: 'success' });
      setSelectedIds([]);
      setConfirmBulkRealign(false);
      refetch();
    },
    onError: (mutationError: any) => {
      enqueueSnackbar(
        mutationError?.response?.data?.message || dictionary.humanResources.reports.leaveRenewals.messages.startDateError,
        { variant: 'error' }
      );
      setConfirmBulkRealign(false);
    },
  });

  const handlePreview = () => {
    if (!selectedLeaveTypeId) return;
    setSelectedIds([]);
    setAppliedLeaveTypeId(selectedLeaveTypeId);
    setAppliedScope(scope);
    setAppliedGender(gender);
    setAppliedStartDate(startDate);
  };

  const handleApply = (forceUpdate: boolean) => {
    if (!appliedLeaveTypeId) return;
    applyAllocation({
      leaveTypeId: appliedLeaveTypeId,
      scope: appliedScope,
      gender: appliedGender || undefined,
      start_date: appliedStartDate || undefined,
      force_update: forceUpdate,
    });
  };

  const rows = data?.rows || [];
  const needsRenewalCount = data?.would_create ?? 0;
  const selectableRows = rows.filter((row) => row.prior_allocation_id);
  const allSelectableSelected =
    selectableRows.length > 0 && selectedIds.length === selectableRows.length;
  const someSelected = selectedIds.length > 0 && !allSelectableSelected;

  const toggleSelectAll = () => {
    setSelectedIds(allSelectableSelected ? [] : selectableRows.map((row) => row.prior_allocation_id as number));
  };

  const toggleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((existing) => existing !== id) : [...prev, id]
    );
  };

  return (
    <>
      <DialogTitle sx={{ pb: 1 }}>
        {onClose && (
          <Tooltip title={dictionary.tooltips.close}>
            <IconButton
              onClick={() => onClose()}
              sx={{ position: 'absolute', right: 12, top: 12 }}
            >
              <CloseOutlined />
            </IconButton>
          </Tooltip>
        )}
        <Grid container spacing={1.5} alignItems='center'>
          <Grid size={{ xs: 12 }} textAlign='center' marginBottom={2} sx={onClose ? { px: 4 } : undefined}>
            <Typography variant='h3'>{dictionary.humanResources.reports.leaveRenewals.title}</Typography>
            <Typography variant='body2' color='text.secondary'>
              {dictionary.humanResources.reports.leaveRenewals.subtitle}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              select
              label={dictionary.humanResources.reports.common.leaveType}
              size='small'
              fullWidth
              value={selectedLeaveTypeId}
              onChange={(event) =>
                setSelectedLeaveTypeId(event.target.value === '' ? '' : Number(event.target.value))
              }
            >
              <MenuItem value='' disabled>
                {dictionary.humanResources.reports.leaveRenewals.options.selectLeaveType}
              </MenuItem>
              {(leaveTypes || []).map((leaveType) => (
                <MenuItem key={leaveType.id} value={leaveType.id}>
                  {leaveType.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 2.3 }}>
            <TextField
              select
              label={dictionary.humanResources.reports.leaveRenewals.labels.scope}
              size='small'
              fullWidth
              value={scope}
              onChange={(event) => setScope(event.target.value as 'all' | 'active_contracts')}
            >
              <MenuItem value='all'>{dictionary.humanResources.reports.leaveRenewals.options.allEmployees}</MenuItem>
              <MenuItem value='active_contracts'>{dictionary.humanResources.reports.leaveRenewals.options.activeContracts}</MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 2.2 }}>
            <TextField
              select
              label={dictionary.humanResources.reports.leaveRenewals.labels.gender}
              size='small'
              fullWidth
              value={gender}
              onChange={(event) => setGender(event.target.value as '' | 'male' | 'female')}
            >
              <MenuItem value=''>{dictionary.humanResources.reports.leaveRenewals.options.any}</MenuItem>
              <MenuItem value='female'>{dictionary.humanResources.reports.leaveRenewals.options.female}</MenuItem>
              <MenuItem value='male'>{dictionary.humanResources.reports.leaveRenewals.options.male}</MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 2.5 }}>
            <DatePicker
              label={dictionary.humanResources.reports.leaveRenewals.labels.startDateOptional}
              value={startDate ? dayjs(startDate) : null}
              onChange={(val) => setStartDate(val ? val.format('YYYY-MM-DD') : '')}
              slotProps={{
                textField: { size: 'small', fullWidth: true },
                field: { clearable: true },
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <Button
              variant='contained'
              size='small'
              fullWidth
              disabled={!selectedLeaveTypeId}
              onClick={handlePreview}
            >
              {dictionary.humanResources.reports.leaveRenewals.buttons.preview}
            </Button>
          </Grid>
        </Grid>
      </DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
        {isFetching && <LinearProgress sx={{ mb: 2 }} />}

        {isError && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {(error as Error)?.message || dictionary.humanResources.reports.leaveRenewals.messages.loadError}
          </Alert>
        )}

        {!appliedLeaveTypeId && !isFetching && (
          <Alert severity='info'>{dictionary.humanResources.reports.leaveRenewals.messages.pickLeaveType}</Alert>
        )}

        {!!appliedLeaveTypeId && !isFetching && data && (
          <Box>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
              {dictionary.humanResources.reports.leaveRenewals.summary.newCyclesStart} <strong>{data.new_cycle_start_date}</strong>
              {!appliedStartDate && ` ${dictionary.humanResources.reports.leaveRenewals.summary.automatic}`}
            </Typography>
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Alert severity={needsRenewalCount > 0 ? 'warning' : 'success'} variant='outlined'>
                  {dictionary.humanResources.reports.leaveRenewals.summary.needRenewal.replace('{count}', String(needsRenewalCount))}
                </Alert>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Alert severity='info' variant='outlined'>
                  {dictionary.humanResources.reports.leaveRenewals.summary.active.replace('{count}', String(data.would_update))}
                </Alert>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Alert severity='info' variant='outlined' sx={{ color: 'text.secondary' }}>
                  {dictionary.humanResources.reports.leaveRenewals.summary.midCycleSkipped.replace('{count}', String(data.would_skip))}
                </Alert>
              </Grid>
            </Grid>

            {rows.length === 0 ? (
              <Alert severity='info'>{dictionary.humanResources.reports.leaveRenewals.messages.noEmployeesInScope}</Alert>
            ) : (
              <TableContainer sx={{ mb: 2 }}>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell padding='checkbox'>
                        <Checkbox
                          size='small'
                          indeterminate={someSelected}
                          checked={allSelectableSelected}
                          disabled={selectableRows.length === 0}
                          onChange={toggleSelectAll}
                        />
                      </TableCell>
                      <TableCell>{dictionary.humanResources.reports.common.employeeNo}</TableCell>
                      <TableCell>{dictionary.humanResources.reports.common.name}</TableCell>
                      <TableCell>{dictionary.humanResources.reports.common.department}</TableCell>
                      <TableCell>{dictionary.humanResources.reports.common.status}</TableCell>
                      <TableCell>{dictionary.humanResources.reports.leaveRenewals.labels.currentStartDate}</TableCell>
                      <TableCell>{dictionary.humanResources.reports.leaveRenewals.labels.priorCycleEnd}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.employee_id} hover>
                        <TableCell padding='checkbox'>
                          <Checkbox
                            size='small'
                            checked={!!row.prior_allocation_id && selectedIds.includes(row.prior_allocation_id)}
                            disabled={!row.prior_allocation_id}
                            onChange={() =>
                              row.prior_allocation_id && toggleSelectOne(row.prior_allocation_id)
                            }
                          />
                        </TableCell>
                        <TableCell>{row.employee_number}</TableCell>
                        <TableCell>{row.employee_name}</TableCell>
                        <TableCell>{row.department || '-'}</TableCell>
                        <TableCell>{statusChip(row.action, dictionary)}</TableCell>
                        <TableCell>{row.prior_start_date || '-'}</TableCell>
                        <TableCell>{row.prior_end_date || dictionary.humanResources.reports.leaveRenewals.summary.neverAllocated}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {selectedIds.length > 0 && (
              <Alert
                severity='warning'
                variant='outlined'
                sx={{ mb: 2 }}
                action={
                  <Stack direction='row' spacing={1}>
                    <Button
                      size='small'
                      color='warning'
                      variant='outlined'
                      disabled={!startDate}
                      onClick={() => setConfirmBulkRealign(true)}
                    >
                      {dictionary.humanResources.reports.leaveRenewals.buttons.setStartDate}
                    </Button>
                    <Button
                      size='small'
                      color='error'
                      variant='outlined'
                      onClick={() => setConfirmBulkDelete(true)}
                    >
                      {dictionary.humanResources.reports.leaveRenewals.buttons.delete}
                    </Button>
                  </Stack>
                }
              >
                {dictionary.humanResources.reports.leaveRenewals.summary.selected.replace('{count}', String(selectedIds.length))}
                {!startDate && ` ${dictionary.humanResources.reports.leaveRenewals.summary.pickStartDateHint}`}
              </Alert>
            )}

            <LoadingButton
              variant='contained'
              color='warning'
              size='small'
              loading={isApplying}
              disabled={rows.length === 0}
              onClick={() => setConfirmApply(true)}
            >
              {dictionary.humanResources.reports.leaveRenewals.buttons.apply}
            </LoadingButton>
          </Box>
        )}
      </DialogContent>

      {onClose && (
        <DialogActions>
          <Button sx={{ m: 1 }} size='small' variant='outlined' onClick={() => onClose()}>
            {dictionary.humanResources.reports.common.close}
          </Button>
        </DialogActions>
      )}

      <Dialog open={confirmApply} onClose={() => setConfirmApply(false)} maxWidth='sm' fullWidth>
        <DialogTitle>
          <Typography variant='h6' fontWeight={600}>
            {dictionary.humanResources.reports.leaveRenewals.dialogs.confirmTitle}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            {dictionary.humanResources.reports.leaveRenewals.dialogs.confirmContent
              .replace('{created}', String(data?.would_create || 0))
              .replace('{updated}', String(data?.would_update || 0))
              .replace('{skipped}', String(data?.would_skip || 0))}
          </Typography>
          <Typography variant='body2' color='warning.main'>
            {dictionary.humanResources.reports.leaveRenewals.dialogs.cannotUndo}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmApply(false)} variant='outlined'>
            {dictionary.humanResources.reports.leaveRenewals.buttons.cancel}
          </Button>
          <Button onClick={() => handleApply(true)} variant='contained' color='warning'>
            {dictionary.humanResources.reports.leaveRenewals.buttons.continue}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmBulkDelete} onClose={() => setConfirmBulkDelete(false)} maxWidth='sm' fullWidth>
        <DialogTitle>
          <Typography variant='h6' fontWeight={600}>
            {dictionary.humanResources.reports.leaveRenewals.dialogs.deleteTitle.replace('{count}', String(selectedIds.length))}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            {dictionary.humanResources.reports.leaveRenewals.dialogs.deleteContent}
          </Typography>
          <Typography variant='body2' color='error.main'>
            {dictionary.humanResources.reports.leaveRenewals.dialogs.cannotUndo}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmBulkDelete(false)} variant='outlined'>
            {dictionary.humanResources.reports.leaveRenewals.buttons.cancel}
          </Button>
          <LoadingButton
            loading={isBulkDeleting}
            onClick={() => bulkDelete(selectedIds)}
            variant='contained'
            color='error'
          >
            {dictionary.humanResources.reports.leaveRenewals.buttons.delete}
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmBulkRealign} onClose={() => setConfirmBulkRealign(false)} maxWidth='sm' fullWidth>
        <DialogTitle>
          <Typography variant='h6' fontWeight={600}>
            {dictionary.humanResources.reports.leaveRenewals.dialogs.setStartDateTitle.replace('{count}', String(selectedIds.length))}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            {dictionary.humanResources.reports.leaveRenewals.dialogs.setStartDateContentBefore} <strong>{startDate}</strong>
            {dictionary.humanResources.reports.leaveRenewals.dialogs.setStartDateContentAfter}
          </Typography>
          <Typography variant='body2' color='warning.main'>
            {dictionary.humanResources.reports.leaveRenewals.dialogs.cannotUndo}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmBulkRealign(false)} variant='outlined'>
            {dictionary.humanResources.reports.leaveRenewals.buttons.cancel}
          </Button>
          <LoadingButton
            loading={isBulkRealigning}
            onClick={() => bulkRealign({ ids: selectedIds, start_date: startDate })}
            variant='contained'
            color='warning'
          >
            {dictionary.humanResources.reports.leaveRenewals.buttons.continue}
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default function LeaveRenewalsReport({ onClose }: { onClose?: () => void } = {}) {
  return <LeaveRenewalsReportContent onClose={onClose} />;
}
