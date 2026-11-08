'use client'

import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Chip, DialogContent, DialogTitle, Grid, IconButton, LinearProgress, Stack, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { CloseOutlined } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import { useSnackbar } from 'notistack';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import PDFContent from '@/components/pdf/PDFContent';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import BioSelect from '../BioSelect';
import InfoHint from '../InfoHint';
import { farmServices, reportServices, speciesTemplateServices } from '../bio-production-services';
import { useUnitGroups, unitGroupOptions } from '../useUnitGroups';
import { BioFarm, BioSpeciesTemplate } from '../types';
import BioReportPdf from './BioReportPdf';
import ReportTableView from './ReportTableView';
import { ReportColumn, ReportDefinition, ReportFilters, ReportTable } from './reportTypes';

const PRESETS = ['last7', 'last30', 'thisMonth', 'lastMonth', 'thisYear'] as const;
const presetRange = (preset: (typeof PRESETS)[number]) => {
  const now = dayjs();
  switch (preset) {
    case 'last7': return { from: now.subtract(7, 'day').startOf('day'), to: now };
    case 'last30': return { from: now.subtract(30, 'day').startOf('day'), to: now };
    case 'thisMonth': return { from: now.startOf('month'), to: now };
    case 'lastMonth': return { from: now.subtract(1, 'month').startOf('month'), to: now.subtract(1, 'month').endOf('month') };
    default: return { from: now.startOf('year'), to: now };
  }
};

