import JumboCardQuick from '@jumbo/components/JumboCardQuick/JumboCardQuick'
import { Checkbox, Chip, FormControlLabel, Grid, Stack } from '@mui/material'
import { VisibilityOffOutlined, VisibilityOutlined } from '@mui/icons-material'
import { DateTimePicker } from '@mui/x-date-pickers'
import dayjs, { Dayjs } from 'dayjs'
import { useDashboardSettings } from './Dashboard'
import CostCenterSelector from '../masters/costCenters/CostCenterSelector'
import { useJumboAuth } from '@/app/providers/JumboAuthProvider'
import { CostCenter } from '../masters/costCenters/CostCenterType'
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext'

const PRESETS = ['today', 'last7', 'last30', 'thisMonth', 'thisYear'] as const;

const presetRange = (preset: (typeof PRESETS)[number]) => {
    const now = dayjs();
    switch (preset) {
        case 'today': return now.startOf('day');
        case 'last7': return now.subtract(6, 'day').startOf('day');
        case 'thisMonth': return now.startOf('month');
        case 'thisYear': return now.startOf('year');
        default: return now.subtract(29, 'day').startOf('day');
    }
};

function Filters() {
    const { chartFilters: { from, to }, setChartFilters, showFigures, setShowFigures } = useDashboardSettings();
    const dictionary = useDictionary();
    const { authOrganization } = useJumboAuth();
    
    return (
        <JumboCardQuick>
            <Grid container justifyContent={'center'} spacing={1}>
                <Grid size={{ xs: 12, md: 6, lg: 3, xl: 2 }}>
                    <DateTimePicker
                        label="From"
                        minDate={dayjs(authOrganization?.organization?.recording_start_date)}
                        value={dayjs(from)}
                        slotProps={{
                            textField: {
                                size: 'small',
                                fullWidth: true,
                            }
                        }}
                        onChange={(value: Dayjs | null) => {
                            setChartFilters((filters) => { 
                                return { ...filters, from: value?.toISOString() || '' }; 
                            });
                        }}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6, lg: 3, xl: 2 }}>
                    <DateTimePicker
                        label="To"
                        value={dayjs(to)}
                        minDate={dayjs(authOrganization?.organization?.recording_start_date)}
                        slotProps={{
                            textField: {
                                size: 'small',
                                fullWidth: true,
                            }
                        }}
                        onChange={(value: Dayjs | null) => {
                            setChartFilters((filters) => { 
                                return { ...filters, to: value?.toISOString() || '' }; 
                            });
                        }}
                    />
                </Grid>
                <Grid size={{ xs: 12, lg: 4, xl: 4 }}>
                    <CostCenterSelector
                        label='Cost and Profit Centers'
                        multiple={true}
                        allowSameType={true}
                        onChange={(cost_centers: any) => {
                            let costCenters = authOrganization?.costCenters;
                            let cost_center_ids: string | number[] = 'all';
                            if (cost_centers.length > 0) {
                                cost_center_ids = cost_centers.map((cost_center: CostCenter) => cost_center.id);
                                costCenters = cost_centers;
                            }
                            setChartFilters((filters) => { 
                                return { ...filters, cost_center_ids, costCenters }; 
                            });
                        }}
                    />
                </Grid>
                <Grid size={{ xs: 12, lg: 2 }} display='flex' alignItems='center' justifyContent='center'>
                    <FormControlLabel
                        control={
                            <Checkbox
                                size='small'
                                color='primary'
                                checked={showFigures}
                                onChange={(e) => setShowFigures(e.target.checked)}
                                icon={<VisibilityOffOutlined />}
                                checkedIcon={<VisibilityOutlined />}
                            />
                        }
                        label={
                            showFigures
                                ? dictionary.dashboardCards.hideFigures
                                : dictionary.dashboardCards.showFigures
                        }
                        sx={{ mr: 0 }}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <Stack direction='row' spacing={0.5} flexWrap='wrap' useFlexGap justifyContent='center'>
                        {PRESETS.map((preset) => (
                            <Chip
                                key={preset}
                                size='small'
                                variant='outlined'
                                clickable
                                label={dictionary.dashboardCards.presets[preset]}
                                onClick={() => setChartFilters((filters) => ({ ...filters, from: presetRange(preset).toISOString(), to: dayjs().toISOString() }))}
                            />
                        ))}
                    </Stack>
                </Grid>
            </Grid>
        </JumboCardQuick>
    )
}

export default Filters