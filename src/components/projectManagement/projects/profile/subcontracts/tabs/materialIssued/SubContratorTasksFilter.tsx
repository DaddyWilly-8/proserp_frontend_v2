import React from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface SubContractTask {
  project_task_id?: number;
  project_task?: {
    id?: number;
    name?: string;
  };
}

interface TaskOption {
  id: number;
  name: string;
}

interface SubContratorTasksFilterProps {
  tasks?: SubContractTask[];
  value?: number[];
  onChange: (taskIds: number[]) => void;
}

function SubContratorTasksFilter({
  tasks = [],
  value = [],
  onChange,
}: SubContratorTasksFilterProps) {
  const dictionary = useDictionary();
  const options = React.useMemo<TaskOption[]>(() => {
    const taskMap = new Map<number, TaskOption>();

    (tasks || []).forEach((task) => {
      const taskId = Number(task?.project_task_id || task?.project_task?.id || 0);
      if (!taskId) return;

      if (!taskMap.has(taskId)) {
        taskMap.set(taskId, {
          id: taskId,
          name: task?.project_task?.name || dictionary.projectManagement.materialIssued.task.replace('{id}', String(taskId)),
        });
      }
    });

    return Array.from(taskMap.values());
  }, [tasks, dictionary]);

  const selectedOptions = React.useMemo(
    () => options.filter((option) => (value || []).includes(option.id)),
    [options, value]
  );

  return (
    <Autocomplete
      multiple
      disableCloseOnSelect
      options={options}
      value={selectedOptions}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      getOptionLabel={(option) => option.name}
      onChange={(_, newValue) => onChange(newValue.map((option) => option.id))}
      renderInput={(params) => (
        <TextField
          {...params}
          label={dictionary.projectManagement.materialIssued.filterByTasks}
          size='small'
          fullWidth
        />
      )}
    />
  );
}

export default SubContratorTasksFilter;
