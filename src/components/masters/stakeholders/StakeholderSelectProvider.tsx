'use client'

import React, { createContext, useContext } from 'react';
import stakeholderServices from './stakeholder-services';
import { useQuery } from '@tanstack/react-query';
import { Stakeholders } from './StakeholderType';

interface StakeholderSelectContextValue {
  stakeholders: Stakeholders;
  isLoadingStakeholders?: boolean;
}

interface StakeholderSelectProviderProps {
  children: React.ReactNode;
  type?: string;
}

const StakeholderSelectContext = createContext<StakeholderSelectContextValue>({
  stakeholders: [],
});

export const useStakeholderSelect = () => useContext(StakeholderSelectContext);

// Used in 22+ files as a stakeholder-picker data source for forms/dialogs -
// the base page content underneath never needs this list itself, so
// blocking on it here held every one of those pages behind a single API call.
function StakeholderSelectProvider({ children, type = 'all' }: StakeholderSelectProviderProps) {
  const { data: stakeholders = [], isLoading } = useQuery<Stakeholders>({
    queryKey: ['stakeholders', type],
    queryFn: () => stakeholderServices.getSelectOptions(type),
  });

  return (
    <StakeholderSelectContext.Provider value={{ stakeholders, isLoadingStakeholders: isLoading }}>
      {children}
    </StakeholderSelectContext.Provider>
  );
}

export default StakeholderSelectProvider;