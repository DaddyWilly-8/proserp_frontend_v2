'use client'

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BarChartOutlined, EggAltOutlined, HeartBrokenOutlined, RestaurantOutlined, SpeedOutlined } from '@mui/icons-material';
import { Box, Dialog, Grid, Stack, Typography, useMediaQuery } from '@mui/material';
import JumboCardQuick from '@jumbo/components/JumboCardQuick';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import BioGate from '../BioGate';
import InfoHint from '../InfoHint';
import ReportViewer from './ReportViewer';
import { REPORTS, ReportDefinition, ReportId } from './reportTypes';

const ICONS: Record<ReportId, React.ElementType> = {
  'group-cost': BarChartOutlined,
  'batch-performance': SpeedOutlined,
  mortality: HeartBrokenOutlined,
  feed: RestaurantOutlined,
  'harvest-output': EggAltOutlined,
};

const BioReportsContent = () => {
  const dict = useDictionary().bioProduction.reports;
  const searchParams = useSearchParams();
  const { theme } = useJumboTheme();
  const belowLarge = useMediaQuery(theme.breakpoints.down('lg'));
  const [open, setOpen] = useState<ReportDefinition | null>(null);

  // A link such as ?report=group-cost opens that report straight away.
  useEffect(() => {
    const wanted = REPORTS.find((report) => report.id === searchParams.get('report'));
    if (wanted) setOpen(wanted);
  }, [searchParams]);

  return (
    <>
      <Typography variant='h4' mb={2}>{dict.pageTitle}</Typography>
      <JumboCardQuick sx={{ height: '100%' }}>
        <Grid container textAlign='center' columnSpacing={2} rowSpacing={2}>
          {REPORTS.map((report) => {
            const Icon = ICONS[report.id];
            const card = dict.cards[report.id];

            return (
              <Grid key={report.id} sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }} size={{ xs: 6, md: 3, lg: 2 }} p={1} textAlign='center' onClick={() => setOpen(report)}>
                <Icon sx={{ fontSize: '40px' }} />
                <Stack direction='row' alignItems='center' justifyContent='center'>
                  <Typography>{card.title}</Typography>
                  {/* The explanation sits behind the info icon, as on form fields; pressing it must not open the report. */}
                  <Box component='span' onClick={(event) => event.stopPropagation()}>
                    <InfoHint text={card.description} />
                  </Box>
                </Stack>
              </Grid>
            );
          })}
        </Grid>
      </JumboCardQuick>
      <Dialog open={!!open} scroll={belowLarge ? 'body' : 'paper'} fullScreen={belowLarge} fullWidth maxWidth='lg'>
        {open && <ReportViewer key={open.id} definition={open} onClose={() => setOpen(null)} />}
      </Dialog>
    </>
  );
};

const BioReports = () => (
  <BioGate anyOf={[PERMISSIONS.BIO_REPORTS_READ]}>
    <BioReportsContent />
  </BioGate>
);

export default BioReports;
