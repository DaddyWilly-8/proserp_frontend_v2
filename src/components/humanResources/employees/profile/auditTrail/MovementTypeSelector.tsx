'use client';

import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface MovementTypeSelectorProps {
  onChange: (value: string) => void;
  value: string;
}

const MovementTypeSelector = ({ onChange, value }: MovementTypeSelectorProps) => {
  const dictionary = useDictionary();
  const MOVEMENT_TYPES = [
    { value: 'all', label: dictionary.humanResources.auditTrail.movementTypes.all },
    { value: 'cost_center', label: dictionary.humanResources.auditTrail.movementTypes.cost_center },
    { value: 'department', label: dictionary.humanResources.auditTrail.movementTypes.department },
    { value: 'manager', label: dictionary.humanResources.auditTrail.movementTypes.manager },
  ];
  const [selectedType, setSelectedType] = useState(value || 'all');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (value !== undefined && value !== selectedType) {
      setSelectedType(value);
    }
  }, [value]);

  const debouncedOnChange = useCallback((newValue: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
    }, 200);
  }, [onChange]);

  const handleChange = useCallback((event: any) => {
    const newValue = event.target.value;
    setSelectedType(newValue);
    debouncedOnChange(newValue);
  }, [debouncedOnChange]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <Box sx={{ minWidth: 100 }}>
      <FormControl fullWidth size="small">
        <InputLabel id="movement-type-select-label">{dictionary.humanResources.auditTrail.movementType}</InputLabel>
        <Select
          labelId="movement-type-select-label"
          id="movement-type-select"
          value={selectedType}
          label={dictionary.humanResources.auditTrail.movementType}
          onChange={handleChange}
        >
          {MOVEMENT_TYPES.map((type) => (
            <MenuItem key={type.value} value={type.value}>
              {type.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default MovementTypeSelector;