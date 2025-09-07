import JumboCardQuick from '@jumbo/components/JumboCardQuick/JumboCardQuick'
import React, { useEffect, useState } from 'react'
import { useDashboardSettings } from '../Dashboard';
import { Button, ButtonGroup, FormControl, InputLabel, LinearProgress, MenuItem, Select, Tooltip, useMediaQuery } from '@mui/material';
import purchaseServices from '../../procurement/purchases/purchase-services';
import { CartesianGrid, ResponsiveContainer, XAxis, YAxis,  Tooltip as RechartTooltip, Bar, ComposedChart, Legend } from 'recharts';
import grnServices from '../../procurement/grns/grn-services';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { Div } from '@jumbo/shared';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';

interface ChartDataItem {
  period: string;
  amount: number;
}

interface MergedDataItem {
  name: string;
  Purchases: number;
  GRNs: number;
}

function PurchasesAndGrns() {
  // Screen handling constants
  const {theme} = useJumboTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const midScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const xlScreen = useMediaQuery(theme.breakpoints.up('lg'));

  const { chartFilters: { from, to, cost_center_ids } } = useDashboardSettings();
  const [params, setParams] = useState({ 
    from,
    to,
    cost_center_ids,
    aggregate_by: 'day' as 'day' | 'week' | 'month' | 'year'
  });

  useEffect(() => {
    setParams(prevParams => ({...prevParams, from, to, cost_center_ids}));
  }, [from, to, cost_center_ids]);

  const { data: purchaseValues = [], isLoading } = useQuery({
    queryKey: ['purchasesChart', params],
    queryFn: async () => {
      const purchaseValues = await purchaseServices.purchaseValues(params);
      const grnValues = await grnServices.grnValues(params);
      const mergedArray: MergedDataItem[] = [];
      
      purchaseValues.forEach((purchaseItem: ChartDataItem) => {
        const grnItem = grnValues.find((grn: ChartDataItem) => grn.period === purchaseItem.period);
    
        const mergedItem: MergedDataItem = {
          name: purchaseItem.period,
          Purchases: purchaseItem.amount,
          GRNs: grnItem ? grnItem.amount : 0
        };
    
        mergedArray.push(mergedItem);
      });
    
      grnValues.forEach((grnItem: ChartDataItem) => {
        const purchaseItem = purchaseValues.find((purchase: ChartDataItem) => purchase.period === grnItem.period);
    
        if (!purchaseItem) {
          const mergedItem: MergedDataItem = {
            name: grnItem.period,
            Purchases: 0,
            GRNs: grnItem.amount
          };
    
          mergedArray.push(mergedItem);
        }
      });

      // Sort mergedArray by name in ascending order
      mergedArray.sort((a, b) => a.name.localeCompare(b.name));

      return mergedArray.map(item => ({
        ...item,
        name: params.aggregate_by === 'day' ? dayjs(item.name).format('ddd, MMM D, YYYY') : item.name,
      }));
    }
  });

  const shortNumber = (value: number) => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  };

  return (
    <JumboCardQuick 
      title={'Purchases'}
      sx={{
        height: smallScreen ? null : xlScreen ? 310 : null
      }}
      action={
        !smallScreen && !midScreen ?
        <ButtonGroup
            variant="outlined"
            size='small'
            disableElevation
        >
            <Tooltip title={'Daily Trend'}>
                <Button variant={params.aggregate_by === "day" ? "contained" : "outlined"}
                    onClick={() => setParams(prevParams => ({...prevParams, aggregate_by: 'day'}))}
                >Daily</Button>
            </Tooltip>
            <Tooltip title={'Weekly Trend'}>
                <Button variant={params.aggregate_by === "week" ? "contained" : "outlined"}
                    onClick={() => setParams(prevParams => ({...prevParams, aggregate_by: 'week'}))}
                >Weekly</Button>
            </Tooltip>
            <Tooltip title={'Monthly Trend'}>
                <Button variant={params.aggregate_by === "month" ? "contained" : "outlined"}
                    onClick={() => setParams(prevParams => ({...prevParams, aggregate_by: 'month'}))}
                >Monthly</Button>
            </Tooltip>
            <Tooltip title={'Yearly Trend'}>
                <Button variant={params.aggregate_by === "year" ? "contained" : "outlined"}
                    onClick={() => setParams(prevParams => ({...prevParams, aggregate_by: 'year'}))}
                >Yearly</Button>
            </Tooltip>
        </ButtonGroup>
        :
        <Div sx={{mt: 1}}>
            <FormControl fullWidth size='small'>
                <InputLabel id="purchase-and-grns-group-by-input-label">Interval</InputLabel>
                <Select
                    labelId="purchase-and-grns-group-by-label"
                    id="purchase-and-grns-group-by"
                    value={params.aggregate_by}
                    label={'Interval'}
                    onChange={(e) => {
                        setParams(prevParams => ({...prevParams, aggregate_by: e.target.value as 'day' | 'week' | 'month' | 'year'}))
                    }}
                >
                    <MenuItem value='day'>Daily</MenuItem>
                    <MenuItem value='week'>Weekly</MenuItem>
                    <MenuItem value='month'>Monthly</MenuItem>
                    <MenuItem value='year'>Yearly</MenuItem>
                </Select>
            </FormControl>
        </Div>
    }
    >
      {
        isLoading ? <LinearProgress/> :
        <ResponsiveContainer width="100%" height={xlScreen ? 250 : 165}>
            <ComposedChart syncId={'1'} data={purchaseValues}>
                <XAxis dataKey="name"/>
                <YAxis tickFormatter={shortNumber}/>
                <CartesianGrid strokeDasharray="3 3"/>
                <RechartTooltip 
                  labelStyle={{color: 'black'}} itemStyle={{color: 'black'}} cursor={false}
                  formatter={(value: number) => value.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}
                />
                <Legend/>
                <Bar type="monotone" dataKey="Purchases" fill={"blue"} barSize={10} />
                <Bar type="monotone" dataKey="GRNs" fill={"#39960e"} barSize={10} />
            </ComposedChart>
        </ResponsiveContainer>
      }
    </JumboCardQuick>
  )
}

export default PurchasesAndGrns