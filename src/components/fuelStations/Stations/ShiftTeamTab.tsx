'use client';

import React from 'react';
import { Grid, TextField, Button, IconButton, Typography } from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { useFieldArray, Controller, useFormContext } from 'react-hook-form';
import * as yup from 'yup';
import LedgerSelectProvider from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import { Station, Shift } from './StationType';

// Validation schema for shifts
export const shiftSchema = yup.object({
  shifts: yup
    .array()
    .of(
      yup.object({
        name: yup.string().required('Team name is required'),
        ledger_ids: yup
          .array()
          .of(yup.number().required())
          .min(1, 'At least one ledger is required')
          .required('At least one ledger is required'),
        description: yup.string().optional(),
      })
    )
    .min(1, 'At least one shift is required'),
});

// Define the form data type
export type ShiftFormData = yup.InferType<typeof shiftSchema>;

interface ShiftTeamTabProps {
  station?: Station;
}

const ShiftTeamTab: React.FC<ShiftTeamTabProps> = ({ station }) => {
  const { control, formState: { errors } } = useFormContext<ShiftFormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'shifts',
  });

  return (
    <>
      <Grid container spacing={2}>
        <Grid size={12}>
          <Typography variant="h6">Shift Teams</Typography>
        </Grid>
        {fields.map((field, index) => (
          <Grid container spacing={1} key={field.id} sx={{ mb: 2 }} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name={`shifts.${index}.name`}
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Team Name"
                    size="small"
                    error={!!errors.shifts?.[index]?.name}
                    helperText={errors.shifts?.[index]?.name?.message}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name={`shifts.${index}.ledger_ids`}
                control={control}
                render={({ field }) => (
                  <LedgerSelect
                    multiple
                    label="Ledger Accounts"
                    defaultValue={station?.shifts?.[index]?.ledgers || []}
                    onChange={(val) => {
                      if (Array.isArray(val)) {
                        field.onChange(val.map((v) => v.id));
                      } else {
                        field.onChange([]);
                      }
                    }}
                    frontError={errors.shifts?.[index]?.ledger_ids}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Controller
                name={`shifts.${index}.description`}
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Description"
                    size="small"
                    multiline
                    rows={2}
                    error={!!errors.shifts?.[index]?.description}
                    helperText={errors.shifts?.[index]?.description?.message}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 1 }} sx={{ display: 'flex', alignItems: 'center' }}>
              {fields.length > 1 && (
                <IconButton onClick={() => remove(index)} color="error">
                  <Delete />
                </IconButton>
              )}
            </Grid>
          </Grid>
        ))}
        <Grid size={12} textAlign="end">
          <Button
            variant="outlined"
            size="small"
            startIcon={<Add />}
            onClick={() => append({ name: '', ledger_ids: [], description: '' })}
          >
            Add Shift Team
          </Button>
        </Grid>
      </Grid>
    </>
  );
};

export default ShiftTeamTab;