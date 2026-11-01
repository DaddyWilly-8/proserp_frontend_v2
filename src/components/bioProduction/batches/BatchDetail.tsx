'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowBackOutlined, DeleteOutlined, EditOutlined } from '@mui/icons-material';
import { Box, Button, Card, IconButton, LinearProgress, Stack, Tab, Tabs, Tooltip, Typography } from '@mui/material';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import LedgerSelectProvider from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import ProductsSelectProvider from '@/components/productAndServices/products/ProductsSelectProvider';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { batchServices } from '../bio-production-services';
import BatchStatusChip from './BatchStatusChip';
import BatchSummary from './BatchSummary';
import { ExpensesTable, InputsTable, MortalityTable, MovementsTable, OutcomesTable, ProduceTable, StagesTable, WeightsTable } from './BatchTables';
import { Batch, BatchExpense, BatchHarvest, BatchInput, BatchMortality, BatchProduce } from './batchTypes';
import { usePagedBatchList } from './usePagedBatchList';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import BioGate from '../BioGate';
import { useBioAccess } from '../useBioAccess';
import AdvanceDialog from './dialogs/AdvanceDialog';
import CloseDialog from './dialogs/CloseDialog';
import EditDialog from './dialogs/EditDialog';
import ExpenseDialog from './dialogs/ExpenseDialog';
import HarvestDialog from './dialogs/HarvestDialog';
import ProduceDialog from './dialogs/ProduceDialog';
import InputDialog from './dialogs/InputDialog';
import MortalityDialog from './dialogs/MortalityDialog';
import TransferDialog from './dialogs/TransferDialog';
import WeightDialog from './dialogs/WeightDialog';
import WriteOffDialog from './dialogs/WriteOffDialog';

type DialogName = 'mortality' | 'weight' | 'input' | 'expense' | 'transfer' | 'advance' | 'writeOff' | 'harvest' | 'produce' | 'close' | 'edit';
type TabName = 'summary' | 'stages' | 'inputs' | 'costs' | 'mortality' | 'weights' | 'movements' | 'outcomes' | 'produce';

