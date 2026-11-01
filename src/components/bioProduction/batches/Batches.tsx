'use client'

import React, { useState } from 'react';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import BioGate from '../BioGate';
import BioMasterList from '../BioMasterList';
import { useBioAccess } from '../useBioAccess';
import BioSelect from '../BioSelect';
import FarmFirstPage, { useBioFarm } from '../FarmFirstPage';
import { batchServices } from '../bio-production-services';
import { Batch } from './batchTypes';
import BatchForm from './BatchForm';
import BatchListItem from './BatchListItem';

const BatchesList = () => {
  const text = useDictionary().bioProduction.batches;
  const { farm } = useBioFarm();
  const access = useBioAccess().batches;
  const [status, setStatus] = useState<string | number>('');

  const renderItem = React.useCallback((batch: Batch) => <BatchListItem batch={batch} />, []);

  return (
    <BioMasterList<Batch>
      newLabel={text.new}
      searchPlaceholder={text.searchPlaceholder}
      queryKey='bioBatches'
      service={batchServices.getList}
      renderItem={renderItem}
      Form={BatchForm}
      canCreate={access.create}
      filters={{ farm_id: farm.id, status: status || undefined }}
      filterControls={[
        <BioSelect
          key='status'
          label={text.tables.status}
          options={[{ value: 'on progress', label: text.status['on progress'] }, { value: 'closed', label: text.status.closed }]}
          value={status}
          onChange={setStatus}
        />,
      ]}
    />
  );
};

const Batches = () => {
  const text = useDictionary().bioProduction.batches;

  return (
    <BioGate anyOf={[PERMISSIONS.BIO_BATCHES_READ]}>
      <FarmFirstPage title={text.pageTitle}>
        <BatchesList />
      </FarmFirstPage>
    </BioGate>
  );
};

export default Batches;
