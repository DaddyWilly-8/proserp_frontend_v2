'use client'

import React from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { LoadingButton } from '@mui/lab';
import { Alert, Box, Button, DialogActions, DialogContent, DialogTitle, FormControlLabel, Grid, Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { Controller, useForm, useWatch } from 'react-hook-form';
import * as yup from 'yup';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { MODULES } from '@/utilities/constants/modules';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import BioSelect from '../BioSelect';
import InfoHint from '../InfoHint';
import NumberField from '../NumberField';
import { farmServices, sharedCostServices } from '../bio-production-services';
import { FormDate } from '../batches/dialogs/ActionDialog';
import { BIO_WIP_LEDGER_ID } from '../batches/batchConstants';
import { nowStamp } from '../dateTime';
import { unitGroupOptions, useUnitGroups } from '../useUnitGroups';
import { BioFarm, BioFormProps, BioSharedCost } from '../types';
import PayLedgerFields, { PayFrom } from './PayLedgerFields';

const BASES = ['equal', 'animals', 'biomass', 'feed'] as const;
const money = (value: number) => Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Preview { rows: { batch_id: number; batch_no: string; unit: string; group: string; animals: number; percent: number; amount: number }[]; total: number }

/** One cost (boat fuel, say) entered once and spread over the open batches of a farm or group. */
const SharedCostForm = ({ setOpenDialog }: BioFormProps<BioSharedCost>) => {
  const dictionary = useDictionary();
  const text = dictionary.bioProduction.sharedCosts;
  const common = dictionary.bioProduction.common;
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [preview, setPreview] = React.useState<Preview | null>(null);
  const [previewError, setPreviewError] = React.useState('');
  const { checkOrganizationPermission, organizationHasSubscribed } = useJumboAuth();
  // Paying as the cost is made is posting a payment, so it is offered only to people who may post one.
  const canPay = organizationHasSubscribed(MODULES.ACCOUNTS_AND_FINANCE) && checkOrganizationPermission([PERMISSIONS.ACCOUNTS_TRANSACTIONS_CREATE, PERMISSIONS.PAYMENTS_CREATE]);
  const [payNow, setPayNow] = React.useState(false);
  const [payFrom, setPayFrom] = React.useState<PayFrom | null>(null);
  const [paymentReference, setPaymentReference] = React.useState('');

  const { data: farms, isLoading: loadingFarms } = useQuery<{ data: BioFarm[] }>({ queryKey: ['bioFarmOptions'], queryFn: () => farmServices.getList({ limit: 500 }) });

  const schema = yup.object({
    farm_id: yup.number().typeError(text.validation.farmRequired).required(text.validation.farmRequired),
    unit_group_id: yup.number().nullable().transform((value, original) => (original === '' || original == null ? null : value)),
    expense_date: yup.string().required(text.validation.dateRequired),
    ledger_id: yup.number().typeError(text.validation.ledgerRequired).required(text.validation.ledgerRequired),
    amount: yup.number().typeError(text.validation.amountInvalid).moreThan(0, text.validation.amountInvalid).required(text.validation.amountInvalid),
    basis: yup.string().oneOf([...BASES]).required(),
    feed_days: yup.number().nullable().transform((value, original) => (original === '' || original == null ? null : value)),
    remarks: yup.string().nullable(),
  });
  const { register, handleSubmit, control, setValue, getValues, trigger, formState: { errors } } = useForm<any>({
    resolver: yupResolver(schema) as any,
    defaultValues: { farm_id: '', unit_group_id: '', expense_date: nowStamp(), ledger_id: null, amount: undefined, basis: 'equal', feed_days: 30, remarks: '' },
  });
  const [farmId, basis] = useWatch({ control, name: ['farm_id', 'basis'] });
  const { data: groups, isLoading: loadingGroups } = useUnitGroups(farmId || null, 'active');

  const payload = () => {
    const values = getValues();

    return {
      ...values, unit_group_id: values.unit_group_id || null, feed_days: values.basis === 'feed' ? values.feed_days || 30 : null,
      ...(payNow ? { pay_now: true, pay_from_ledger_id: payFrom?.id, payment_reference: paymentReference.trim() || undefined } : {}),
    };
  };

  const { mutate: showPreview, isPending: previewing } = useMutation({
    mutationFn: () => sharedCostServices.preview(payload()),
    onSuccess: (data: Preview) => { setPreview(data); setPreviewError(''); },
    onError: (error) => { setPreview(null); setPreviewError(getErrorMessage(error)); },
  });
  const { mutate: save, isPending } = useMutation({
    mutationFn: () => sharedCostServices.add(payload()),
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar(data.paymentNo ? `${data.message} · ${data.paymentNo}` : data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['bioSharedCosts'] });
      queryClient.invalidateQueries({ queryKey: ['bioBatch'] });
      queryClient.invalidateQueries({ queryKey: ['bioBatchExpenses'] });
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const stale = () => setPreview(null);

  return (
    <>
      <DialogTitle textAlign='center'>{text.newTitle}</DialogTitle>
      <DialogContent sx={{ pt: '10px !important' }}>
        <form autoComplete='off' onChange={stale} onSubmit={handleSubmit(() => save())}>
          <Grid container spacing={2} mt={0}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller name='farm_id' control={control} render={({ field }) => (
                <BioSelect required label={text.labels.farm} loading={loadingFarms} options={(farms?.data ?? []).map((farm) => ({ value: farm.id, label: farm.name }))} value={field.value}
                  onChange={(value) => { field.onChange(value); setValue('unit_group_id', ''); stale(); }} error={!!errors.farm_id} helperText={errors.farm_id?.message as string} />
              )} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack direction='row' alignItems='center'>
                <Controller name='unit_group_id' control={control} render={({ field }) => (
                  <BioSelect disabled={!farmId} loading={loadingGroups} label={text.labels.group} options={unitGroupOptions(groups?.data)} value={field.value} onChange={(value) => { field.onChange(value); stale(); }} />
                )} />
                <InfoHint text={text.help.group} />
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormDate control={control} name='expense_date' label={text.labels.date} />
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <LedgerSelect label={text.labels.ledger} allowedGroups={['Expenses']} notAllowedLedgers={[BIO_WIP_LEDGER_ID]} frontError={errors.ledger_id as any} onChange={(ledger: any) => { setValue('ledger_id', ledger?.id ?? null, { shouldValidate: true }); stale(); }} />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Controller name='amount' control={control} render={({ field }) => (
                <NumberField label={text.labels.amount} error={!!errors.amount} helperText={errors.amount?.message as string} value={field.value} onChange={(plain) => { field.onChange(plain); stale(); }} />
              )} />
            </Grid>
            <Grid size={{ xs: 12, md: basis === 'feed' ? 6 : 12 }}>
              <Stack direction='row' alignItems='center'>
                <Controller name='basis' control={control} render={({ field }) => (
                  <BioSelect required label={text.labels.basis} options={BASES.map((value) => ({ value, label: text.basis[value] }))} value={field.value} onChange={(value) => { field.onChange(value); stale(); }} />
                )} />
                <InfoHint text={text.help.basis} />
              </Stack>
            </Grid>
            {basis === 'feed' && (
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField type='number' size='small' fullWidth label={text.labels.feedDays} slotProps={{ htmlInput: { min: 1, max: 365, step: 1 }, input: { endAdornment: <InfoHint text={text.help.feedDays} /> } }} {...register('feed_days')} />
              </Grid>
            )}
            <Grid size={12}>
              <TextField size='small' fullWidth label={text.labels.remarks} placeholder={text.placeholders.remarks} {...register('remarks')} />
            </Grid>
            {canPay && (
              <>
                <Grid size={12}>
                  <Stack direction='row' alignItems='center' spacing={0.5}>
                    <FormControlLabel control={<Switch checked={payNow} onChange={(event) => setPayNow(event.target.checked)} />} label={text.labels.payNow} />
                    <InfoHint text={text.help.payNow} />
                  </Stack>
                </Grid>
                {payNow && <PayLedgerFields payFrom={payFrom} onPayFrom={setPayFrom} reference={paymentReference} onReference={setPaymentReference} />}
              </>
            )}
          </Grid>

          {previewError && <Alert severity='warning' sx={{ mt: 2 }}>{previewError}</Alert>}
          {preview && (
            <Box sx={{ mt: 2 }}>
              <Typography variant='subtitle2' sx={{ mb: 0.5 }}>{text.preview.title.replace('{count}', String(preview.rows.length))}</Typography>
              <Box sx={{ overflowX: 'auto', maxHeight: 260 }}>
                <Table size='small' stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>{text.preview.batch}</TableCell><TableCell>{text.preview.unit}</TableCell>
                      <TableCell align='right'>{text.preview.animals}</TableCell><TableCell align='right'>{text.preview.share}</TableCell><TableCell align='right'>{text.preview.amount}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {preview.rows.map((row) => (
                      <TableRow key={row.batch_id}>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.batch_no}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.group ? `${row.group} › ${row.unit}` : row.unit}</TableCell>
                        <TableCell align='right'>{row.animals.toLocaleString()}</TableCell>
                        <TableCell align='right'>{row.percent.toFixed(2)}%</TableCell>
                        <TableCell align='right'>{money(row.amount)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ '& td': { fontWeight: 700 } }}>
                      <TableCell colSpan={4}>{text.preview.total}</TableCell><TableCell align='right'>{money(preview.total)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            </Box>
          )}

          <DialogActions sx={{ flexWrap: 'wrap', gap: 0.5 }}>
            <Button size='small' onClick={() => setOpenDialog(false)}>{common.cancel}</Button>
            <LoadingButton size='small' variant='outlined' loading={previewing} onClick={async () => { if (await trigger()) showPreview(); }}>{text.buttons.preview}</LoadingButton>
            <LoadingButton type='submit' variant='contained' size='small' loading={isPending} disabled={payNow && !payFrom}>{text.buttons.spread}</LoadingButton>
          </DialogActions>
        </form>
      </DialogContent>
    </>
  );
};

export default SharedCostForm;
