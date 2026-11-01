'use client'

import React, { useMemo, useState } from 'react';
import { DateTimePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import LedgerSelectProvider from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import ProductsSelectProvider from '@/components/productAndServices/products/ProductsSelectProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import BioGate from '../BioGate';
import BioMasterList from '../BioMasterList';
import { useBioAccess } from '../useBioAccess';
import FarmFirstPage, { useBioFarm } from '../FarmFirstPage';
import { roundServices } from '../bio-production-services';
import { BioFormProps } from '../types';
import MeasurementForm from './MeasurementForm';
import RoundForm from './RoundForm';
import RoundListItem from './RoundListItem';
import { RoundMode, RoundRecord } from './roundTypes';

/** The list of daily records of one kind for the chosen farm, with a button to record a new one: the same shape as the payments list. */
const RecordsList = ({ mode }: { mode: RoundMode }) => {
  const text = useDictionary().bioProduction.rounds;
  const { farm } = useBioFarm();
  const canCreate = useBioAccess().records.kind(mode).create;
  // The list can be limited to a stretch of time, to the minute.
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const timeFilter = (label: string, value: string, set: (value: string) => void) => (
    <DateTimePicker
      key={label}
      label={label}
      ampm={false}
      value={value ? dayjs(value) : null}
      onChange={(next) => set(next?.isValid() ? next.format('YYYY-MM-DD HH:mm:ss') : '')}
      slotProps={{ textField: { size: 'small', fullWidth: true }, field: { clearable: true } }}
    />
  );

  const service = React.useCallback((params: Record<string, unknown>) => roundServices.getList({ ...params, kind: mode }), [mode]);
  const renderItem = React.useCallback((record: RoundRecord) => <RoundListItem record={record} queryKey={`bioDailyRecords-${mode}`} />, [mode]);
  const Form = useMemo(() => {
    const ModeForm = (props: BioFormProps<RoundRecord>) => (mode === 'measurement' ? <MeasurementForm {...props} /> : <RoundForm mode={mode} {...props} />);

    return ModeForm;
  }, [mode]);

  return (
    <ProductsSelectProvider>
      <LedgerSelectProvider>
      <BioMasterList<RoundRecord>
        newLabel={text.new[mode]}
        searchPlaceholder={text.searchPlaceholder}
        queryKey={`bioDailyRecords-${mode}`}
        service={service}
        renderItem={renderItem}
        Form={Form}
        canCreate={canCreate}
        filters={{ farm_id: farm.id, from: from || undefined, to: to || undefined }}
        filterControls={[timeFilter(text.labels.from, from, setFrom), timeFilter(text.labels.to, to, setTo)]}
      />
      </LedgerSelectProvider>
    </ProductsSelectProvider>
  );
};

const RoundRecords = ({ mode }: { mode: RoundMode }) => {
  const text = useDictionary().bioProduction.rounds;

  return (
    <BioGate anyOf={[PERMISSIONS.BIO_RECORDS_READ]}>
      <FarmFirstPage title={text.titles[mode]}>
        <RecordsList mode={mode} />
      </FarmFirstPage>
    </BioGate>
  );
};

export default RoundRecords;
