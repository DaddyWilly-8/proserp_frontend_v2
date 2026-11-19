'use client';

import React from 'react';
import {
  Autocomplete,
  Chip,
  Grid,
  IconButton,
  TextField,
  Tooltip,
} from '@mui/material';
import { FilterAltOffOutlined } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { Dayjs } from 'dayjs';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';

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
  from: Dayjs | null;
  to: Dayjs | null;
}

export const EMPTY_DOCUMENT_FILTERS: DocumentFilters = {
  statuses: [],
  costCenters: [],
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

  // CostCenterSelector only applies a non-empty defaultValue, so clearing means remounting it.
  const [selectorKey, setSelectorKey] = React.useState(0);

  const hasFilters =
    value.statuses.length > 0 ||
    value.costCenters.length > 0 ||
    !!value.from ||
    !!value.to;

  const handleClear = () => {
    setSelectorKey((key) => key + 1);
    onChange(EMPTY_DOCUMENT_FILTERS);
  };

  return (
    <>
      <Grid size={{ xs: 12, md: 6, lg: 3 }}>
        <Autocomplete
          multiple
          size="small"
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
                  size="small"
                  label={statusLabel(status)}
                  {...tagProps}
                />
              );
            })
          }
          renderInput={(params) => <TextField {...params} label={t.status} />}
        />
      </Grid>
      {multiCostCenters && (
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <CostCenterSelector
            key={selectorKey}
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
      <Grid size={{ xs: 12, md: 6, lg: 3 }}>
        <DatePicker
          label={t.from}
          value={value.from}
          maxDate={value.to ?? undefined}
          format="DD/MM/YYYY"
          onChange={(from: Dayjs | null) =>
            onChange({ ...value, from: from && from.isValid() ? from : null })
          }
          slotProps={{
            textField: { size: 'small', fullWidth: true },
            field: { clearable: true },
          }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 3 }}>
        <DatePicker
          label={t.to}
          value={value.to}
          minDate={value.from ?? undefined}
          format="DD/MM/YYYY"
          onChange={(to: Dayjs | null) =>
            onChange({ ...value, to: to && to.isValid() ? to : null })
          }
          slotProps={{
            textField: { size: 'small', fullWidth: true },
            field: { clearable: true },
          }}
        />
      </Grid>
      <Grid size={{ xs: 1, lg: 0.5 }}>
        <Tooltip title={t.clearFilters}>
          <span>
            <IconButton size="small" disabled={!hasFilters} onClick={handleClear}>
              <FilterAltOffOutlined />
            </IconButton>
          </span>
        </Tooltip>
      </Grid>
    </>
  );
};

export default ProjectDocumentFilters;
