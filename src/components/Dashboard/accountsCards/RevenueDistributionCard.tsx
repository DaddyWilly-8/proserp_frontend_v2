import JumboCardQuick from '@jumbo/components/JumboCardQuick/JumboCardQuick'
import { HighchartsReact } from 'highcharts-react-official'
import Highcharts from 'highcharts'
import React, { useEffect, useState } from 'react'
import { LinearProgress, useMediaQuery } from '@mui/material'
import financialReportsServices from '../../accounts/reports/financial-reports-services'
import { useDashboardSettings } from '../Dashboard'
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks'
import { useQuery } from '@tanstack/react-query'

interface RevenueData {
  ledger_name: string;
  amount: number;
}

interface ChartDataPoint {
  name: string;
  y: number;
}

function RevenueDistributionCard() {
  const { chartFilters: { from, to, cost_center_ids } } = useDashboardSettings();
  const [params, setParams] = useState({ 
    from,
    to,
    cost_center_ids,
    aggregate_by: 'day' as const
  });

  useEffect(() => {
    setParams(prevParams => ({...prevParams, from, to, cost_center_ids}));
  }, [from, to, cost_center_ids])

  // Screen handling constants
  const {theme} = useJumboTheme();
  const xlScreen = useMediaQuery(theme.breakpoints.up('lg'));

  const { data: revenueDistribution, isLoading } = useQuery({
    queryKey: ['revenueDistribution', params],
    queryFn: async () => {
      const revenues = await financialReportsServices.incomeFigures({
        from: params.from,
        to: params.to,
        ledgerGroupId: 3,
        cost_center_ids: params.cost_center_ids,
        group_by_ledgers: true
      });
      
      return revenues.map((revenue: RevenueData) => {
        return {
          name: revenue.ledger_name,
          y: revenue.amount
        } as ChartDataPoint;
      });
    }
  });

  const options: Highcharts.Options = {
    title: {
      text: '<div style="font-family: NoirPro,Arial; font-size: 1.1rem; line-height:1.2; display:block; font-weight: 400; color: #37373C">Revenue Composition</div>',
      align: 'left',
      useHTML: true
    },
    chart: {
      plotBackgroundColor: undefined,
      plotBorderWidth: undefined,
      plotShadow: false,
      type: 'pie',
      height: 245
    },
    accessibility: {
      enabled: false,
      point: {
        valueSuffix: '%'
      }
    },
    tooltip: {
      pointFormat: '{point.y}: <b>({point.percentage:.1f}%)</b>'
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: {
          enabled: true,
          format: '<b>{point.name}</b>: {point.percentage:.1f} %'
        }
      }
    },
    series: [{
      type: 'pie',
      name: 'Expenses',
      colorByPoint: true,
      data: revenueDistribution || []
    } as Highcharts.SeriesPieOptions]
  };

  return (
    <JumboCardQuick
      sx={{
        height: xlScreen ? 310 : null
      }}
    >
      {
        isLoading ? 
        <LinearProgress/> 
        : 
        <HighchartsReact
          highcharts={Highcharts}
          options={options}
        />
      }
    </JumboCardQuick>
  )
}

export default RevenueDistributionCard