/** One report: its filters, the table (or cards on a narrow screen), and the Excel and PDF exports. */
const ReportViewer = ({ definition, onClose }: { definition: ReportDefinition; onClose: () => void }) => {
  const { lang } = useParams<{ lang: string }>();
  const bio = useDictionary().bioProduction;
  const dict = bio.reports;
  const card = dict.cards[definition.id];
  const { enqueueSnackbar } = useSnackbar();
  const { authOrganization, authUser } = useJumboAuth();
  const user = authUser?.user;

  const [farmId, setFarmId] = useState<string | number>('');
  const [from, setFrom] = useState<Dayjs>(() => presetRange('last30').from);
  const [to, setTo] = useState<Dayjs>(() => presetRange('last30').to);
  const [groupId, setGroupId] = useState<string | number>('');
  const [speciesId, setSpeciesId] = useState<string | number>('');
  const [status, setStatus] = useState<string | number>('');
  const [groupBy, setGroupBy] = useState<string>(definition.groupBy?.[0] ?? '');
  const [applied, setApplied] = useState<ReportFilters | null>(null);
  const [showPdf, setShowPdf] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const { data: farms, isLoading: loadingFarms } = useQuery<{ data: BioFarm[] }>({ queryKey: ['bioFarmOptions'], queryFn: () => farmServices.getList({ limit: 500 }) });
  const { data: groups } = useUnitGroups(farmId || null);
  const { data: species } = useQuery<{ data: BioSpeciesTemplate[] }>({
    queryKey: ['bioSpeciesTemplateOptions'], queryFn: () => speciesTemplateServices.getList({ status: 'active', limit: 500 }), enabled: definition.filters.includes('species'),
  });

  const filters = (): ReportFilters => ({
    farm_id: farmId, from: from.format('YYYY-MM-DD HH:mm:ss'), to: to.endOf('day').format('YYYY-MM-DD HH:mm:ss'),
    group_id: groupId || undefined, species_template_id: speciesId || undefined, status: (status as string) || undefined, group_by: groupBy || undefined,
  });

  // Show the report as soon as the farm is known, then again whenever Run is pressed.
  useEffect(() => {
    if (!applied && farms?.data?.length) {
      const first = farms.data[0].id;
      setFarmId(first);
      setApplied({ ...filters(), farm_id: first });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farms]);

  const { data: table, isFetching, isError, error } = useQuery<ReportTable>({
    queryKey: ['bioReport', definition.id, applied],
    queryFn: () => reportServices.get(definition.id, applied),
    enabled: !!applied?.farm_id,
  });

  const labelOf = React.useCallback((column: ReportColumn) => {
    if (column.key === 'label' && groupBy) return dict.groupBy[groupBy as keyof typeof dict.groupBy] ?? column.label;

    return (dict.columns as Record<string, string>)[column.key] ?? column.label;
  }, [dict, groupBy]);

  const downloadExcel = async () => {
    setDownloading(true);
    try {
      const data = await reportServices.excel(definition.id, applied ?? filters());
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      link.download = `${card.title} ${dayjs().format('DD MMM YYYY HH:mm')}.xlsx`;
      link.click();
    } catch {
      enqueueSnackbar(dict.excelError, { variant: 'error' });
    } finally {
      setDownloading(false);
    }
  };

  const farmName = farms?.data?.find((farm) => farm.id === Number(applied?.farm_id))?.name ?? '';
  const filterLines = useMemo<[string, string][]>(() => {
    if (!applied) return [];
    const lines: [string, string][] = [[dict.filters.farm, farmName], [dict.filters.from, dayjs(applied.from).format('DD MMM YYYY')], [dict.filters.to, dayjs(applied.to).format('DD MMM YYYY')]];
    if (applied.group_id) lines.push([dict.filters.group, groups?.data?.find((group) => group.id === Number(applied.group_id))?.path ?? '']);
    if (applied.status) lines.push([dict.filters.status, dict.status[applied.status as 'open' | 'closed']]);
    if (applied.group_by) lines.push([dict.filters.groupBy, dict.groupBy[applied.group_by as keyof typeof dict.groupBy]]);

    return lines;
  }, [applied, farmName, groups, dict]);
  const notes = (dict.notes as Record<string, string[]>)[definition.id] ?? [];

  return (
    <>
      <DialogTitle sx={{ pr: 6 }}>
        <Stack direction='row' alignItems='center'>
          <Typography variant='h5' component='div' mb={0}>{card.title}</Typography>
          <InfoHint text={card.description} />
        </Stack>
        <IconButton aria-label='close' onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseOutlined /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Box component='form' onSubmit={(event) => { event.preventDefault(); setShowPdf(false); setApplied(filters()); }} sx={{ pt: 1 }}>
          <Grid container spacing={1.5} alignItems='center'>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <BioSelect required label={dict.filters.farm} loading={loadingFarms} options={(farms?.data ?? []).map((farm) => ({ value: farm.id, label: farm.name }))} value={farmId} onChange={(value) => { setFarmId(value); setGroupId(''); }} />
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <DatePicker label={dict.filters.from} value={from} onChange={(value) => value && setFrom(value)} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <DatePicker label={dict.filters.to} value={to} onChange={(value) => value && setTo(value)} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
            </Grid>
            {definition.filters.includes('group') && (
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <BioSelect label={dict.filters.group} disabled={!farmId} options={unitGroupOptions(groups?.data)} value={groupId} onChange={setGroupId} />
              </Grid>
            )}
            {definition.filters.includes('species') && (
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <BioSelect label={dict.filters.species} options={(species?.data ?? []).map((item) => ({ value: item.id, label: item.name }))} value={speciesId} onChange={setSpeciesId} />
              </Grid>
            )}
            {definition.filters.includes('status') && (
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <BioSelect label={dict.filters.status} options={[{ value: 'open', label: dict.status.open }, { value: 'closed', label: dict.status.closed }]} value={status} onChange={setStatus} />
              </Grid>
            )}
            {definition.groupBy && (
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <BioSelect required label={dict.filters.groupBy} options={definition.groupBy.map((by) => ({ value: by, label: dict.groupBy[by as keyof typeof dict.groupBy] }))} value={groupBy} onChange={(value) => setGroupBy(String(value))} />
              </Grid>
            )}
            <Grid size={12}>
              <Stack direction='row' spacing={0.75} flexWrap='wrap' useFlexGap alignItems='center' justifyContent='space-between'>
                <Stack direction='row' spacing={0.5} flexWrap='wrap' useFlexGap>
                  {PRESETS.map((preset) => (
                    <Chip key={preset} size='small' variant='outlined' clickable label={dict.presets[preset]} onClick={() => { const range = presetRange(preset); setFrom(range.from); setTo(range.to); }} />
                  ))}
                </Stack>
                <Stack direction='row' spacing={0.75} alignItems='center'>
                  {table && table.rows.length > 0 && (
                    <FileExportGrid exportExcel exportPdf handlePdf={() => setShowPdf((shown) => !shown)} handlExcelExport={downloadExcel} exportingExcel={downloading} />
                  )}
                  <LoadingButton type='submit' size='small' variant='contained' loading={isFetching}>{dict.run}</LoadingButton>
                </Stack>
              </Stack>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ mt: 2 }}>
          {isFetching && <LinearProgress />}
          {isError && <Alert severity='error'>{getErrorMessage(error)}</Alert>}
          {table && !isFetching && showPdf && table.rows.length > 0 && user && (
            <PDFContent
              document={<BioReportPdf table={table} title={card.title} filterLines={filterLines} labelOf={labelOf} notes={notes} authOrganization={authOrganization} user={user} dict={{ printedBy: dict.printedBy, printedOn: dict.printedOn, total: dict.total, summary: dict.summary, page: dict.page, preparedBy: dict.preparedBy, verifiedBy: dict.verifiedBy, approvedBy: dict.approvedBy, signature: dict.signature }} />}
              fileName={`${card.title} ${dayjs().format('DD MMM YYYY')}`}
            />
          )}
          {table && !isFetching && !showPdf && (
            <>
              <ReportTableView table={table} labelOf={labelOf} totalLabel={dict.total} emptyText={dict.noData}
                linkOf={(row, column) => (row.batch_id && (column.key === 'batch' || column.key === 'label') ? `/${lang}/bioProduction/batches/${row.batch_id}` : null)} />
              {notes.map((note) => (
                <Typography key={note} variant='caption' color='text.secondary' display='block' sx={{ mt: 1 }}>{note}</Typography>
              ))}
            </>
          )}
        </Box>
      </DialogContent>
    </>
  );
};

export default ReportViewer;
