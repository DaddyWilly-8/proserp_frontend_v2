'use client';

import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { Box, Tab, Tabs } from '@mui/material';
import { useState } from 'react';
import MyHrLeaveBalances from './leaveBalances/MyHrLeaveBalances';
import MyHrLeaveRequests from './leaveRequests/MyHrLeaveRequests';

type LeaveSubTab = 'balances' | 'requests';

export default function MyHrLeaves() {
  const dictionary = useDictionary();
  const t = dictionary.humanResources.myHr.leaves;
  const [subTab, setSubTab] = useState<LeaveSubTab>('balances');

  return (
    <Box>
      <Tabs
        value={subTab}
        onChange={(_, v) => setSubTab(v)}
        variant='scrollable'
        scrollButtons='auto'
        sx={{ mb: 2 }}
      >
        <Tab label={t.leaveBalances} value='balances' />
        <Tab label={t.leaveRequests} value='requests' />
      </Tabs>

      {subTab === 'balances' && <MyHrLeaveBalances />}
      {subTab === 'requests' && <MyHrLeaveRequests />}
    </Box>
  );
}
