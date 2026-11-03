import React, { useState } from 'react';
import { DeleteOutlined, PaymentsOutlined, VisibilityOutlined } from '@mui/icons-material';
import { Box, Chip, Dialog, DialogContent, DialogTitle, Divider, Grid, IconButton, LinearProgress, Stack, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { sharedCostServices } from '../bio-production-services';
import PayDialog from './PayDialog';
import { stamp } from '../dateTime';
import { BioSharedCost } from '../types';

const money = (value: number) => Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const SharedCostListItem = ({ cost, canDelete, canPay }: { cost: BioSharedCost; canDelete: boolean; canPay: boolean }) => {
  const text = useDictionary().bioProduction.sharedCosts;
  const common = useDictionary().bioProduction.common;
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { showDialog, hideDialog } = useJumboDialog();
  const [showShares, setShowShares] = useState(false);
  const [paying, setPaying] = useState(false);

  const { data: detail, isLoading } = useQuery<{ shares: { batch_no: string; unit: string; group: string; amount: number }[] }>({
    queryKey: ['bioSharedCost', cost.id], queryFn: () => sharedCostServices.get(cost.id), enabled: showShares,
  });
  const { mutate: remove } = useMutation({
    mutationFn: sharedCostServices.delete,
    onSuccess: (data: { message: string }) => {
      queryClient.invalidateQueries({ queryKey: ['bioSharedCosts'] });
      enqueueSnackbar(data.message, { variant: 'success' });
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  return (
    <React.Fragment>
      <Divider />
      <Grid container mt={1} mb={1} px={2} columnSpacing={1} alignItems='center' sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
        <Grid size={{ xs: 6, md: 1.8 }}>
          <Tooltip title={text.labels.date}><Typography noWrap>{stamp(cost.expense_date)}</Typography></Tooltip>
        </Grid>
        <Grid size={{ xs: 6, md: 2.2 }}>
          <Tooltip title={text.labels.ledger}><Typography variant='h5' fontSize={14} lineHeight={1.25} mb={0} noWrap>{cost.ledger?.name}</Typography></Tooltip>
          {!!cost.remarks && <Typography variant='caption' color='text.secondary' display='block' noWrap>{cost.remarks}</Typography>}
        </Grid>
        <Grid size={{ xs: 12, md: 2.5 }}>
          <Tooltip title={`${text.labels.farm} / ${text.labels.group}`}><Typography noWrap>{cost.farm?.name} · {cost.unit_group?.path ?? text.wholeFarm}</Typography></Tooltip>
        </Grid>
        <Grid size={{ xs: 6, md: 1.6 }}>
          <Chip size='small' variant='outlined' label={text.basis[cost.basis]} />
          {cost.payment && (
            <Tooltip title={`${text.paidFrom.replace('{ledger}', cost.payment.credit_ledger?.name ?? '')}${cost.payment.reference ? ` · ${cost.payment.reference}` : ''}`}>
              <Chip size='small' color='success' variant='outlined' label={`${text.paid} · ${cost.payment.voucherNo}`} sx={{ ml: { md: 0.5 }, mt: { xs: 0.5, md: 0 } }} />
            </Tooltip>
          )}
        </Grid>
        <Grid size={{ xs: 6, md: 1.4 }} textAlign={{ md: 'end' }}>
          <Tooltip title={text.labels.amount}><Typography fontWeight={600}>{money(Number(cost.amount))}</Typography></Tooltip>
        </Grid>
        <Grid size={{ xs: 6, md: 1.2 }} textAlign={{ md: 'center' }}>
          <Typography color='text.secondary'>{text.batchesCount.replace('{count}', String(cost.expenses_count ?? 0))}</Typography>
        </Grid>
        <Grid size={{ xs: 6, md: 1.3 }} textAlign='end'>
          <Stack direction='row' justifyContent='flex-end'>
            {canPay && !cost.payment && (
              <Tooltip title={text.buttons.postPayment}><IconButton size='small' color='primary' onClick={() => setPaying(true)}><PaymentsOutlined fontSize='small' /></IconButton></Tooltip>
            )}
            <Tooltip title={text.viewShares}><IconButton size='small' onClick={() => setShowShares(true)}><VisibilityOutlined fontSize='small' /></IconButton></Tooltip>
            {canDelete && (
              <Tooltip title={common.delete}>
                <IconButton size='small' color='error' onClick={() => showDialog({ title: common.confirmDeleteTitle, content: text.messages.deleteContent, onYes: () => { hideDialog(); remove(cost.id); }, onNo: () => hideDialog(), variant: 'confirm' })}>
                  <DeleteOutlined fontSize='small' />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Grid>
      </Grid>
      {paying && <PayDialog cost={cost} open onClose={() => setPaying(false)} />}
      <Dialog open={showShares} onClose={() => setShowShares(false)} fullWidth maxWidth='sm'>
        <DialogTitle>{text.sharesTitle.replace('{ledger}', cost.ledger?.name ?? '')}</DialogTitle>
        <DialogContent>
          {isLoading && <LinearProgress />}
          {detail && (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size='small'>
                <TableHead><TableRow><TableCell>{text.preview.batch}</TableCell><TableCell>{text.preview.unit}</TableCell><TableCell align='right'>{text.preview.amount}</TableCell></TableRow></TableHead>
                <TableBody>
                  {detail.shares.map((share) => (
                    <TableRow key={share.batch_no}><TableCell>{share.batch_no}</TableCell><TableCell>{share.group ? `${share.group} › ${share.unit}` : share.unit}</TableCell><TableCell align='right'>{money(share.amount)}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </React.Fragment>
  );
};

export default SharedCostListItem;
