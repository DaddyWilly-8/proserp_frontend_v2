import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { DeleteOutlined, EditOutlined, MoreHorizOutlined } from '@mui/icons-material';
import { Box, Divider, Grid, Tooltip, Typography } from '@mui/material';
import { JumboDdMenu } from '@jumbo/components';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { MenuItemProps } from '@jumbo/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { batchServices } from '../bio-production-services';
import { useBioAccess } from '../useBioAccess';
import EditDialog from './dialogs/EditDialog';
import { stamp } from '../dateTime';
import BatchStatusChip from './BatchStatusChip';
import { Batch } from './batchTypes';

const BatchListItem = ({ batch }: { batch: Batch }) => {
  const bio = useDictionary().bioProduction;
  const text = bio.batches;
  const { lang } = useParams<{ lang: string }>();
  const access = useBioAccess().batches;
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { mutate: remove } = useMutation({
    mutationFn: batchServices.delete,
    onSuccess: (data: { message: string }) => {
      queryClient.invalidateQueries({ queryKey: ['bioBatches'] });
      enqueueSnackbar(data.message, { variant: 'success' });
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  // A closed batch can be neither edited nor deleted.
  const open = batch.status === 'on progress';
  const menuItems = [
    ...(open && access.manage ? [{ icon: <EditOutlined />, title: text.actions.edit, action: 'edit' }] : []),
    ...(open && access.delete ? [{ icon: <DeleteOutlined color='error' />, title: text.actions.delete, action: 'delete' }] : []),
  ];
  const onAction = (item: MenuItemProps) => {
    if (item.action === 'edit') setEditing(true);
    else if (item.action === 'delete') {
      showDialog({
        title: bio.common.confirmDeleteTitle,
        content: text.dialogs.confirmDeleteBatch,
        onYes: () => { hideDialog(); remove(batch.id); },
        onNo: () => hideDialog(),
        variant: 'confirm',
      });
    }
  };

  return (
    <React.Fragment>
      <Divider />
      <Box display='flex' alignItems='center'>
      <Link style={{ flex: 1, minWidth: 0, color: 'inherit', textDecoration: 'none' }} href={`/${lang}/bioProduction/batches/${batch.id}`}>
        <Grid
          container
          mt={1}
          mb={1}
          px={2}
          columnSpacing={1}
          alignItems='center'
          sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
        >
          <Grid size={{ xs: 6, md: 1.5 }}>
            <Tooltip title={text.labels.batchNo}>
              <Typography variant='h5' fontSize={14} lineHeight={1.25} mb={0} noWrap>{batch.batchNo}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <Tooltip title={text.labels.species}>
              <Typography noWrap>{batch.species_template?.name}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{ xs: 12, md: 2.5 }}>
            <Tooltip title={`${text.labels.farm} / ${text.labels.unit}`}>
              <Typography noWrap>{batch.farm?.name} · {batch.production_unit?.name}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{ xs: 6, md: 1.5 }}>
            <Tooltip title={text.labels.stage}>
              <Typography noWrap>{batch.current_stage?.name ?? '—'}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <Tooltip title={text.labels.currentQuantity}>
              <Typography noWrap>{batch.current_quantity.toLocaleString()} / {batch.initial_quantity.toLocaleString()}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{ xs: 6, md: 1.5 }}>
            <Tooltip title={text.labels.startDate}>
              <Typography noWrap>{stamp(batch.start_date)}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{ xs: 6, md: 1 }} textAlign='end'>
            <BatchStatusChip status={batch.status} />
          </Grid>
        </Grid>
      </Link>
      {menuItems.length > 0 && (
        <Box pr={1}>
          <JumboDdMenu
            icon={<Tooltip title={bio.common.actions}><MoreHorizOutlined fontSize='small' /></Tooltip>}
            menuItems={menuItems}
            onClickCallback={onAction}
          />
        </Box>
      )}
      </Box>
      {editing && <EditDialog batch={batch} open onClose={() => setEditing(false)} />}
    </React.Fragment>
  );
};

export default BatchListItem;
