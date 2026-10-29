'use client';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { AutorenewOutlined } from '@mui/icons-material';
import { Button, Dialog, useMediaQuery } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import DepreciationAutoRunDialogContent from './DepreciationAutoRunDialogContent';
import depreciationRunsServices from './depreciationRuns-services';

// Opens the organization's auto-run template. The button says whether
// automatic depreciation is currently on, since that is the question most
// people arrive at this page with.
const DepreciationAutoRunAction: React.FC = () => {
  const [open, setOpen] = useState(false);
  const dictionary = useDictionary();
  const t = dictionary.depreciationRuns.autoRun;
  const { checkOrganizationPermission } = useJumboAuth();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const allowed = checkOrganizationPermission([PERMISSIONS.ASSETS_DEPRECIATE]);
  const { data: template } = useQuery({
    queryKey: ['depreciationTemplate'],
    queryFn: () => depreciationRunsServices.getTemplate(),
    enabled: allowed,
  });

  if (!allowed) return null;

  return (
    <React.Fragment>
      <Button
        size="small"
        variant="outlined"
        color={template?.enabled ? 'success' : 'inherit'}
        startIcon={<AutorenewOutlined />}
        onClick={() => setOpen(true)}
        sx={{ mr: 1 }}
      >
        {t.button}: {template?.enabled ? t.statusOn : t.statusOff}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} scroll="paper" fullWidth fullScreen={belowLargeScreen} maxWidth="sm">
        {open && <DepreciationAutoRunDialogContent onClose={() => setOpen(false)} />}
      </Dialog>
    </React.Fragment>
  );
};

export default DepreciationAutoRunAction;
