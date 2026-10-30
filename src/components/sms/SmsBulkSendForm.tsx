'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  Alert,
  Autocomplete,
  Card,
  Checkbox,
  Chip,
  FormControlLabel,
  Grid,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { Div } from '@jumbo/shared';
import smsServices from './sms-services';
import stakeholderServices from '@/components/masters/stakeholders/stakeholder-services';
import stakeholderGroupServices from '@/components/masters/stakeholderGroups/stakeholderGroup-services';
import StakeholderSelectProvider from '@/components/masters/stakeholders/StakeholderSelectProvider';
import StakeholderSelector from '@/components/masters/stakeholders/StakeholderSelector';
import { Stakeholder } from '@/components/masters/stakeholders/StakeholderType';
import SmsEmployeeFilterPicker from './SmsEmployeeFilterPicker';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const PLACEHOLDERS = ['name', 'phone', 'email', 'gender'];

interface StakeholderGroup {
  id: number;
  name: string;
  stakeholders_count: number;
}

interface FormData {
  rawRecipients: string;
  body: string;
}

interface BulkSendResponse {
  message: string;
  results: { to: string; status: string; id: number }[];
  skipped: { to?: string; name?: string; reason: string }[];
}

const parseRawRecipients = (raw: string) =>
  raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [to, name] = line.split(',').map((part) => part.trim());
      return name ? { to, params: { name } } : { to };
    });

