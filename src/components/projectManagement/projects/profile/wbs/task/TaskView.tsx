import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import {
  Box,
  Button,
  Card,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import React, { SyntheticEvent, useRef, useState } from 'react';
import projectsServices from '../../../project-services';
import MaterialIssuedSelector from '../../subcontracts/tabs/materialIssued/MaterialIssuedSelector';
import TaskViewListItem from './TaskViewListItem';
import TaskViewSummary from './TaskViewSummary';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface TaskViewProps {
  setOpenDialog: (value: boolean) => void;
  task: any;
  activity: any;
}

const MaterialUsedListHeader = ({
  isAggregated,
}: {
  isAggregated: boolean;
}) => {
  const dictionary = useDictionary();
  return (
    <Grid
      mt={1}
      mb={1}
      sx={{
        cursor: 'pointer',
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
      paddingLeft={2}
      paddingRight={2}
      spacing={1}
      alignItems={'center'}
      container
    >
      {!isAggregated && (
        <Grid size={4}>
          <Typography>{dictionary.projectManagement.wbs.taskView.date}</Typography>
        </Grid>
      )}

      <Grid size={!isAggregated ? 5 : 6}>
        <Typography noWrap={false}>{dictionary.projectManagement.wbs.taskView.productName}</Typography>
      </Grid>

      <Grid size={!isAggregated ? 3 : 3}>
        <Typography>{dictionary.projectManagement.wbs.taskView.quantity}</Typography>
      </Grid>

      {isAggregated && (
        <Grid size={3}>
          <Typography>{dictionary.projectManagement.wbs.taskView.budgetedQuantity}</Typography>
        </Grid>
      )}
    </Grid>
  );
};

const TaskView = ({ setOpenDialog, task, activity }: TaskViewProps) => {
  const dictionary = useDictionary();
  const listRef = useRef<any>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [queryOptions, setQueryOptions] = React.useState({
    queryKey: 'taskMaterialsUsed',
    queryParams: {
      id: task?.id,
      aggregated: true,
      keyword: '',
    },
    countKey: 'total',
    dataKey: 'data',
  });

  const taskDeliverables = task?.deliverables ?? [];

  const handleAggregatedChange = React.useCallback((aggregated: any) => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        aggregated,
      },
    }));
  }, []);

  const handleTabChange = (_event: SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleOnChange = React.useCallback((keyword: string) => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        keyword: keyword,
      },
    }));
  }, []);

  const formatNumber = (value: number | string) =>
    parseFloat(String(value || 0)).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatDate = (value?: string) => {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleDateString('en-GB');
  };

  const isAggregated = Boolean(queryOptions.queryParams.aggregated);

  const taskSubtitle = task.weighted_percentage
    ? task.weighted_percentage.toLocaleString() +
      dictionary.projectManagement.wbs.taskView.percentOf +
      (activity?.name || dictionary.projectManagement.wbs.taskView.detailsAndUsage)
    : activity?.name || dictionary.projectManagement.wbs.taskView.detailsAndUsage;

  const renderMaterial = React.useCallback(
    (material: any) => {
      return (
        <TaskViewListItem material={material} isAggregated={isAggregated} />
      );
    },
    [isAggregated]
  );

  let tableHeader: Array<string> = [];

  !isAggregated
    ? (tableHeader = [
        dictionary.projectManagement.wbs.taskView.date,
        dictionary.projectManagement.wbs.taskView.productName,
        dictionary.projectManagement.wbs.taskView.quantity,
      ])
    : (tableHeader = [
        dictionary.projectManagement.wbs.taskView.productName,
        dictionary.projectManagement.wbs.taskView.quantity,
        dictionary.projectManagement.wbs.taskView.budgetedQuantity,
        dictionary.projectManagement.wbs.taskView.budgetBalance,
      ]);

  return (
    <>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography textAlign={'center'} fontSize={20} fontWeight={700}>
          {task?.name ? dictionary.projectManagement.wbs.taskView.taskTitle.replace('{name}', task.name) : dictionary.projectManagement.wbs.taskView.taskDetails}
        </Typography>
        <Typography
          textAlign={'center'}
          variant='body2'
          color='text.secondary'
          mt={0.5}
        >
          {taskSubtitle}
        </Typography>

        <TaskViewSummary task={task} />

        <Paper variant='outlined' sx={{ mt: 2, borderRadius: 2, pt: 1.5 }}>
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            variant='fullWidth'
            sx={{ minHeight: 40 }}
          >
            <Tab label={dictionary.projectManagement.wbs.taskView.deliverables} />
            <Tab label={dictionary.projectManagement.wbs.taskView.materialUsed} />
          </Tabs>
        </Paper>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {selectedTab === 0 &&
            (taskDeliverables.length > 0 ? (
              <TableContainer
                component={Paper}
                variant='outlined'
                sx={{ borderRadius: 2 }}
              >
                <Table
                  sx={{
                    minWidth: 700,
                    tableLayout: 'fixed',
                    '& .MuiTableCell-root': {
                      border: 1,
                      borderColor: 'divider',
                    },
                  }}
                  aria-label={dictionary.projectManagement.wbs.taskView.deliverablesTable}
                >
                  <TableHead sx={{ bgcolor: 'action.hover' }}>
                    <TableRow>
                      <TableCell sx={{ width: '25%' }}>{dictionary.projectManagement.wbs.taskView.code}</TableCell>
                      <TableCell sx={{ width: '50%' }} align='left'>
                        {dictionary.projectManagement.wbs.taskView.description}
                      </TableCell>
                      <TableCell sx={{ width: '25%' }}>
                        {dictionary.projectManagement.wbs.taskView.contributionPercentage}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {taskDeliverables.map((item: any, idx: number) => (
                      <TableRow
                        key={idx}
                        sx={{
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                      >
                        <TableCell align='left'>{item.code}</TableCell>
                        <TableCell align='left'>{item.description}</TableCell>
                        <TableCell align='right'>
                          {formatNumber(item.contribution_percentage)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Paper variant='outlined' sx={{ p: 2, borderRadius: 2 }}>
                <Typography color='text.secondary'>
                  {dictionary.projectManagement.wbs.taskView.noDeliverables}
                </Typography>
              </Paper>
            ))}

          {selectedTab === 1 && (
            <JumboRqList
              ref={listRef}
              wrapperComponent={Card}
              service={projectsServices.ViewTaskMaterials}
              primaryKey={
                queryOptions.queryParams.aggregated ? 'product_id' : 'id'
              }
              queryOptions={queryOptions}
              itemsPerPage={20}
              itemsPerPageOptions={[5, 8, 10, 15, 20]}
              renderItem={renderMaterial}
              componentElement='div'
              wrapperSx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
              }}
              view='table'
              tableHeader={tableHeader}
              toolbar={
                <JumboListToolbar
                  hideItemsPerPage={true}
                  actionTail={
                    <Stack direction={'column'}>
                      <Stack direction='row'>
                        {selectedTab === 1 && (
                          <MaterialIssuedSelector
                            aggregated={queryOptions.queryParams.aggregated}
                            onChange={handleAggregatedChange}
                          />
                        )}
                        <JumboSearch
                          onChange={handleOnChange}
                          value={queryOptions.queryParams.keyword}
                        />
                      </Stack>
                    </Stack>
                  }
                ></JumboListToolbar>
              }
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          size='small'
          variant='outlined'
          onClick={() => setOpenDialog(false)}
        >
          {dictionary.projectManagement.wbs.common.close}
        </Button>
      </DialogActions>
    </>
  );
};

export default TaskView;
