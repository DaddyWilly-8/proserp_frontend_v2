'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';
import {
  Autocomplete,
  Box,
  Checkbox,
  Chip,
  LinearProgress,
  TextField,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import costCenterservices from './cost-center-services';
import { CostCenter } from './CostCenterType';

interface CostCenterSelectorProps {
  frontError?: { message?: string } | null;
  removedCostCenters?: number[];
  removedCostCentersIds?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  allowSameType?: boolean;
  label?: string;
  helperText?: string | null;
  multiple?: boolean;
  withNotSpecified?: boolean;
  defaultValue?: CostCenter | CostCenter[] | null;
  onChange?: (value: CostCenter | CostCenter[] | null) => void;
}

function CostCenterSelector(props: CostCenterSelectorProps) {
  const { authOrganization } = useJumboAuth();
  const {
    frontError = null,
    removedCostCenters = [],
    removedCostCentersIds = false,
    disabled = false,
    readOnly = false,
    allowSameType = false,
    label = 'Cost Center',
    helperText = null,
    multiple = true,
    withNotSpecified = false,
    defaultValue = null,
    onChange,
  } = props;

  type SelectedType = CostCenter[] | CostCenter | null;
  const [selectedItems, setSelectedItems] = useState<SelectedType>(
    defaultValue ?? (multiple ? [] : null)
  );

  useEffect(() => {
    if (defaultValue && Array.isArray(defaultValue) && defaultValue.length > 0)
      setSelectedItems(defaultValue);
    if (defaultValue && !Array.isArray(defaultValue))
      setSelectedItems(defaultValue);
  }, [defaultValue]);

  const { data: fetchedCostCenters, isLoading } = useQuery<CostCenter[]>({
    queryKey: ['allCostCenters'],
    queryFn: costCenterservices.getCostCenters,
    enabled: !!removedCostCentersIds,
  });

  // Helper function to create a "Not Specified" option
  const createNotSpecifiedOption = (): CostCenter => ({
    id: -1,
    name: 'Not Specified',
    code: null,
    description: null,
    status: 'active',
    type: 'Unassigned',
  });

  const authOrganizationCostCenters = authOrganization?.costCenters
    ? withNotSpecified
      ? [createNotSpecifiedOption(), ...authOrganization.costCenters]
      : authOrganization.costCenters
    : withNotSpecified
      ? [createNotSpecifiedOption()]
      : [];

  const allCostCenters = fetchedCostCenters
    ? withNotSpecified
      ? [createNotSpecifiedOption(), ...fetchedCostCenters]
      : fetchedCostCenters
    : withNotSpecified
      ? [createNotSpecifiedOption()]
      : [];

  // Filter out removed cost centers
  const filteredCostCenters = (costCenters: CostCenter[]) =>
    costCenters.filter(
      (center) => !removedCostCenters.some((removed) => removed === center.id)
    );

  // Projects (and Sales Outlets/Fuel Stations/Work Centers) auto-create a
  // matching cost center each — on an org with many projects these can
  // heavily outnumber the manually-created ones a user is actually looking
  // for. Grouping by type (with manual cost centers first, Projects last,
  // since they're typically the most numerous and least relevant for a
  // company-wide report) keeps the real ones easy to spot instead of buried
  // in a long flat list. MUI's groupBy requires the options themselves to
  // already be sorted the same way, or group headers repeat.
  //
  // A cost center with no cost_centerable link (created directly, not by a
  // Project/Sales Outlet) isn't a "Department" just because it wasn't
  // auto-generated — it may be named anything (e.g. "NYANZA PROJECT" with no
  // actual Project behind it). "Unspecified" is the honest label, and it's
  // also what the synthetic "Not Specified" placeholder option (type
  // 'Unassigned', from withNotSpecified) means — grouping both under the
  // same header avoids two near-identical-sounding groups ("Unassigned" vs
  // "Unspecified") side by side.
  const groupOrder: Record<string, number> = {
    Unassigned: -1, // "Not Specified" placeholder option
    '': 0, // no cost_centerable link
    'Work Center': 1,
    'Sales Outlet': 2,
    'Fuel Station': 3,
    Project: 4,
  };
  const groupRank = (type: string) =>
    groupOrder[type] ?? Object.keys(groupOrder).length;
  const groupLabel = (type: string) =>
    !type || type === 'Unassigned' ? 'Unspecified' : type;

  const sortByGroup = (costCenters: CostCenter[]) =>
    [...costCenters].sort((a, b) => groupRank(a.type) - groupRank(b.type));

  const finalCostCenters = sortByGroup(
    removedCostCentersIds
      ? filteredCostCenters(allCostCenters)
      : filteredCostCenters(authOrganizationCostCenters)
  );

  const handleOnChange = (
    event: React.SyntheticEvent,
    newValue: CostCenter | CostCenter[] | null
  ) => {
    if (!allowSameType && multiple && Array.isArray(newValue)) {
      const uniqueTypes = Array.from(
        new Set(newValue.map((item) => item.type))
      );
      if (uniqueTypes.length !== newValue.length) {
        newValue = newValue.filter(
          (item, index, arr) =>
            arr.findIndex((i) => i.type === item.type) === index
        );
      }
    }

    setSelectedItems(newValue);
    onChange?.(newValue);
  };

  if (isLoading) {
    return <LinearProgress />;
  }

  return (
    <Box sx={{ minWidth: 150 }}>
      <Autocomplete
        multiple={multiple}
        options={finalCostCenters}
        groupBy={(option: CostCenter) => groupLabel(option.type)}
        disabled={disabled}
        readOnly={readOnly}
        getOptionLabel={(option: CostCenter) => option.name}
        isOptionEqualToValue={(option: CostCenter, value: CostCenter) =>
          option.id === value.id
        }
        renderInput={(params) => (
          <TextField
            {...params}
            error={!!frontError}
            helperText={frontError?.message ?? helperText}
            fullWidth
            label={label}
            size='small'
            placeholder={label}
          />
        )}
        value={selectedItems}
        onChange={handleOnChange}
        renderTags={(tagValue: CostCenter[], getTagProps) => {
          return tagValue.map((option: CostCenter, index: number) => {
            const { key, ...restProps } = getTagProps({ index });
            return (
              <Chip
                {...restProps}
                key={`${option.id}-${key}`}
                label={option.name}
              />
            );
          });
        }}
        {...(multiple && {
          renderOption: (
            props: React.HTMLAttributes<HTMLLIElement> & { key?: React.Key }, // extend type to include key optionally
            option: CostCenter,
            { selected }
          ) => {
            const { key, ...otherProps } = props;

            return (
              <li key={option.id} {...otherProps}>
                <Checkbox
                  icon={<CheckBoxOutlineBlank fontSize='small' />}
                  checkedIcon={<CheckBox fontSize='small' />}
                  style={{ marginRight: 8 }}
                  checked={selected}
                />
                {option.name}
              </li>
            );
          },
        })}
      />
    </Box>
  );
}

export default CostCenterSelector;