const BatchDetailContent = () => {
  const bio = useDictionary().bioProduction;
  const access = useBioAccess().batches;
  const text = bio.batches;
  const { lang, id } = useParams<{ lang: string; id: string }>();
  const batchId = Number(id);
  const [dialog, setDialog] = useState<DialogName | null>(null);
  const [tab, setTab] = useState<TabName>('summary');
  const [editingHarvest, setEditingHarvest] = useState<BatchHarvest | null>(null);
  const [editingProduce, setEditingProduce] = useState<BatchProduce | null>(null);
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: batch, isLoading, isError } = useQuery<Batch>({
    queryKey: ['bioBatch', batchId],
    queryFn: () => batchServices.get(batchId),
  });
  const [inputsType, setInputsType] = useState<string | number>('');
  const inputs = usePagedBatchList<BatchInput>(batchId, 'bioBatchInputs', batchServices.getInputs, { type: inputsType || undefined });
  const expenses = usePagedBatchList<BatchExpense>(batchId, 'bioBatchExpenses', batchServices.getExpenses);
  const mortalities = usePagedBatchList<BatchMortality>(batchId, 'bioBatchMortalities', batchServices.getMortalities);
  const produce = usePagedBatchList<BatchProduce>(batchId, 'bioBatchProduce', batchServices.getProduce);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['bioBatch', batchId] });
    queryClient.invalidateQueries({ queryKey: ['bioBatchInputs', batchId] });
    queryClient.invalidateQueries({ queryKey: ['bioBatchExpenses', batchId] });
    queryClient.invalidateQueries({ queryKey: ['bioBatchMortalities', batchId] });
    queryClient.invalidateQueries({ queryKey: ['bioBatchProduce', batchId] });
    queryClient.invalidateQueries({ queryKey: ['bioBatchSummary', batchId] });
    queryClient.invalidateQueries({ queryKey: ['bioWriteOffPreview', batchId] });
    queryClient.invalidateQueries({ queryKey: ['bioBatches'] });
  };
  const onRemoved = (data: { message: string }) => {
    refresh();
    enqueueSnackbar(data.message, { variant: 'success' });
  };
  const onRemoveError = (error: unknown) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' });

  const { mutate: removeInput } = useMutation({ mutationFn: batchServices.deleteInput, onSuccess: onRemoved, onError: onRemoveError });
  const { mutate: removeHarvest } = useMutation({ mutationFn: batchServices.deleteHarvest, onSuccess: onRemoved, onError: onRemoveError });
  const { mutate: removeProduce } = useMutation({ mutationFn: batchServices.deleteProduce, onSuccess: onRemoved, onError: onRemoveError });
  const { mutate: removeExpense } = useMutation({ mutationFn: batchServices.deleteExpense, onSuccess: onRemoved, onError: onRemoveError });

  const { mutate: removeBatch } = useMutation({
    mutationFn: batchServices.delete,
    onSuccess: (data: { message: string }) => {
      queryClient.invalidateQueries({ queryKey: ['bioBatches'] });
      enqueueSnackbar(data.message, { variant: 'success' });
      router.push(`/${lang}/bioProduction/batches`);
    },
    onError: onRemoveError,
  });

  const confirm = (content: string, onYes: () => void) =>
    showDialog({ title: bio.common.confirmDeleteTitle, content, onYes: () => { hideDialog(); onYes(); }, onNo: () => hideDialog(), variant: 'confirm' });

  if (isLoading) return <LinearProgress />;
  if (isError || !batch) return <Typography p={2}>{text.noBatch}</Typography>;

  const open = batch.status === 'on progress';
  const costs = batch.costs;
  const close = () => setDialog(null);
  const hasProduce = (batch.stages ?? []).some((stage) => stage.purpose === 'bearer') || produce.total > 0;

  type TabAction = { name: DialogName; label: string; variant?: 'contained' | 'outlined'; color?: 'error' | 'primary' };
  const act = (name: DialogName, label: string, variant?: TabAction['variant'], color?: TabAction['color']): TabAction => ({ name, label, variant, color });
  // Each action sits on the tab it belongs to, as on a project's profile; a closed batch has none.
  const tabActions: Partial<Record<TabName, TabAction[]>> = open
    ? {
        stages: access.manage ? [act('advance', text.actions.advance, 'contained')] : [],
        inputs: access.record ? [act('input', text.actions.input, 'contained')] : [],
        costs: access.record ? [act('expense', text.actions.expense, 'contained')] : [],
        mortality: access.record ? [act('mortality', text.actions.mortality, 'contained')] : [],
        weights: access.record ? [act('weight', text.actions.weight, 'contained')] : [],
        movements: access.manage ? [act('transfer', text.actions.transfer, 'contained')] : [],
        outcomes: [
          ...(access.writeOff ? [act('writeOff', text.actions.writeOff)] : []),
          ...(access.harvest ? [act('harvest', text.actions.harvest, 'contained')] : []),
          ...(access.manage ? [act('close', text.actions.close, 'outlined', 'error')] : []),
        ],
        produce: batch.current_stage?.purpose === 'bearer' && access.harvest ? [act('produce', text.actions.produce, 'contained')] : [],
      }
    : {};
  const toolbar = tabActions[tab] ?? [];

  return (
    <React.Fragment>
      <Stack direction='row' alignItems='center' spacing={1} mb={2} flexWrap='wrap'>
        <Tooltip title={text.backToList}>
          <IconButton component={Link} href={`/${lang}/bioProduction/batches`} size='small'><ArrowBackOutlined /></IconButton>
        </Tooltip>
        <Typography variant='h4' mb={0}>{batch.batchNo}</Typography>
        <BatchStatusChip status={batch.status} />
        <Typography color='text.secondary' sx={{ flexGrow: 1 }}>
          {batch.species_template?.name} · {batch.farm?.name} · {batch.production_unit?.name}
          {batch.farm?.cost_center?.name ? ` · ${text.labels.costCenter}: ${batch.farm.cost_center.name}` : ''}
        </Typography>
        {open && access.manage && (
          <Button size='small' variant='outlined' startIcon={<EditOutlined />} onClick={() => setDialog('edit')}>{text.actions.edit}</Button>
        )}
        {open && access.delete && (
          <Button size='small' variant='outlined' color='error' startIcon={<DeleteOutlined />} onClick={() => confirm(text.dialogs.confirmDeleteBatch, () => removeBatch(batchId))}>{text.actions.delete}</Button>
        )}
      </Stack>

      <Card>
        <Tabs value={tab} onChange={(_, value) => setTab(value)} variant='scrollable' scrollButtons='auto'>
          {(Object.keys(text.tabs) as TabName[]).filter((name) => name !== 'produce' || hasProduce).map((name) => (
            <Tab key={name} value={name} label={text.tabs[name]} />
          ))}
        </Tabs>
        {toolbar.length > 0 && (
          <Stack direction='row' spacing={1} useFlexGap flexWrap='wrap' justifyContent='flex-end' sx={{ px: 2, pt: 1.5 }}>
            {toolbar.map((action) => (
              <Button key={action.name} size='small' variant={action.variant ?? 'outlined'} color={action.color ?? 'primary'} onClick={() => setDialog(action.name)}>
                {action.label}
              </Button>
            ))}
          </Stack>
        )}
        <Box>
          {tab === 'summary' && <BatchSummary batch={batch} />}
          {tab === 'stages' && <StagesTable batch={batch} />}
          {tab === 'inputs' && (
            <InputsTable
              inputs={inputs.rows}
              canEdit={open && access.record}
              onRemove={(input) => confirm(text.dialogs.confirmDeleteInput, () => removeInput({ id: batchId, eventId: input.id }))}
              type={inputsType}
              onTypeChange={(type) => { setInputsType(type); inputs.setPage(0); }}
              page={inputs.page}
              limit={inputs.limit}
              total={inputs.total}
              totalCost={inputs.response?.total_cost ?? 0}
              onPageChange={inputs.setPage}
              onLimitChange={inputs.setLimit}
            />
          )}
          {tab === 'costs' && (
            <ExpensesTable
              rows={expenses.rows}
              canEdit={open && access.record}
              onRemove={(expenseId) => confirm(text.dialogs.confirmDeleteExpense, () => removeExpense({ id: batchId, expenseId }))}
              page={expenses.page}
              limit={expenses.limit}
              total={expenses.total}
              totalAmount={expenses.response?.total_amount ?? 0}
              onPageChange={expenses.setPage}
              onLimitChange={expenses.setLimit}
            />
          )}
          {tab === 'mortality' && (
            <MortalityTable
              batch={batch}
              rows={mortalities.rows}
              page={mortalities.page}
              limit={mortalities.limit}
              total={mortalities.total}
              totalQuantity={mortalities.response?.total_quantity ?? 0}
              onPageChange={mortalities.setPage}
              onLimitChange={mortalities.setLimit}
            />
          )}
          {tab === 'weights' && <WeightsTable batch={batch} />}
          {tab === 'movements' && <MovementsTable batch={batch} />}
          {tab === 'outcomes' && (
            <OutcomesTable
              batch={batch}
              canChange={access.harvest}
              onEditHarvest={setEditingHarvest}
              onDeleteHarvest={(harvest) => confirm(text.dialogs.confirmDeleteHarvest, () => removeHarvest({ id: batchId, harvestId: harvest.id }))}
            />
          )}
          {tab === 'produce' && (
            <ProduceTable
              rows={produce.rows}
              page={produce.page}
              limit={produce.limit}
              total={produce.total}
              totalCost={produce.response?.total_cost ?? 0}
              latestId={open && access.harvest && produce.page === 0 ? produce.rows[0]?.id : undefined}
              onEdit={setEditingProduce}
              onDelete={(row) => confirm(text.dialogs.confirmDeleteProduce, () => removeProduce({ id: batchId, collectionId: row.id }))}
              onPageChange={produce.setPage}
              onLimitChange={produce.setLimit}
            />
          )}
        </Box>
      </Card>

      {editingHarvest && (
        <HarvestDialog key={editingHarvest.id} batch={batch} open record={editingHarvest} onClose={() => setEditingHarvest(null)} />
      )}
      {editingProduce && (
        <ProduceDialog key={editingProduce.id} batch={batch} open record={editingProduce} onClose={() => setEditingProduce(null)} />
      )}

      {open && (
        <>
          <EditDialog batch={batch} open={dialog === 'edit'} onClose={close} />
          <MortalityDialog batch={batch} open={dialog === 'mortality'} onClose={close} />
          <WeightDialog batch={batch} open={dialog === 'weight'} onClose={close} />
          <InputDialog batch={batch} open={dialog === 'input'} onClose={close} />
          <ExpenseDialog batch={batch} open={dialog === 'expense'} onClose={close} />
          <TransferDialog batch={batch} open={dialog === 'transfer'} onClose={close} />
          <AdvanceDialog batch={batch} open={dialog === 'advance'} onClose={close} />
          <WriteOffDialog batch={batch} open={dialog === 'writeOff'} onClose={close} />
          <ProduceDialog batch={batch} open={dialog === 'produce'} onClose={close} />
          <HarvestDialog batch={batch} open={dialog === 'harvest'} onClose={close} />
          <CloseDialog batch={batch} open={dialog === 'close'} onClose={close} />
        </>
      )}
    </React.Fragment>
  );
};

const BatchDetail = () => (
  <BioGate anyOf={[PERMISSIONS.BIO_BATCHES_READ]}>
    <ProductsSelectProvider>
      <LedgerSelectProvider>
        <BatchDetailContent />
      </LedgerSelectProvider>
    </ProductsSelectProvider>
  </BioGate>
);

export default BatchDetail;
