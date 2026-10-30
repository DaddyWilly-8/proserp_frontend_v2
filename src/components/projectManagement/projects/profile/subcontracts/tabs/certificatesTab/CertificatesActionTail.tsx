'use client';

import React, { useState } from 'react';
import { AddOutlined } from '@mui/icons-material';
import { Dialog, IconButton, Tooltip, useMediaQuery } from '@mui/material';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import CertificateForm from './form/CertificateForm';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface SubContract {
  id?: number | string;
}

interface CertificatesActionTailProps {
  subContract?: SubContract;
}

const CertificatesActionTail: React.FC<CertificatesActionTailProps> = ({ subContract }) => {
  const dictionary = useDictionary();
  const [openDialog, setOpenDialog] = useState(false);
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const { checkOrganizationPermission } = useJumboAuth();

  if (!checkOrganizationPermission(PERMISSIONS.PROJECT_SUBCONTRACTS_CREATE)) {
    return null;
  }

  return (
    <>
      <Dialog maxWidth="lg" fullWidth fullScreen={belowLargeScreen} open={openDialog} onClose={() => setOpenDialog(false)}>
        <CertificateForm setOpenDialog={setOpenDialog} subContract={subContract} />
      </Dialog>

      <Tooltip title={dictionary.tooltips.addCertificate}>
        <IconButton onClick={() => setOpenDialog(true)} size="small">
          <AddOutlined fontSize="small" />
        </IconButton>
      </Tooltip>
    </>
  );
};

export default CertificatesActionTail;