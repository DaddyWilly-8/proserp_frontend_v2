'use client'

import React from 'react';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import BioGate from '../BioGate';
import BioMasterList from '../BioMasterList';
import { BIO_MASTERS, useBioAccess } from '../useBioAccess';
import { measurementParameterServices } from '../bio-production-services';
import { BioMeasurementParameter } from '../types';
import ParameterForm from './ParameterForm';
import ParameterListItem from './ParameterListItem';

const MeasurementParametersContent = () => {
  const access = useBioAccess().master('measurementParameters');
  const text = useDictionary().bioProduction.measurementParameters;
  const renderItem = React.useCallback((parameter: BioMeasurementParameter) => <ParameterListItem parameter={parameter} />, []);

  return (
    <BioMasterList<BioMeasurementParameter>
      title={text.pageTitle}
      newLabel={text.new}
      searchPlaceholder={text.searchPlaceholder}
      queryKey='bioMeasurementParameters'
      service={measurementParameterServices.getList}
      renderItem={renderItem}
      canCreate={access.create}
      Form={ParameterForm}
    />
  );
};

const MeasurementParameters = () => (
  <BioGate anyOf={BIO_MASTERS.measurementParameters}>
    <MeasurementParametersContent />
  </BioGate>
);

export default MeasurementParameters;
