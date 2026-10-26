'use client';

import { HighlightOff } from '@mui/icons-material';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import { getTreeGraphOptions } from '@/utilities/constants/chartOptions';
import { useProjectProfile } from '../../ProjectProfileProvider';
import { HighchartsWrapper } from '@/components/HighchartsWrapper';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

// ✅ Data transformation function
const transformTasksToTreeData = (groups, dictionary) => {
  if (!Array.isArray(groups) || groups.length === 0) {
    return [];
  }

  const flattenGroups = (groupList, parentName = null) => {
    const sortedGroups = [...groupList].sort((a, b) => (b.id || 0) - (a.id || 0));

    return sortedGroups.flatMap((group) => {
      const groupNode = {
        id: 'activity_' + group.id,
        name: group.name || dictionary.projectManagement.wbs.treeView.unnamedActivity,
        parent: parentName,
        nodeType: 'group',
      };

      const sortedTasks = (group.tasks || [])
        .filter((task) => task)
        .sort((a, b) => (b.position_index || 0) - (a.position_index || 0));

      const taskNodes = sortedTasks.map((task) => ({
        id: 'task_' + task.id,
        name: task.name || dictionary.projectManagement.wbs.treeView.unnamedTask,
        parent: 'activity_' + group.id,
        className: task.is_milestone ? 'milestone-task' : '',
        nodeType: 'task',
      }));

      const childGroupNodes = flattenGroups(
        group.children || [],
        'activity_' + group.id
      );

      return [groupNode, ...taskNodes, ...childGroupNodes];
    });
  };

  return flattenGroups(groups);
};

function TasksTreeView({ setOpenTasksTreeView }) {
  const dictionary = useDictionary();
  const { project, projectTimelineActivities } = useProjectProfile();

  // ✅ Transform data
  const treeData = transformTasksToTreeData(projectTimelineActivities, dictionary);

  // ✅ Empty state
  if (!treeData || treeData.length === 0) {
    return (
      <>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{dictionary.projectManagement.wbs.treeView.title}</Typography>
          <Tooltip title={dictionary.tooltips.close}>
            <IconButton size='small' onClick={() => setOpenTasksTreeView(false)}>
              <HighlightOff color='primary' />
            </IconButton>
          </Tooltip>
        </DialogTitle>
        <DialogContent>
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Typography variant="body1" color="textSecondary">
              {dictionary.projectManagement.wbs.treeView.noTasks}
            </Typography>
          </div>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setOpenTasksTreeView(false)}>
            {dictionary.projectManagement.wbs.common.close}
          </Button>
        </DialogActions>
      </>
    );
  }

  // ✅ Chart options
  const chartOptions = getTreeGraphOptions(
    treeData.map((node) => ({
      id: node.id,
      parent: node.parent,
      name: node.name,
      className: node.className,
      nodeType: node.nodeType,
    })),
    project?.name ? `${project.name} - ${dictionary.projectManagement.wbs.treeView.title}` : dictionary.projectManagement.wbs.treeView.title
  );

  return (
    <>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
          {dictionary.projectManagement.wbs.treeView.title}
        </Typography>
        <Tooltip title={dictionary.tooltips.close}>
          <IconButton size='small' onClick={() => setOpenTasksTreeView(false)}>
            <HighlightOff color='primary' />
          </IconButton>
        </Tooltip>
      </DialogTitle>

      <DialogContent sx={{ padding: '20px', minHeight: '500px' }}>
        <HighchartsWrapper options={chartOptions} />
      </DialogContent>

      <DialogActions>
        <Button variant="contained" color="primary" onClick={() => setOpenTasksTreeView(false)}>
          {dictionary.projectManagement.wbs.common.close}
        </Button>
      </DialogActions>
    </>
  );
}

export default TasksTreeView;