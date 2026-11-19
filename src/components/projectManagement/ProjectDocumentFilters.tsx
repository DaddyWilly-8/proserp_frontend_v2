'use client';

import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import RequisitionsWaitingForSelector from '@/components/processApproval/RequisitionsWaitingForSelector';
import { FilterAltOffOutlined, FilterAltOutlined } from '@mui/icons-material';
import {
  Autocomplete,
  Chip,
  Grid,
  IconButton,
  TextField,
  Tooltip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { Dayjs } from 'dayjs';
import React from 'react';

export const DOCUMENT_STATUSES = [
  'draft',
  'in_review',
  'returned',
  'rejected',
  'approved',
  'invoiced',
] as const;

export interface DocumentFilters {
  statuses: string[];
  costCenters: CostCenter[];
  waitingFor: number | null;
  // Date range pickers are tucked behind a toggle (as on Requisitions); lives here so it survives toolbar re-renders.
  showDates: boolean;
  from: Dayjs | null;
  to: Dayjs | null;
}

export const EMPTY_DOCUMENT_FILTERS: DocumentFilters = {
  statuses: [],
  costCenters: [],
  waitingFor: null,
  showDates: false,
  from: null,
  to: null,
};

// What the backend list endpoints take: status/cost_center_ids comma-separated (the Next proxy copies
// query params with set(), so repeated keys would be lost), dates as YYYY-MM-DD. Undefined = no filter.
export const documentFiltersToQueryParams = (filters: DocumentFilters) => ({
  status: filters.statuses.length ? filters.statuses.join(',') : undefined,
  cost_center_ids: filters.costCenters.length
    ? filters.costCenters.map((c) => c.id).join(',')
    : undefined,
  next_approval_role_id: filters.waitingFor ?? undefined,
  from: filters.from ? filters.from.format('YYYY-MM-DD') : undefined,
  to: filters.to ? filters.to.format('YYYY-MM-DD') : undefined,
});

interface ProjectDocumentFiltersProps {
  // Controlled: the page owns the state, so selections survive the list re-rendering its toolbar.
  value: DocumentFilters;
  onChange: (filters: DocumentFilters) => void;
}

// Status, cost center and date filters shared by the org-wide Subcontract Certificates and Project
// Payment Claims lists. Renders Grid items meant to sit inside the list toolbar's action
// <Grid container>, like the Requisitions page's inline filters.
const ProjectDocumentFilters: React.FC<ProjectDocumentFiltersProps> = ({
  value,
  onChange,
}) => {
  const dictionary = useDictionary();
  const t = dictionary.projectManagement.documentFilters;
  const { authOrganization } = useJumboAuth();
  // Both documents belong to a project, so only project cost centers are relevant. Offer the filter
  // once there's more than one of them to choose between.
  const multiCostCenters =
    (authOrganization?.costCenters ?? []).filter(
      (costCenter: CostCenter) => costCenter.type === 'Project'
    ).length > 1;
  const statusLabel = (status: string): string =>
    (t.statuses as Record<string, string>)[status] ?? status;

  const toggleDates = () =>
    onChange(
      value.showDates
        ? { ...value, showDates: false, from: null, to: null }
        : { ...value, showDates: true }
    );

  // Same arrangement as the Requisitions toolbar: the date row (when opened) on top, then
  // status / waiting for / cost center, then the filter toggle.
  return (
    <>
      {value.showDates && (
        <Grid size={{ xs: 12 }}>
          <Grid container spacing={1}>
            <Grid size={{ xs: 12, md: 6 }}>
              <DatePicker
                label={t.from}
                value={value.from}
                maxDate={value.to ?? undefined}
                format='DD/MM/YYYY'
                onChange={(from: Dayjs | null) =>
                  onChange({
                    ...value,
                    from: from && from.isValid() ? from : null,
                  })
                }
                slotProps={{
                  textField: { size: 'small', fullWidth: true },
                  field: { clearable: true },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <DatePicker
                label={t.to}
                value={value.to}
                minDate={value.from ?? undefined}
                format='DD/MM/YYYY'
                onChange={(to: Dayjs | null) =>
                  onChange({ ...value, to: to && to.isValid() ? to : null })
                }
                slotProps={{
                  textField: { size: 'small', fullWidth: true },
                  field: { clearable: true },
                }}
              />
            </Grid>
          </Grid>
        </Grid>
      )}
      <Grid
        size={{
          xs: 12,
          md: multiCostCenters ? 3.5 : 6,
          lg: multiCostCenters ? 4 : 6,
        }}
      >
        <Autocomplete
          multiple
          size='small'
          options={[...DOCUMENT_STATUSES] as string[]}
          value={value.statuses}
          getOptionLabel={statusLabel}
          onChange={(_, statuses) => onChange({ ...value, statuses })}
          renderTags={(tags, getTagProps) =>
            tags.map((status, index) => {
              const { key, ...tagProps } = getTagProps({ index });
              return (
                <Chip
                  key={key}
                  size='small'
                  label={statusLabel(status)}
                  {...tagProps}
                />
              );
            })
          }
          renderInput={(params) => <TextField {...params} label={t.status} />}
        />
      </Grid>
      <Grid
        size={{
          xs: multiCostCenters ? 12 : 11,
          md: multiCostCenters ? 3.5 : 5,
          lg: multiCostCenters ? 4 : 5.5,
        }}
        textAlign='center'
      >
        <RequisitionsWaitingForSelector
          value={value.waitingFor}
          onChange={(waitingFor) => onChange({ ...value, waitingFor })}
        />
      </Grid>
      {multiCostCenters && (
        <Grid size={{ xs: 11, md: 4, lg: 3.5 }}>
          <CostCenterSelector
            label={t.costCenters}
            allowSameType={true}
            onlyTypes={['Project']}
            defaultValue={value.costCenters}
            onChange={(selected: CostCenter | CostCenter[] | null) => {
              const costCenters = Array.isArray(selected)
                ? selected
                : selected
                  ? [selected]
                  : [];
              onChange({ ...value, costCenters });
            }}
          />
        </Grid>
      )}
      <Grid size={{ xs: 1, lg: 0.5 }}>
        <Tooltip title={value.showDates ? t.hideDates : t.filterDates}>
          <IconButton size='small' onClick={toggleDates}>
            {value.showDates ? <FilterAltOffOutlined /> : <FilterAltOutlined />}
          </IconButton>
        </Tooltip>
      </Grid>
    </>
  );
};

export default ProjectDocumentFilters;
