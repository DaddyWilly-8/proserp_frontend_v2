'use client';

import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';
import fuelStationServices from '@/components/fuelStation/fuelStationServices';
import { HighlightOff } from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import SalesShiftOnScreen from '../../shifts/preview/SalesShiftOnScreen';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface ShiftPreviewDialogProps {
  shiftId: number | null;
  open: boolean;
  onClose: () => void;
  organization: any;
}

const ShiftPreviewDialog: React.FC<ShiftPreviewDialogProps> = ({
  shiftId,
  open,
  onClose,
  organization,
}) => {
  const dictionary = useDictionary();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const { productOptions } = useProductsSelect();

  const { data: shiftData, isFetching } = useQuery({
    queryKey: ['showshiftDetails', { id: shiftId }],
    queryFn: () => fuelStationServices.showShiftDetails(shiftId),
    enabled: !!shiftId && open,
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth='lg'
      fullScreen={belowLargeScreen}
      scroll={belowLargeScreen ? 'body' : 'paper'}
    >
      <DialogTitle>
        <Stack
          direction='row'
          justifyContent='center'
          alignItems='center'
          position='relative'
        >
          <Typography variant='h5'>{dictionary.reports.fuelStationReports.shiftsSummary.shiftPreview}</Typography>
          <Tooltip title={dictionary.tooltips.close}>
            <IconButton
              size='small'
              onClick={onClose}
              sx={{ position: 'absolute', right: 0 }}
            >
              <HighlightOff color='primary' />
            </IconButton>
          </Tooltip>
        </Stack>
      </DialogTitle>
      <DialogContent>
        {isFetching || !shiftData ? (
          <LinearProgress />
        ) : (
          <SalesShiftOnScreen
            shiftData={shiftData}
            organization={organization}
            shift_teams={(shiftData.shift ? [shiftData.shift] : []) as any}
            fuel_pumps={[]}
            tanks={[]}
            productOptions={productOptions as any}
            openDetails={false}
            paymentReceived={[]}
            allPaymentsReceived={[]}
          />
        )}
        {!belowLargeScreen && (
          <Box textAlign='right' mt={3}>
            <Button variant='outlined' size='small' onClick={onClose}>
              {dictionary.reports.fuelStationReports.shiftsSummary.close}
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShiftPreviewDialog;
