'use client';

import { Tab, Tabs, Box } from '@mui/material';
import React, { createContext, useEffect, useState } from 'react';
import JumboCardQuick from '@jumbo/components/JumboCardQuick';
import SingleUserForm from './SingleUserForm';
import SingleTextMultiUsersForm from './SingleTextMultiUsersForm';
import MultiTextMultiUsersForm from './MultiTextMultiUsersForm';
import BalanceForm from './BalanceForm';
import DeliveryReportsForm from './DeliveryReportsForm';
import LogsForm from './LogsForm';
import PageLoadingSkeleton from '@/shared/ProgressIndicators/PageLoadingSkeleton';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface SelectedTabContextType {
  activeTab: number;
  setActiveTab?: (tab: number) => void;
}

export const SelectedTab = createContext<SelectedTabContextType>({ activeTab: 0 });

function NextSMS() {
  const dictionary = useDictionary();
  const [activeTab, setActiveTab] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const tabs = [
    { label: dictionary.forms.nextSms.tabs.singleUser, component: <SingleUserForm/> },
    { label: dictionary.forms.nextSms.tabs.singleTextMulti, component: <SingleTextMultiUsersForm/> },
    { label: dictionary.forms.nextSms.tabs.multiTextMulti, component: <MultiTextMultiUsersForm/> },
    { label: dictionary.forms.nextSms.tabs.deliveryReports, component: <DeliveryReportsForm/> },
    { label: dictionary.forms.nextSms.tabs.sentLogs, component: <LogsForm/> },
    { label: dictionary.forms.nextSms.tabs.checkBalance, component: <BalanceForm/> }
  ];

  if (!mounted) return <PageLoadingSkeleton />;

  return (
    <SelectedTab.Provider value={{ activeTab, setActiveTab }}>
      <JumboCardQuick sx={{ height: '100%', p: 2 }}>
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
        <Box sx={{ mt: 3 }}>
          {tabs[activeTab]?.component}
        </Box>
      </JumboCardQuick>
    </SelectedTab.Provider>
  );
}

export default NextSMS;