const SmsBulkSendForm = () => {
  const dictionary = useDictionary();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { checkOrganizationPermission } = useJumboAuth();
  const [selectedGroups, setSelectedGroups] = React.useState<StakeholderGroup[]>([]);
  const [selectedStakeholders, setSelectedStakeholders] = React.useState<Stakeholder[]>([]);
  const [allStakeholders, setAllStakeholders] = React.useState(false);
  const [employeeSelection, setEmployeeSelection] = React.useState<{ employeeIds: number[]; allEmployees: boolean }>({
    employeeIds: [],
    allEmployees: false,
  });
  const [lastResult, setLastResult] = React.useState<BulkSendResponse | null>(null);

  const { data: groups = [] } = useQuery<StakeholderGroup[]>({
    queryKey: ['stakeholder-groups-options'],
    queryFn: stakeholderGroupServices.getSelectOptions,
  });

  const { data: allStakeholdersCountData, isFetching: isStakeholderCountFetching } = useQuery({
    queryKey: ['sms-stakeholder-total-count'],
    queryFn: () => stakeholderServices.getList({ type: 'all', keyword: '', page: 1, limit: 1 }),
    enabled: allStakeholders,
  });

  const validationSchema = yup.object({
    rawRecipients: yup.string().default(''),
    body: yup.string().required(dictionary.forms.sms.bulk.errors.templateRequired).max(918, dictionary.forms.sms.bulk.errors.templateMax),
  });

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: { rawRecipients: '', body: '' },
  });

  const body = watch('body') || '';

  const { mutate, isPending } = useMutation<BulkSendResponse, Error, any>({
    mutationFn: (data) => smsServices.bulkSend(data),
    onSuccess: (data) => {
      setLastResult(data);
      enqueueSnackbar(data.message, { variant: data.results?.length ? 'success' : 'warning' });
      reset();
      setSelectedGroups([]);
      setSelectedStakeholders([]);
      setAllStakeholders(false);
      setEmployeeSelection({ employeeIds: [], allEmployees: false });
      queryClient.invalidateQueries({ queryKey: ['sms-balance'] });
      queryClient.invalidateQueries({ queryKey: ['sms-messages'] });
      queryClient.invalidateQueries({ queryKey: ['sms-transactions'] });
    },
    onError: (error) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  const onSubmit = handleSubmit((data) => {
    const rawRecipients = parseRawRecipients(data.rawRecipients);

    if (
      selectedGroups.length === 0 &&
      selectedStakeholders.length === 0 &&
      !allStakeholders &&
      employeeSelection.employeeIds.length === 0 &&
      !employeeSelection.allEmployees &&
      rawRecipients.length === 0
    ) {
      enqueueSnackbar(dictionary.forms.sms.bulk.messages.selectAtLeastOne, { variant: 'error' });
      return;
    }

    mutate({
      group_ids: selectedGroups.map((g) => g.id),
      stakeholder_ids: selectedStakeholders.map((s) => s.id),
      all_stakeholders: allStakeholders,
      employee_ids: employeeSelection.employeeIds,
      all_employees: employeeSelection.allEmployees,
      recipients: rawRecipients,
      body: data.body,
    });
  });

  if (!checkOrganizationPermission(PERMISSIONS.SMS_SEND)) {
    return <UnauthorizedAccess />;
  }

  return (
    <Card sx={{ p: 3 }} component='form' onSubmit={onSubmit} autoComplete='off'>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Div sx={{ mt: 1, mb: 1 }}>
            <Autocomplete<StakeholderGroup, true>
              multiple
              options={groups}
              value={selectedGroups}
              onChange={(_e, newValue) => setSelectedGroups(newValue)}
              getOptionLabel={(option) => `${option.name} (${option.stakeholders_count})`}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => <TextField {...params} label={dictionary.forms.sms.bulk.labels.stakeholderGroups} size='small' />}
            />
          </Div>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Div sx={{ mt: 1, mb: 1 }}>
            <StakeholderSelectProvider>
              <StakeholderSelector
                multiple
                label={dictionary.forms.sms.bulk.labels.individualStakeholders}
                disabled={allStakeholders}
                onChange={(value) => setSelectedStakeholders((value as Stakeholder[]) || [])}
              />
            </StakeholderSelectProvider>
          </Div>
          <FormControlLabel
            control={<Checkbox checked={allStakeholders} onChange={(e) => setAllStakeholders(e.target.checked)} />}
            label={dictionary.forms.sms.bulk.labels.sendToAllStakeholders}
          />
          {allStakeholders && (
            <Alert severity='warning' sx={{ mt: 1 }}>
              {isStakeholderCountFetching
                ? dictionary.forms.sms.bulk.alerts.checkingStakeholders
                : dictionary.forms.sms.bulk.alerts.allStakeholders.replace('{total}', String(allStakeholdersCountData?.total ?? '?'))}
            </Alert>
          )}
        </Grid>
        <Grid size={12}>
          <Typography variant='subtitle2' color='text.secondary' mb={1}>
            {dictionary.forms.sms.bulk.labels.employeesHeading}
          </Typography>
          <SmsEmployeeFilterPicker onChange={setEmployeeSelection} />
        </Grid>
        <Grid size={12}>
          <Div sx={{ mt: 1, mb: 1 }}>
            <Controller
              name='rawRecipients'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={dictionary.forms.sms.bulk.labels.rawRecipients}
                  placeholder={dictionary.forms.sms.bulk.placeholders.rawRecipients}
                  fullWidth
                  multiline
                  minRows={3}
                  size='small'
                />
              )}
            />
          </Div>
        </Grid>
        <Grid size={12}>
          <Stack direction='row' spacing={1} mb={1}>
            <Typography variant='body2' color='text.secondary'>
              {dictionary.forms.sms.bulk.labels.placeholdersLabel}
            </Typography>
            {PLACEHOLDERS.map((p) => (
              <Chip key={p} size='small' label={`{${p}}`} />
            ))}
          </Stack>
          <Div sx={{ mt: 1, mb: 1 }}>
            <Controller
              name='body'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={dictionary.forms.sms.bulk.labels.messageTemplate}
                  placeholder={dictionary.forms.sms.bulk.placeholders.messageTemplate}
                  fullWidth
                  multiline
                  minRows={4}
                  size='small'
                  error={!!errors.body}
                  helperText={errors.body?.message || dictionary.forms.sms.bulk.helper.characters.replace('{length}', String(body.length))}
                />
              )}
            />
          </Div>
        </Grid>
        <Grid size={12}>
          <LoadingButton type='submit' variant='contained' size='small' loading={isPending}>
            {dictionary.forms.sms.bulk.buttons.send}
          </LoadingButton>
        </Grid>
        {lastResult && (
          <Grid size={12}>
            <Alert severity='info' sx={{ mb: 1 }}>
              {dictionary.forms.sms.bulk.alerts.result.replace('{message}', String(lastResult.message)).replace('{sent}', String(lastResult.results.length)).replace('{skipped}', String(lastResult.skipped.length))}
            </Alert>
            {lastResult.skipped.length > 0 && (
              <List dense>
                {lastResult.skipped.map((s, idx) => (
                  <ListItem key={idx}>
                    <ListItemText primary={s.name || s.to} secondary={s.reason} />
                  </ListItem>
                ))}
              </List>
            )}
          </Grid>
        )}
      </Grid>
    </Card>
  );
};

export default SmsBulkSendForm;
