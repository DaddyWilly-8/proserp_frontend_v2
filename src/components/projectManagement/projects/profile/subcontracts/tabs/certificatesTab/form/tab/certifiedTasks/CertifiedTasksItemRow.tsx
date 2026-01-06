'use client';

import { DisabledByDefault, EditOutlined } from '@mui/icons-material';
import {
  Divider,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import CertifiedTasksItemForm from './CertifiedTasksItemForm';

interface Task {
  id?: number | string;
  name?: string;
  measurement_unit?: {
    symbol?: string;
  };
}

interface CertifiedTaskItem {
  id?: number | string;
  task?: Task;
  task_name?: string;
  certified_quantity?: number | string;
  remarks?: string;
  measurement_unit?: {
    symbol?: string;
  };
}

interface SubContract {
  id?: number | string;
}

interface Certificate {
  project_subcontract_id?: number | string;
}

interface CertifiedTasksItemRowProps {
  setClearFormKey: React.Dispatch<React.SetStateAction<number>>;
  submitMainForm: () => void;
  submitItemForm: boolean;
  setSubmitItemForm: React.Dispatch<React.SetStateAction<boolean>>;
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
  taskItem: CertifiedTaskItem;
  index: number;
  tasksItems: CertifiedTaskItem[];
  CertificateDate: string;
  setTasksItems: React.Dispatch<React.SetStateAction<CertifiedTaskItem[]>>;
  subContract?: SubContract;
  certificate?: Certificate;
}

const CertifiedTasksItemRow: React.FC<CertifiedTasksItemRowProps> = ({
  setClearFormKey,
  submitMainForm,
  submitItemForm,
  setSubmitItemForm,
  setIsDirty,
  taskItem,
  index,
  tasksItems,
  CertificateDate,
  setTasksItems,
  subContract,
  certificate,
}) => {
  const [showForm, setShowForm] = useState(false);

  const handleRemoveItem = () => {
    setTasksItems((prevItems) => {
      const newItems = [...prevItems];
      newItems.splice(index, 1);
      return newItems;
    });
  };

  const taskName = taskItem.task?.name || taskItem.task_name || '-';
  const quantity = `${taskItem.certified_quantity ?? 0} ${taskItem.task?.measurement_unit?.symbol || taskItem.measurement_unit?.symbol}`.trim();
  const remarks = taskItem.remarks || '-';

  return (
    <React.Fragment>
      <Divider />

      {!showForm ? (
        <Grid
          container
          alignItems="center"
          sx={{
            '&:hover': { bgcolor: 'action.hover' },
            py: 1,
          }}
        >
          <Grid size={{ xs: 1, md: 0.5 }}>
            <Typography variant="body2">{index + 1}.</Typography>
          </Grid>

          <Grid size={{ xs: 11, md: 5.5 }}>
            <Tooltip title="Project Task" arrow placement="top-start">
              <Typography variant="body2" noWrap>
                {taskName}
              </Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 6, md: 2 }} sx={{ pl: { xs: 3, md: 0 } }}>
            <Tooltip title="Quantity" arrow>
              <Typography variant="body2">{quantity || '0'}</Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 6, md: 3 }}>
            <Tooltip title="Remarks" arrow placement="top-start">
              <Typography variant="body2" noWrap>
                {remarks}
              </Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 12, md: 1 }} textAlign="end">
            <Tooltip title="Edit Task">
              <IconButton size="small" onClick={() => setShowForm(true)}>
                <EditOutlined fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Remove Task">
              <IconButton size="small" onClick={handleRemoveItem}>
                <DisabledByDefault fontSize="small" color="error" />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      ) : (
        <CertifiedTasksItemForm
          setClearFormKey={setClearFormKey}
          submitMainForm={submitMainForm}
          submitItemForm={submitItemForm}
          setSubmitItemForm={setSubmitItemForm}
          setIsDirty={setIsDirty}
          taskItem={taskItem}
          setShowForm={setShowForm}
          index={index}
          tasksItems={tasksItems}
          setTasksItems={setTasksItems}
          subContract={subContract}
          certificate={certificate}
          CertificateDate={CertificateDate}
        />
      )}
    </React.Fragment>
  );
};

export default CertifiedTasksItemRow;