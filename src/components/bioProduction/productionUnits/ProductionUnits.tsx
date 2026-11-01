'use client'

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import BioGate from '../BioGate';
import BioMasterList from '../BioMasterList';
import { BIO_MASTERS, useBioAccess } from '../useBioAccess';
import BioSelect from '../BioSelect';
import { farmServices, productionUnitServices } from '../bio-production-services';
import { BioFarm, BioProductionUnit } from '../types';
import ProductionUnitForm from './ProductionUnitForm';
import ProductionUnitListItem from './ProductionUnitListItem';

const ProductionUnitsContent = () => {
  const access = useBioAccess().master('productionUnits');
  const text = useDictionary().bioProduction.productionUnits;
  const [farmId, setFarmId] = useState<string | number>('');
  const [type, setType] = useState<string | number>('');

  const { data: farms, isLoading } = useQuery<{ data: BioFarm[] }>({
    queryKey: ['bioFarmOptions'],
    queryFn: () => farmServices.getList({ limit: 500 }),
  });

  const renderItem = React.useCallback((unit: BioProductionUnit) => <ProductionUnitListItem unit={unit} />, []);

  return (
    <BioMasterList<BioProductionUnit>
      title={text.pageTitle}
      newLabel={text.new}
      searchPlaceholder={text.searchPlaceholder}
      queryKey='bioProductionUnits'
      service={productionUnitServices.getList}
      renderItem={renderItem}
      canCreate={access.create}
      Form={ProductionUnitForm}
      filters={{ farm_id: farmId || undefined, type: type || undefined }}
      filterControls={[
        <BioSelect
          key='farm'
          label={text.labels.farm}
          loading={isLoading}
          options={(farms?.data ?? []).map((farm) => ({ value: farm.id, label: farm.name }))}
          value={farmId}
          onChange={setFarmId}
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
  );
};

const ProductionUnits = () => (
  <BioGate anyOf={BIO_MASTERS.productionUnits}>
    <ProductionUnitsContent />
  </BioGate>
);

export default ProductionUnits;
