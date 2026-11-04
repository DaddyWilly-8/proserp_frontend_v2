'use client'

import { useBioAccess } from '../useBioAccess';
import React, { useState } from 'react';
import { DeleteOutlined, EditOutlined, MoreHorizOutlined, VisibilityOutlined } from '@mui/icons-material';
import { Chip, Dialog, Divider, Grid, Tooltip, Typography, useMediaQuery } from '@mui/material';
import { JumboDdMenu } from '@jumbo/components';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { MenuItemProps } from '@jumbo/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { stamp } from '../dateTime';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { roundServices } from '../bio-production-services';
import MeasurementForm from './MeasurementForm';
import RoundForm from './RoundForm';
import RoundView from './RoundView';
import { RoundRecord } from './roundTypes';

/** The sentence a record shows in the list, e.g. "Grower Feed 4mm: 480 Kg to 12 units". */
export const roundSummary = (record: RoundRecord, template: string) =>
  template
    .replace('{product}', record.product?.name ?? '')
    .replace('{quantity}', Number(record.total_quantity ?? 0).toLocaleString(undefined, { minimumFractionDigits: record.kind === 'cost' ? 2 : 0, maximumFractionDigits: 2 }))
    .replace('{unit}', record.measurement_unit?.symbol ?? '')
    .replace('{count}', String(record.lines_count));

const RoundListItem = ({ record, queryKey }: { record: RoundRecord; queryKey: string }) => {
  const dictionary = useDictionary();
  const text = dictionary.bioProduction.rounds;
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const [viewing, setViewing] = useState(false);
  const [editing, setEditing] = useState(false);
  const access = useBioAccess();
  const allowed = access.records.kind(record.kind);

  const { mutate: remove } = useMutation({
    mutationFn: roundServices.delete,
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({ queryKey: ['bioBatch'] });
      queryClient.invalidateQueries({ queryKey: ['bioBatches'] });
      queryClient.invalidateQueries({ queryKey: ['bioBatchInputs'] });
      queryClient.invalidateQueries({ queryKey: ['bioBatchMortalities'] });
    },
    onError: (error: any) => {
      const refused: { unit: string | null; batchNo: string; message: string }[] | undefined = error?.response?.data?.row_errors;
      enqueueSnackbar(
        refused ? `${text.messages.refusedRows}: ${refused.map((line) => `${line.unit ?? ''} ${line.batchNo}: ${line.message}`).join('; ')}` : getErrorMessage(error),
        { variant: 'error' }
      );
    },
  });

  const menuItems = [
    { icon: <VisibilityOutlined />, title: text.messages.view, action: 'view' },
    // A cost record is edited from its rates and amounts, which are not sent to someone who may not see money.
    ...(allowed.edit && (record.kind !== 'cost' || access.finance) ? [{ icon: <EditOutlined />, title: dictionary.bioProduction.common.edit, action: 'edit' }] : []),
    ...(allowed.delete ? [{ icon: <DeleteOutlined color='error' />, title: dictionary.bioProduction.common.delete, action: 'delete' }] : []),
  ];

  const handleItemAction = (menuItem: MenuItemProps) => {
    if (menuItem.action === 'view') {
      setViewing(true);
    } else if (menuItem.action === 'edit') {
      setEditing(true);
    } else if (menuItem.action === 'delete') {
      showDialog({
        title: text.messages.deleteTitle,
        content: record.paymentNo ? `${text.messages.deleteContent} ${text.messages.deletePaid.replace('{paymentNo}', record.paymentNo)}` : text.messages.deleteContent,
        onYes: () => {
          hideDialog();
          remove(record.id);
        },
        onNo: () => hideDialog(),
        variant: 'confirm',
      });
    }
  };

  return (
    <React.Fragment>
      <Divider />
      <Dialog open={viewing} fullWidth maxWidth='md' fullScreen={belowLargeScreen} onClose={() => setViewing(false)}>
        {viewing && <RoundView recordId={record.id} onClose={() => setViewing(false)} />}
      </Dialog>
      <Dialog open={editing} fullWidth maxWidth='md' fullScreen={belowLargeScreen}>
        {editing && (record.kind === 'measurement' ? <MeasurementForm item={record} setOpenDialog={setEditing} /> : <RoundForm mode={record.kind} item={record} setOpenDialog={setEditing} />)}
      </Dialog>
      <Grid
        container
        mt={1}
        mb={1}
        px={2}
        columnSpacing={1}
        alignItems='center'
        onClick={() => setViewing(true)}
        sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
      >
        <Grid size={{ xs: 6, md: 2 }}>
          <Tooltip title={text.labels.recordNo}>
            <Typography variant='h5' fontSize={14} lineHeight={1.25} mb={0} noWrap>{record.recordNo}</Typography>
          </Tooltip>
          <Typography variant='caption' color='text.secondary'>{stamp(record.record_date)}</Typography>
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <Tooltip title={text.labels.farm}>
            <Typography noWrap>{record.farm?.name}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Tooltip title={text.labels.summary}>
            <Typography noWrap>
              {roundSummary(record, record.kind === 'cost' && !access.finance ? text.summary.costPlain : text.summary[record.kind])}
              {record.paymentNo && (
                <Chip size='small' color='success' variant='outlined' label={`${text.labels.payment}: ${record.paymentNo}`} sx={{ ml: 1 }} />
              )}
              {record.input_type && (
                <Chip size='small' variant='outlined' label={dictionary.bioProduction.batches.inputTypes[record.input_type]} sx={{ ml: 1 }} />
              )}
            </Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 10, md: 2 }}>
          <Tooltip title={text.labels.creator}>
            <Typography noWrap color='text.secondary'>{record.creator?.name}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 2, md: 1 }} textAlign='end' onClick={(event) => event.stopPropagation()}>
          <JumboDdMenu
            icon={
              <Tooltip title={dictionary.bioProduction.common.actions}>
                <MoreHorizOutlined fontSize='small' />
              </Tooltip>
            }
            menuItems={menuItems}
            onClickCallback={handleItemAction}
          />
        </Grid>
      </Grid>
    </React.Fragment>
  );
};

export default RoundListItem;
