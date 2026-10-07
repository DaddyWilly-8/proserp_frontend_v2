'use client'

import React, { lazy, useEffect, useState } from 'react';
import { AdminPanelSettingsOutlined, GroupOutlined, RuleOutlined } from '@mui/icons-material';
import { Box, Tab, Tabs, Typography } from '@mui/material';
import { Div } from '@jumbo/shared';
import JumboCardQuick from '@jumbo/components/JumboCardQuick/JumboCardQuick';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import PageLoadingSkeleton from '@/shared/ProgressIndicators/PageLoadingSkeleton';

const RolesPermissionsReport = lazy(() => import('./RolesPermissionsReport'));
const UsersRolesReport = lazy(() => import('./UsersRolesReport'));
const ApprovalChainsReport = lazy(() => import('./ApprovalChainsReport'));

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return (
    <div role='tabpanel' hidden={value !== index}>
      {value === index && <Box pt={2}>{children}</Box>}
    </div>
  );
}

const AccessControlReports = () => {
  const dictionary = useDictionary();
  const dict = dictionary.accessControlReports;
  const { checkOrganizationPermission } = useJumboAuth();
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <PageLoadingSkeleton />;

  if (!checkOrganizationPermission(PERMISSIONS.ACCESS_CONTROL_REPORTS_READ)) {
    return <UnauthorizedAccess />;
  }

  return (
    <JumboCardQuick>
      <Div sx={{ mb: 2 }}>
        <Typography variant='h3'>{dict.title}</Typography>
        <Typography variant='body1' color='text.secondary'>{dict.subtitle}</Typography>
      </Div>

      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 1 }}>
        <Tab icon={<AdminPanelSettingsOutlined />} iconPosition='start' label={dict.tabs.rolesPermissions} />
        <Tab icon={<GroupOutlined />} iconPosition='start' label={dict.tabs.usersRoles} />
        <Tab icon={<RuleOutlined />} iconPosition='start' label={dict.tabs.approvalChains} />
      </Tabs>

      <TabPanel value={tab} index={0}>
        <RolesPermissionsReport />
      </TabPanel>
      <TabPanel value={tab} index={1}>
        <UsersRolesReport />
      </TabPanel>
      <TabPanel value={tab} index={2}>
        <ApprovalChainsReport />
      </TabPanel>
    </JumboCardQuick>
  );
};

export default AccessControlReports;
