'use client'

import React, { useState } from 'react';
import { PlaylistAddOutlined } from '@mui/icons-material';
import { Alert, Button, Dialog, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import BioGate from '../BioGate';
import BioMasterList from '../BioMasterList';
import { BIO_MASTERS, useBioAccess } from '../useBioAccess';
import BioSelect from '../BioSelect';
import { farmServices, productionUnitServices, unitGroupServices } from '../bio-production-services';
import { unitGroupOptions } from '../useUnitGroups';
import { BioFarm, BioProductionUnit, BioUnitGroup } from '../types';
import BulkUnitsForm from './BulkUnitsForm';
import ProductionUnitForm from './ProductionUnitForm';
import ProductionUnitListItem from './ProductionUnitListItem';

const ProductionUnitsContent = () => {
  const access = useBioAccess().master('productionUnits');
  const text = useDictionary().bioProduction.productionUnits;
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [bulkOpen, setBulkOpen] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [moveTo, setMoveTo] = useState<string | number>('');
  const [farmId, setFarmId] = useState<string | number>('');
  const [type, setType] = useState<string | number>('');
  const [groupId, setGroupId] = useState<string | number>('');

  const { data: farms, isLoading } = useQuery<{ data: BioFarm[] }>({
    queryKey: ['bioFarmOptions'],
    queryFn: () => farmServices.getList({ limit: 500 }),
  });

  const { data: groups } = useQuery<{ data: BioUnitGroup[] }>({
    queryKey: ['bioUnitGroupOptions', farmId || null, undefined],
    queryFn: () => unitGroupServices.getList({ farm_id: farmId || undefined, limit: 1000 }),
  });

  const toggle = React.useCallback((id: number) => setSelected((ids) => (ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id])), []);
  const renderItem = React.useCallback(
    (unit: BioProductionUnit) => <ProductionUnitListItem unit={unit} selected={selected.includes(unit.id)} onToggle={access.edit ? () => toggle(unit.id) : undefined} />,
    [selected, access.edit, toggle]
  );

  const { mutate: move, isPending: moving } = useMutation({
    mutationFn: (groupId: number | null) => productionUnitServices.moveToGroup({ unit_ids: selected, unit_group_id: groupId }),
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      setSelected([]);
      setMoveTo('');
      queryClient.invalidateQueries({ queryKey: ['bioProductionUnits'] });
      queryClient.invalidateQueries({ queryKey: ['bioUnitGroups'] });
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  return (
    <>
    <Dialog maxWidth='md' fullWidth open={bulkOpen}>
      {bulkOpen && <BulkUnitsForm setOpenDialog={setBulkOpen} />}
    </Dialog>
    {selected.length > 0 && access.edit && (
      <Alert severity='info' icon={false} sx={{ mb: 1.5 }} action={<Button size='small' onClick={() => setSelected([])}>{text.move.clear}</Button>}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
          <Typography variant='body2'>{text.move.selected.replace('{count}', String(selected.length))}</Typography>
          <Stack sx={{ minWidth: 260 }}>
            <BioSelect label={text.move.toGroup} options={unitGroupOptions(groups?.data)} value={moveTo} onChange={setMoveTo} />
          </Stack>
          <Button size='small' variant='contained' disabled={!moveTo || moving} onClick={() => move(Number(moveTo))}>{text.move.apply}</Button>
          <Button size='small' variant='outlined' disabled={moving} onClick={() => move(null)}>{text.move.remove}</Button>
        </Stack>
      </Alert>
    )}
    <BioMasterList<BioProductionUnit>
      title={text.pageTitle}
      newLabel={text.new}
      searchPlaceholder={text.searchPlaceholder}
      queryKey='bioProductionUnits'
      service={productionUnitServices.getList}
      renderItem={renderItem}
      canCreate={access.create}
      extraActions={access.create ? (
        <Tooltip title={text.bulk.open}>
          <IconButton size='small' onClick={() => setBulkOpen(true)}><PlaylistAddOutlined /></IconButton>
        </Tooltip>
      ) : undefined}
      Form={ProductionUnitForm}
      filters={{ farm_id: farmId || undefined, group_id: groupId || undefined, type: type || undefined }}
      filterControls={[
        <BioSelect
          key='farm'
          label={text.labels.farm}
          loading={isLoading}
          options={(farms?.data ?? []).map((farm) => ({ value: farm.id, label: farm.name }))}
          value={farmId}
          onChange={(value) => { setFarmId(value); setGroupId(''); }}
        />,
        <BioSelect
          key='group'
          label={text.labels.group}
          options={unitGroupOptions(groups?.data)}
          value={groupId}
          onChange={setGroupId}
        />,
        <BioSelect
          key='type'
          label={text.labels.type}
          options={(['pond', 'cage', 'tank', 'house', 'pen'] as const).map((unitType) => ({ value: unitType, label: text.types[unitType] }))}
          value={type}
          onChange={setType}
        />,
      ]}
    />
    </>
  );
};

const ProductionUnits = () => (
  <BioGate anyOf={BIO_MASTERS.productionUnits}>
    <ProductionUnitsContent />
  </BioGate>
);

export default ProductionUnits;
