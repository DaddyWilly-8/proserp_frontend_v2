'use client'

import React, { useState } from 'react';
import { Card, Dialog, Grid, Stack, Typography, useMediaQuery } from '@mui/material';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import BioActionTail from './BioActionTail';
import { BioFormProps } from './types';

interface BioMasterListProps<T> {
  /** Omit when a surrounding page already shows the title. */
  title?: string;
  newLabel: string;
  searchPlaceholder?: string;
  queryKey: string;
  service: (params: any) => Promise<any>;
  renderItem: (item: T) => React.ReactNode;
  Form: React.ComponentType<BioFormProps<T>>;
  /** Extra query parameters sent with the list request (e.g. the selected filters). */
  filters?: Record<string, string | number | undefined>;
  /** Filter controls for the toolbar's filter area, one grid cell each. */
  filterControls?: React.ReactNode[];
  /** False hides the "new" button, for someone who may only look. */
  canCreate?: boolean;
  /** More buttons beside "new". */
  extraActions?: React.ReactNode;
}

/**
 * The searchable, paginated list with a "new" dialog that the Bio Production
 * masters share.
 */
function BioMasterList<T>({ title, newLabel, searchPlaceholder, queryKey, service, renderItem, Form, filters, filterControls, canCreate = true, extraActions }: BioMasterListProps<T>) {
  const [keyword, setKeyword] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const queryOptions = React.useMemo(
    () => ({ queryKey, queryParams: { keyword, ...filters }, countKey: 'total', dataKey: 'data' }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryKey, keyword, JSON.stringify(filters)]
  );

  return (
    <React.Fragment>
      <Dialog maxWidth='md' fullWidth fullScreen={belowLargeScreen} open={openDialog}>
        {openDialog && <Form setOpenDialog={setOpenDialog} />}
      </Dialog>
      {title && <Typography variant='h4' mb={2}>{title}</Typography>}
      <JumboRqList
        wrapperComponent={Card}
        service={service}
        primaryKey='id'
        queryOptions={queryOptions}
        itemsPerPage={10}
        itemsPerPageOptions={[5, 8, 10, 15, 20]}
        renderItem={renderItem}
        componentElement='div'
        wrapperSx={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        toolbar={
          <JumboListToolbar
            hideItemsPerPage={true}
            action={
              // One row on large screens, as on the Purchase Orders list: filters, then search, then the add button.
              <Grid container columnSpacing={1} rowSpacing={1} justifyContent='end' alignItems='center'>
                {filterControls?.map((control, index) => (
                  <Grid key={index} size={{ xs: 12, md: 6, lg: 3 }}>{control}</Grid>
                ))}
                <Grid size={{ xs: 12, md: 6, lg: 5 }}>
                  <Stack direction='row' alignItems='center'>
                    <JumboSearch onChange={setKeyword} value={keyword} placeholder={searchPlaceholder} />
                    {extraActions}
                    {canCreate && <BioActionTail label={newLabel} onClick={() => setOpenDialog(true)} />}
                  </Stack>
                </Grid>
              </Grid>
            }
          />
        }
      />
    </React.Fragment>
  );
}

export default BioMasterList;
