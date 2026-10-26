import { DisabledByDefault, EditOutlined } from '@mui/icons-material';
import { Divider, Grid, IconButton, Tooltip, Typography } from '@mui/material';
import React, { useState } from 'react';
import { useLedgerSelect } from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import ProjectClaimsAdjustments from './ProjectClaimsAdjustments';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface ProjectClaimsAdjustmentsRowProps {
  adjustment: any;
  adjustments?: any[];
  setAdjustments: React.Dispatch<React.SetStateAction<any[]>>;
  index: number;
  setClearFormKey: React.Dispatch<React.SetStateAction<number>>;
  submitMainForm: any;
  setSubmitItemForm: React.Dispatch<React.SetStateAction<boolean>>;
  submitItemForm: boolean;
  setIsDirty: (dirty: boolean) => void;
}

const ProjectClaimsAdjustmentsRow: React.FC<ProjectClaimsAdjustmentsRowProps> = ({
  adjustment,
  adjustments = [],
  setAdjustments,
  index,
  setClearFormKey,
  submitMainForm,
  setSubmitItemForm,
  submitItemForm,
  setIsDirty,
}) => {
  const dictionary = useDictionary();
  const sh = dictionary.forms.projects.shared;
  const [showForm, setShowForm] = useState<boolean>(false);
  const { ungroupedLedgerOptions } = useLedgerSelect();

  const complementLedger = ungroupedLedgerOptions?.find(
    (ledger: any) =>
      ledger.id ===
      (adjustment?.complement_ledger_id ||
        adjustment?.complement_ledger?.id)
  );

  const handleRemoveItem = () => {
    setAdjustments((prev) => {
      const newItems = [...prev];
      newItems.splice(index, 1);
      return newItems;
    });
  };

  return (
    <React.Fragment>
      <Divider />

      {!showForm ? (
        <Grid
          container
          sx={{
            cursor: 'pointer',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <Grid size={{ xs: 1, md: 0.5 }}>
            <Typography variant="body2">{index + 1}.</Typography>
          </Grid>

          <Grid size={{ xs: 6, md: 3.5 }}>
            <Tooltip title={dictionary.tooltips.type}>
              <Typography variant="body2">
                {(adjustment?.type === '-' || adjustment?.type === 'deduction') ? sh.deductionSign : sh.additionSign}
              </Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 12, md: 4.5 }}>
            <Tooltip title={dictionary.tooltips.description}>
              <Typography
                variant="body2"
                sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}
              >
                {adjustment?.description || '-'}
              </Typography>
            </Tooltip>
            <Tooltip title={dictionary.tooltips.complementLedger}>
              <Typography variant="caption" color="text.secondary">
                {complementLedger?.name || '-'}
              </Typography>
            </Tooltip>
          </Grid>

          <Grid
            size={{ xs: 12, md: 2 }}
            textAlign="end"
            paddingRight={1}
          >
            <Tooltip title={dictionary.tooltips.amount}>
              <Typography variant="body2">
                {adjustment?.amount?.toLocaleString() || '0'}
              </Typography>
            </Tooltip>
          </Grid>

          <Grid textAlign="end" size={{ xs: 12, md: 1.5 }}>
            <Tooltip title={dictionary.tooltips.editAdjustment}>
              <IconButton size="small" onClick={() => setShowForm(true)}>
                <EditOutlined fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title={dictionary.tooltips.removeAdjustment}>
              <IconButton size="small" onClick={handleRemoveItem}>
                <DisabledByDefault fontSize="small" color="error" />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      ) : (
        <ProjectClaimsAdjustments
          setClearFormKey={setClearFormKey}
          submitMainForm={submitMainForm}
          setSubmitItemForm={setSubmitItemForm}
          submitItemForm={submitItemForm}
          setIsDirty={setIsDirty}
          adjustment={adjustment}
          setShowForm={setShowForm}
          index={index}
          adjustments={adjustments}
          setAdjustments={setAdjustments}
        />
      )}
    </React.Fragment>
  );
};

export default ProjectClaimsAdjustmentsRow;
