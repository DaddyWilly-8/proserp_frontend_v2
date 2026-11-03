'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BarChartOutlined } from '@mui/icons-material';
import { Button, Stack } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import BioGate from '../BioGate';
import BioMasterList from '../BioMasterList';
import BioSelect from '../BioSelect';
import { BIO_MASTERS, useBioAccess } from '../useBioAccess';
import { farmServices, unitGroupServices } from '../bio-production-services';
import { BioFarm, BioUnitGroup } from '../types';
import UnitGroupForm from './UnitGroupForm';
import UnitGroupListItem from './UnitGroupListItem';

const UnitGroupsContent = () => {
  const access = useBioAccess().master('unitGroups');
  const text = useDictionary().bioProduction.unitGroups;
  const [farmId, setFarmId] = useState<string | number>('');

  const { data: farms, isLoading } = useQuery<{ data: BioFarm[] }>({
    queryKey: ['bioFarmOptions'],
    queryFn: () => farmServices.getList({ limit: 500 }),
  });

  const renderItem = React.useCallback((group: BioUnitGroup) => <UnitGroupListItem group={group} />, []);

  return (
    <BioMasterList<BioUnitGroup>
      title={text.pageTitle}
      newLabel={text.new}
      searchPlaceholder={text.searchPlaceholder}
      queryKey='bioUnitGroups'
      service={unitGroupServices.getList}
      renderItem={renderItem}
      canCreate={access.create}
      Form={UnitGroupForm}
      filters={{ farm_id: farmId || undefined }}
      filterControls={[
        <BioSelect
          key='farm'
          label={text.labels.farm}
          loading={isLoading}
          options={(farms?.data ?? []).map((farm) => ({ value: farm.id, label: farm.name }))}
          value={farmId}
          onChange={setFarmId}
        />,
      ]}
    />
  );
};

const UnitGroupsPage = () => {
  const text = useDictionary().bioProduction.unitGroups;
  const canReport = useBioAccess().reports;
  const { lang } = useParams<{ lang: string }>();

  return (
    <>
      {canReport && (
        <Stack direction='row' justifyContent='flex-end' sx={{ mb: 1 }}>
          <Button size='small' variant='outlined' startIcon={<BarChartOutlined />} component={Link} href={`/${lang}/bioProduction/reports?report=group-cost`}>{text.costReport}</Button>
        </Stack>
      )}
      <UnitGroupsContent />
    </>
  );
};

const UnitGroups = () => (
  <BioGate anyOf={BIO_MASTERS.unitGroups}>
    <UnitGroupsPage />
  </BioGate>
);

export default UnitGroups;
