'use client'

import { Tab, Tabs } from '@mui/material';
import React, { createContext, useEffect, useState } from 'react';
import DatabaseActions from './DatabaseActions';
import PermissionsList from '../permission/PermissionsList';
import JumboCardQuick from '@jumbo/components/JumboCardQuick';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PROS_CONTROL_PERMISSIONS } from '@/utilities/constants/prosControlPermissions';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import PageLoadingSkeleton from '@/shared/ProgressIndicators/PageLoadingSkeleton';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface SelectedTabContextType {
  activeTab: number;
  setActiveTab?: (tab: number) => void;
}

export const SelectedTab = createContext<SelectedTabContextType>({ activeTab: 0 });

function Troubleshooting() {
  const dictionary = useDictionary();
  const { checkPermission } = useJumboAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const tabs = [
    { label: dictionary.forms.support.tabs.databaseActions, component: <DatabaseActions /> },
    ...(checkPermission([PROS_CONTROL_PERMISSIONS.PERMISSIONS_MANAGE])
      ? [
          { label: dictionary.forms.support.tabs.permissions, component: <PermissionsList /> },
          { label: dictionary.forms.support.tabs.prosPermissions, component: <PermissionsList /> },
        ]
      : []),
  ];

  if (!mounted) return <PageLoadingSkeleton />;

  if (!checkPermission([
    PROS_CONTROL_PERMISSIONS.DATABASE_MIGRATE,
    PROS_CONTROL_PERMISSIONS.DATABASE_REFRESH,
    PROS_CONTROL_PERMISSIONS.PERMISSIONS_MANAGE,
  ])) {
    return <UnauthorizedAccess />;
  }

  return (
    <SelectedTab.Provider value={{ activeTab, setActiveTab }}>
      <JumboCardQuick sx={{ height: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          {tabs.map((tab, index) => (
            <Tab key={index} label={tab.label} />
          ))}
        </Tabs>
        {React.cloneElement(tabs[activeTab]?.component ?? <React.Fragment />, { key: activeTab })}
      </JumboCardQuick>
    </SelectedTab.Provider>
  );
}

export default Troubleshooting;
