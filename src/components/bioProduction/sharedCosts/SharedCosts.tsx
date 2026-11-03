'use client'

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { MODULES } from '@/utilities/constants/modules';
import LedgerSelectProvider from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import BioGate from '../BioGate';
import BioMasterList from '../BioMasterList';
import BioSelect from '../BioSelect';
import { useBioAccess } from '../useBioAccess';
import { farmServices, sharedCostServices } from '../bio-production-services';
import { BioFarm, BioSharedCost } from '../types';
import SharedCostForm from './SharedCostForm';
import SharedCostListItem from './SharedCostListItem';

const SharedCostsContent = () => {
  const text = useDictionary().bioProduction.sharedCosts;
  const access = useBioAccess().sharedCosts;
  const { checkOrganizationPermission, organizationHasSubscribed } = useJumboAuth();
  // Posting a payment is for people who may post one, as on the cost sheets.
  const canPay = access.create && organizationHasSubscribed(MODULES.ACCOUNTS_AND_FINANCE) && checkOrganizationPermission([PERMISSIONS.ACCOUNTS_TRANSACTIONS_CREATE, PERMISSIONS.PAYMENTS_CREATE]);
  const [farmId, setFarmId] = useState<string | number>('');

  const { data: farms, isLoading } = useQuery<{ data: BioFarm[] }>({ queryKey: ['bioFarmOptions'], queryFn: () => farmServices.getList({ limit: 500 }) });
  const renderItem = React.useCallback((cost: BioSharedCost) => <SharedCostListItem cost={cost} canDelete={access.delete} canPay={canPay} />, [access.delete, canPay]);

  return (
    <BioMasterList<BioSharedCost>
      title={text.pageTitle}
      newLabel={text.new}
      searchPlaceholder={text.searchPlaceholder}
      queryKey='bioSharedCosts'
      service={sharedCostServices.getList}
      renderItem={renderItem}
      canCreate={access.create}
      Form={SharedCostForm}
      filters={{ farm_id: farmId || undefined }}
      filterControls={[
        <BioSelect key='farm' label={text.labels.farm} loading={isLoading} options={(farms?.data ?? []).map((farm) => ({ value: farm.id, label: farm.name }))} value={farmId} onChange={setFarmId} />,
      ]}
    />
  );
};

const SharedCosts = () => (
  <BioGate anyOf={[PERMISSIONS.BIO_SHARED_COSTS_READ, PERMISSIONS.BIO_SHARED_COSTS_CREATE, PERMISSIONS.BIO_SHARED_COSTS_DELETE]}>
    <LedgerSelectProvider>
      <SharedCostsContent />
    </LedgerSelectProvider>
  </BioGate>
);

export default SharedCosts;
