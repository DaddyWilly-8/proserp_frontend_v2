'use client';

import React, { useState } from 'react';
import { Button, Divider, Grid, Tab, Tabs, useMediaQuery } from '@mui/material';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import ShiftTeamTab, { shiftSchema, ShiftFormData } from './ShiftTeamTab';
import FuelPumpTab from './FuelPumpTab';
import { Station } from './StationType';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

interface StationTabsProps {
  station?: Station;
}

const StationTabs: React.FC<StationTabsProps> = ({ station }) => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const { checkOrganizationPermission } = useJumboAuth();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const canCreateOrEdit = checkOrganizationPermission([
    PERMISSIONS.FUEL_STATIONS_CREATE,
    PERMISSIONS.FUEL_STATIONS_UPDATE,
  ]);

  // Initialize the form with TypeScript types
  const methods = useForm<ShiftFormData>({
    resolver: yupResolver(shiftSchema as any),
    defaultValues: {
      shifts: station?.shifts || [{ name: '', ledger_ids: [], description: '' }],
    },
  });

  // Handle form submission
  const onSubmit = (data: ShiftFormData) => {
    console.log('Form Data:', data);
    // Replace with your API call or submission logic
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <Grid size={12}>
          <Divider />
          <Tabs
            value={activeTab}
            onChange={(e, newValue: number) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            <Tab label="Shift Team" />
            <Tab label="Fuel Pump" />
          </Tabs>
        </Grid>
        {activeTab === 0 && (
          <Grid container sx={{ width: '100%', mt: 2 }}>
            <Grid size={12}>
              <ShiftTeamTab station={station} />
            </Grid>
          </Grid>
        )}
        {activeTab === 1 && (
          <Grid container sx={{ width: '100%', mt: 2 }}>
            <Grid size={12}>
              <FuelPumpTab station={station} />
            </Grid>
          </Grid>
        )}
        {canCreateOrEdit && (
          <Grid size={12} textAlign="end" sx={{ mt: 2 }}>
            <Button type="submit" variant="contained" color="primary">
              Save Changes
            </Button>
          </Grid>
        )}
      </form>
    </FormProvider>
  );
};

export default StationTabs;