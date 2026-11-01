'use client'

import React from 'react';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import BioGate from '../BioGate';
import BioMasterList from '../BioMasterList';
import { BIO_MASTERS, useBioAccess } from '../useBioAccess';
import { farmServices } from '../bio-production-services';
import { BioFarm } from '../types';
import FarmForm from './FarmForm';
import FarmListItem from './FarmListItem';

const FarmsContent = () => {
  const access = useBioAccess().master('farms');
  const dictionary = useDictionary();
  const text = dictionary.bioProduction.farms;

  const renderItem = React.useCallback((farm: BioFarm) => <FarmListItem farm={farm} />, []);

  return (
    <BioMasterList<BioFarm>
      title={text.pageTitle}
      newLabel={text.new}
      searchPlaceholder={text.searchPlaceholder}
      queryKey='bioFarms'
      service={farmServices.getList}
      renderItem={renderItem}
      canCreate={access.create}
      Form={FarmForm}
    />
  );
};

const Farms = () => (
  <BioGate anyOf={BIO_MASTERS.farms}>
    <FarmsContent />
  </BioGate>
);

export default Farms;
