'use client'

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Card, CardContent, Divider, Grid, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import BioSelect from './BioSelect';
import { farmServices } from './bio-production-services';
import { BioFarm } from './types';

const FarmContext = createContext<{ farm: BioFarm } | null>(null);

/** The farm chosen at the top of the page. Forms read it instead of asking for a farm again. */
export const useBioFarm = () => {
  const context = useContext(FarmContext);
  if (!context) throw new Error('useBioFarm must be used inside a FarmFirstPage');

  return context;
};

const rememberedKey = (userId?: number | string) => `bioFarm:${userId ?? 'anonymous'}`;

const remembered = (userId?: number | string): number | null => {
  try {
    const value = window.localStorage.getItem(rememberedKey(userId));

    return value ? Number(value) : null;
  } catch {
    return null;
  }
};

const remember = (userId: number | string | undefined, farmId: number | string) => {
  try {
    window.localStorage.setItem(rememberedKey(userId), String(farmId));
  } catch {
    // A private window or blocked storage only means the choice is not remembered.
  }
};

/**
 * The shape of the sales pages: a title, then a card holding the farm selector, and everything below
 * appears only once a farm is chosen. The farm is the user's own to choose from (the server already
 * limits the list to their farms); with just one it is chosen for them, and the last one used is
 * remembered.
 */
const FarmFirstPage = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const text = useDictionary().bioProduction.farmFirst;
  const { authUser } = useJumboAuth();
  const userId = authUser?.user?.id;
  const [farmId, setFarmId] = useState<number | ''>('');

  const { data, isLoading } = useQuery<{ data: BioFarm[] }>({
    queryKey: ['bioActiveFarms'],
    queryFn: () => farmServices.getList({ status: 'active', limit: 500 }),
  });
  const farms = data?.data ?? [];

  useEffect(() => {
    if (farmId !== '' || farms.length === 0) return;
    const pick = farms.find((farm) => farm.id === remembered(userId)) ?? (farms.length === 1 ? farms[0] : null);
    if (pick) setFarmId(pick.id);
  }, [farms, farmId, userId]);

  const farm = farms.find((item) => item.id === farmId) ?? null;

  return (
    <React.Fragment>
      <Typography variant='h4' mb={2}>{title}</Typography>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container justifyContent='center'>
            <Grid size={{ xs: 12, md: 4 }}>
              <BioSelect
                required
                label={text.label}
                loading={isLoading}
                options={farms.map((item) => ({ value: item.id, label: item.name }))}
                value={farmId}
                onChange={(value) => {
                  setFarmId(value as number);
                  remember(userId, value);
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <Divider sx={{ mb: 2 }} />
      {farm ? (
        <FarmContext.Provider value={{ farm }}>{children}</FarmContext.Provider>
      ) : (
        <Typography color='text.secondary' textAlign='center' p={3}>
          {isLoading ? '' : farms.length === 0 ? text.noFarms : text.choose}
        </Typography>
      )}
    </React.Fragment>
  );
};

export default FarmFirstPage;
