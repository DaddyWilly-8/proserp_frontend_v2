'use client';

import React from 'react';
import { Grid, IconButton, Stack, Tooltip } from '@mui/material';
import { DeleteOutlined, EditOutlined, OpenInNewOutlined } from '@mui/icons-material';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { useRouter, useParams } from 'next/navigation';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface RFQListItemActionProps {
  rfqId: number;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onOpen?: (e: React.MouseEvent) => void;
}

const RFQListItemAction: React.FC<RFQListItemActionProps> = ({
  rfqId,
  onEdit,
  onDelete,
  onOpen,
}) => {
  const dictionary = useDictionary();
  const { checkOrganizationPermission } = useJumboAuth();
  const router = useRouter();
  const params = useParams();
  const lang = (params?.lang as string) || 'en-US';

  const handleOpenClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/${lang}/procurement/rfqs/${rfqId}`);
  };

  return (
    <Grid size={{ xs: 12 }} textAlign="end">
      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
        <Tooltip title={dictionary.tooltips.openRfq}>
          <IconButton size="small" onClick={onOpen || handleOpenClick}>
            <OpenInNewOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
        {checkOrganizationPermission(PERMISSIONS.RFQS_EDIT) && (
          <Tooltip title={dictionary.tooltips.editRfq}>
            <IconButton size="small" onClick={onEdit}>
              <EditOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {checkOrganizationPermission(PERMISSIONS.RFQS_DELETE) && (
          <Tooltip title={dictionary.tooltips.deleteRfq}>
            <IconButton size="small" onClick={onDelete}>
              <DeleteOutlined fontSize="small" color="error" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    </Grid>
  );
};

export default RFQListItemAction;