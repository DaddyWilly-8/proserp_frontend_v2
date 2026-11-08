'use client'

import React from 'react';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Dialog, LinearProgress, useMediaQuery } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import ProductsSelectProvider from '@/components/productAndServices/products/ProductsSelectProvider';
import { BioFarmProvider } from '../../FarmFirstPage';
import { farmServices } from '../../bio-production-services';
import RoundForm from '../../rounds/RoundForm';
import { BioFarm } from '../../types';

/**
 * Corrects a feed, medication or other input from the batch page by opening the daily record it belongs to in the
 * same form Daily Records uses, so the stock, unit and quantity are checked the same way.
 */
const EditInputRecordDialog = ({ recordId, farmId, onClose }: { recordId: number; farmId: number; onClose: () => void }) => {
  const { theme } = useJumboTheme();
  const small = useMediaQuery(theme.breakpoints.down('lg'));
  const { data: farm } = useQuery<BioFarm>({ queryKey: ['bioFarm', farmId], queryFn: () => farmServices.get(farmId) });

  return (
    <Dialog open fullWidth maxWidth='lg' fullScreen={small} onClose={onClose}>
      {farm ? (
        <BioFarmProvider farm={farm}>
          <ProductsSelectProvider>
            <RoundForm mode='feeding' item={{ id: recordId } as any} setOpenDialog={(open: boolean) => !open && onClose()} />
          </ProductsSelectProvider>
        </BioFarmProvider>
      ) : (
        <LinearProgress />
      )}
    </Dialog>
  );
};

export default EditInputRecordDialog;
