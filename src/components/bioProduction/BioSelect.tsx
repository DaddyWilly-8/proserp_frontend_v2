'use client'

import React from 'react';
import { Autocomplete, TextField, Typography } from '@mui/material';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

export interface BioOption {
  value: string | number;
  label: string;
  /** Shown but cannot be chosen. */
  disabled?: boolean;
  /** A short note under the label, e.g. who occupies a unit. */
  hint?: string;
}

interface BioSelectProps {
  label: string;
  options: BioOption[];
  value?: string | number | null;
  onChange: (value: string | number) => void;
  error?: boolean;
  helperText?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  /** A required choice cannot be cleared back to nothing. */
  required?: boolean;
}

/** The project's searchable single choice: type to filter, in place of a plain dropdown. */
const BioSelect = React.forwardRef<HTMLInputElement, BioSelectProps>(
  ({ label, options, value, onChange, error, helperText, disabled, loading, required }, ref) => (
    <Autocomplete
      size='small'
      fullWidth
      disabled={disabled}
      loading={loading}
      options={options}
      value={(options.find((option) => option.value === value) ?? null) as BioOption}
      getOptionLabel={(option) => option.label}
      getOptionDisabled={(option) => !!option.disabled}
      isOptionEqualToValue={(option, selected) => option.value === selected.value}
      // The cast only narrows the generic so the handler below receives a non-null option; the prop still
      // behaves as `required` says at runtime.
      disableClearable={!!required as true}
      onChange={(_, option) => onChange(option?.value ?? '')}
      renderOption={(props, option) => {
        const { key, ...rest } = props as React.HTMLAttributes<HTMLLIElement> & { key: string };

        return (
          <li key={key} {...rest}>
            <div>
              <div>{option.label}</div>
              {option.hint && <Typography variant='caption' color='text.secondary'>{option.hint}</Typography>}
            </div>
          </li>
        );
      }}
      renderInput={(params) => <TextField {...params} inputRef={ref} label={label} error={error} helperText={helperText} />}
    />
  )
);
BioSelect.displayName = 'BioSelect';

export const useStatusOptions = (): BioOption[] => {
  const common = useDictionary().bioProduction.common;

  return [
    { value: 'active', label: common.active },
    { value: 'inactive', label: common.inactive },
  ];
};

export default BioSelect;
