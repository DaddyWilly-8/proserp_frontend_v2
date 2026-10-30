'use client'

import { AccountTreeOutlined, FeedOutlined, TrendingDownOutlined, ViewTimelineOutlined } from '@mui/icons-material'
import { Button, Dialog, DialogActions, Grid, Tooltip, useMediaQuery } from '@mui/material'
import React, { useState } from 'react'
import ItemMovement from '../storeStock/ItemMovement';
import StockByCostCenterReport from '../../../reports/StockByCostCenterReport';
import { useStoreProfile } from '../StoreProfileProvider';
import StockMovement from './stockMovement/StockMovement';
import StockReport from '../storeStock/StockReport';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCubes } from '@fortawesome/free-solid-svg-icons';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

function StoreReports() {
    const dictionary = useDictionary();
    const dict = dictionary.reports.storeReports;
    const [stockReportDialogOpen, setStockReportDialogOpen] = useState(false);
    const [itemMovementDialogOpen, setItemMovementDialogOpen] = useState(false);
    const [stockMovementDialogOpen, setStockMovementDialogOpen] = useState(false);
    const [dormantStockDialogOpen, setDormantStockDialogOpen] = useState(false);
    const [distributionDialogOpen, setDistributionDialogOpen] = useState(false);
    const { activeStore } = useStoreProfile();

    //Screen handling constants
    const {theme} = useJumboTheme();
    const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  return (
    <React.Fragment>
        <Dialog
            open={stockReportDialogOpen || itemMovementDialogOpen || stockMovementDialogOpen || dormantStockDialogOpen || distributionDialogOpen}
            scroll={belowLargeScreen ? 'body' : 'paper'}
            fullWidth   
            maxWidth={distributionDialogOpen || stockMovementDialogOpen || dormantStockDialogOpen ? 'lg' : 'md'}
            fullScreen={belowLargeScreen}
        >
            {stockReportDialogOpen && <StockReport setOpenDialog={setStockReportDialogOpen} />}
            {itemMovementDialogOpen && <ItemMovement toggleOpen={setItemMovementDialogOpen} />}
            {stockMovementDialogOpen && <StockMovement toggleOpen={setStockMovementDialogOpen} />}
            {dormantStockDialogOpen && <StockMovement toggleOpen={setDormantStockDialogOpen} dormantStock={true} />}
            {distributionDialogOpen && (
                <React.Fragment>
                    <StockByCostCenterReport store={activeStore} />
                    <DialogActions>
                        <Button size='small' variant='outlined' onClick={() => setDistributionDialogOpen(false)}>
                            {dictionary.reports.procurementReports.close}
                        </Button>
                    </DialogActions>
                </React.Fragment>
            )}
        </Dialog>
        <Grid container p={2}>
            <Grid size={{xs: 12, md: 6, lg: 3}}>
                <Tooltip title={dictionary.tooltips.stockReport}>
                    <Button size='large' onClick={() => setStockReportDialogOpen(true)}>
                        <FontAwesomeIcon size='lg' icon={faCubes} style={{ fontSize: '30px', paddingRight: 5 }}/>
                        {dict.stockReport}
                    </Button>
                </Tooltip>
            </Grid>
            <Grid size={{xs: 12, md: 6, lg: 3}}>
                <Tooltip title={dictionary.tooltips.itemMovement}>
                    <Button size='large' onClick={() => setItemMovementDialogOpen(true)}>
                        <ViewTimelineOutlined fontSize='large' />
                        {` ${dict.itemMovement}`}
                    </Button>
                </Tooltip>
            </Grid>
            <Grid size={{xs: 12, md: 6, lg: 3}}>
                <Tooltip title={dictionary.tooltips.stockMovement}>
                    <Button size='large' onClick={() => setStockMovementDialogOpen(true)}>
                        <FeedOutlined fontSize='large' />
                        {` ${dict.stockMovement}`}
                    </Button>
                </Tooltip>
            </Grid>
            <Grid size={{xs: 12, md: 6, lg: 3}}>
                <Tooltip title={dictionary.tooltips.dormantStock}>
                    <Button size='large' onClick={() => setDormantStockDialogOpen(true)}>
                        <TrendingDownOutlined fontSize='large' />
                        {` ${dict.dormantStock}`}
                    </Button>
                </Tooltip>
            </Grid>
            <Grid size={{xs: 12, md: 6, lg: 3}}>
                <Button size='large' onClick={() => setDistributionDialogOpen(true)}>
                    <AccountTreeOutlined fontSize='large' />
                    {` ${dict.stockDistribution}`}
                </Button>
            </Grid>
        </Grid>
    </React.Fragment>
  )
}

export default StoreReports