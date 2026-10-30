'use client';

import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import JumboContentLayout from '@jumbo/components/JumboContentLayout';
import {
  Avatar,
  Card,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import MyHrAccountStatement from './accountStatementTab/MyHrAccountStatement';
import MyHrContracts from './contractsTab/MyHrContracts';
import MyHrLeaves from './leavesTab/MyHrLeaves';
import MyHrNextOfKin from './nextOfKinTab/MyHrNextOfKin';
import MyHrPayslips from './payslipsTab/MyHrPayslips';
import MyHrProfile from './profileTab/MyHrProfile';
import MyHrLoans from './loansTab/MyHrLoans';
type TabKey =
  | 'profile'
  | 'payslips'
  | 'leave'
  | 'contracts'
  | 'nextOfKins'
  | 'loans'
  | 'accountStatement';

const VALID_TABS: TabKey[] = [
  'profile',
  'payslips',
  'leave',
  'contracts',
  'nextOfKins',
  'loans',
  'accountStatement',
];

const MyHr = () => {
  const dictionary = useDictionary();
  const t = dictionary.humanResources.myHr.page;
  const { authUser } = useJumboAuth();
  const user = authUser?.user;
  const { enqueueSnackbar } = useSnackbar();
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [isClient, setIsClient] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [errStatus, setErrStatus] = useState<number | null | undefined>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleTabChange = (_: React.SyntheticEvent, newValue: TabKey) => {
    setActiveTab(newValue);
  };

  // get profile data
  const {
    data: profile,
    isLoading,
    error: profileError,
    isError,
  } = useQuery({
    queryKey: ['showMyHr'],
    queryFn: async () => await humanResourcesServices.myHrProfile(),
    enabled: !!user,
  });

  // Only render tab content on the client
  const renderTabContent = () => {
    if (!isClient) {
      return (
        <Stack spacing={2} sx={{ width: '100%' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              variant='rectangular'
              width='100%'
              height={48}
              sx={{ borderRadius: 1 }}
            />
          ))}
        </Stack>
      );
    }

    // On the client, after hydration, check authUser
    if (!authUser) {
      return (
        <Stack spacing={2} sx={{ width: '100%' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              variant='rectangular'
              width='100%'
              height={48}
              sx={{ borderRadius: 1 }}
            />
          ))}
        </Stack>
      );
    }

    switch (activeTab) {
      case 'profile':
        return <MyHrProfile profile={profile} isLoading={profileLoading} />;
      case 'payslips':
        return <MyHrPayslips />;
      case 'leave':
        return <MyHrLeaves />;
      case 'contracts':
        return <MyHrContracts />;
      case 'nextOfKins':
        return <MyHrNextOfKin />;
      case 'loans':
        return <MyHrLoans />;
      case 'accountStatement':
        return <MyHrAccountStatement />;
      default:
        return null;
    }
  };
  // }, [activeTab, authUser, isClient, isLoading]);

  useEffect(() => {
    if (isLoading) {
      setProfileLoading(true);
    }
    if (isError || profileError || !isLoading) {
      setProfileLoading(false);
    }
    if (axios.isAxiosError(profileError)) {
      enqueueSnackbar(getErrorMessage(profileError) || t.somethingWentWrong, {
        variant: 'error',
      });
      setErrStatus(profileError?.status);
    }
  }, [profileError, isLoading]);

  return (
    <JumboContentLayout
      header={
        <Stack
          direction='row'
          alignItems='flex-start'
          spacing={2}
          flexWrap='wrap'
        >
          <Avatar
            sx={{
              width: 64,
              height: 64,
              bgcolor: 'primary.main',
              fontSize: 24,
            }}
          >
            {isClient ? (user?.name?.[0] ?? '-') : '-'}
          </Avatar>
          <Stack flex={1} spacing={0.25}>
            <Typography variant='h4'>{isClient ? user?.name : ''}</Typography>
            <Typography variant='body2' color='text.secondary'>
              {isClient ? user?.email : ''}
            </Typography>
          </Stack>
        </Stack>
      }
    >
      {errStatus && errStatus === 404 ? (
        <Card sx={{ height: '100%', p: 3 }}>
          <Typography>{t.notLinked}</Typography>
        </Card>
      ) : (
        <Card sx={{ height: '100%', p: 1 }}>
          <Stack spacing={1}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant='scrollable'
              scrollButtons='auto'
              allowScrollButtonsMobile
            >
              <Tab label={t.tabs.profile} value='profile' />
              <Tab label={t.tabs.payslips} value='payslips' />
              <Tab label={t.tabs.leave} value='leave' />
              <Tab label={t.tabs.contracts} value='contracts' />
              <Tab label={t.tabs.nextOfKin} value='nextOfKins' />
              <Tab label={t.tabs.loans} value='loans' />
              <Tab label={t.tabs.accountStatement} value='accountStatement' />
            </Tabs>

            {renderTabContent()}
          </Stack>
        </Card>
      )}
    </JumboContentLayout>
  );
};

export default MyHr;
