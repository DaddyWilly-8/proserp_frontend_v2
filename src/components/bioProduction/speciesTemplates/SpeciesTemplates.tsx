'use client'

import React from 'react';
import ProductsSelectProvider from '@/components/productAndServices/products/ProductsSelectProvider';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import BioGate from '../BioGate';
import BioMasterList from '../BioMasterList';
import { BIO_MASTERS, useBioAccess } from '../useBioAccess';
import { speciesTemplateServices } from '../bio-production-services';
import { BioSpeciesTemplate } from '../types';
import SpeciesTemplateForm from './SpeciesTemplateForm';
import SpeciesTemplateListItem from './SpeciesTemplateListItem';

const SpeciesTemplatesContent = () => {
  const access = useBioAccess().master('speciesTemplates');
  const text = useDictionary().bioProduction.speciesTemplates;

  const renderItem = React.useCallback((template: BioSpeciesTemplate) => <SpeciesTemplateListItem template={template} />, []);

  return (
    <ProductsSelectProvider>
    <BioMasterList<BioSpeciesTemplate>
      title={text.pageTitle}
      newLabel={text.new}
      searchPlaceholder={text.searchPlaceholder}
      queryKey='bioSpeciesTemplates'
      service={speciesTemplateServices.getList}
      renderItem={renderItem}
      canCreate={access.create}
      Form={SpeciesTemplateForm}
    />
    </ProductsSelectProvider>
  );
};

const SpeciesTemplates = () => (
  <BioGate anyOf={BIO_MASTERS.speciesTemplates}>
    <SpeciesTemplatesContent />
  </BioGate>
);

export default SpeciesTemplates;
