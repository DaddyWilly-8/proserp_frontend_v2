"use client";

import React from "react";
import { Grid, TextField, Button, IconButton, Box } from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import { useFieldArray, Controller, useFormContext } from "react-hook-form";
import * as yup from "yup";
import LedgerSelect from "@/components/accounts/ledgers/forms/LedgerSelect";
import { Station } from "./StationType";
import { useLedgerSelect } from "@/components/accounts/ledgers/forms/LedgerSelectProvider";

export const shiftTeamSchema = yup.object({
  shift_teams: yup
    .array()
    .of(
      yup.object({
        name: yup.string().required("Team name is required"),
        ledger_ids: yup
          .array()
          .of(yup.number().required())
          .min(1, "At least one ledger is required")
          .required("At least one ledger is required"),
        description: yup.string().nullable().optional(),
      })
    )
});

export type ShiftFormData = yup.InferType<typeof shiftTeamSchema>;

interface ShiftTeamTabProps {
  station?: Station;
}

const ShiftTeamTab: React.FC<ShiftTeamTabProps> = ({ station }) => {
  const { control, formState: { errors }, watch } = useFormContext<ShiftFormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "shift_teams",
  });
  
  const { ungroupedLedgerOptions } = useLedgerSelect();

  // Watch the shift_teams array to get current values
  const shiftTeams = watch("shift_teams");

  const getFieldError = (index: number, fieldName: string) => {
    return (errors as any)?.shift_teams?.[index]?.[fieldName];
  };

  return (
    <Box sx={{ width: "100%" }}>
      {fields.map((field, index) => {
        // Get current ledger_ids for this specific field
        const currentLedgerIds = shiftTeams?.[index]?.ledger_ids || [];

        return (
          <Grid container spacing={2} key={field.id} sx={{ mb: 2 }} alignItems="flex-start">
            {/* Team Name - 4 columns */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name={`shift_teams.${index}.name`}
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value || ""}
                    fullWidth
                    label="Team Name"
                    size="small"
                    error={!!getFieldError(index, "name")}
                    helperText={getFieldError(index, "name")?.message}
                  />
                )}
              />
            </Grid>

            {/* Ledger Accounts - 4 columns - FIXED */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name={`shift_teams.${index}.ledger_ids`}
                control={control}
                render={({ field }) => (
                  <LedgerSelect
                    multiple
                    label="Ledger Accounts"
                    defaultValue={ungroupedLedgerOptions.filter(ledger => 
                      Array.isArray(currentLedgerIds) && currentLedgerIds.includes(ledger.id)
                    )}
                    onChange={(newValue) => {
                      if (Array.isArray(newValue)) {
                        field.onChange(newValue.map((v) => v.id));
                      } else {
                        field.onChange([]);
                      }
                    }}
                    frontError={getFieldError(index, "ledger_ids")}
                  />
                )}
              />
            </Grid>

            {/* Description - 3 columns */}
            <Grid size={{ xs: 12, md: 3 }}>
              <Controller
                name={`shift_teams.${index}.description`}
                control={control}
                defaultValue={null}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value || ""}
                    fullWidth
                    label="Description"
                    size="small"
                    multiline
                    rows={1}
                    placeholder="description"
                    error={!!getFieldError(index, "description")}
                    helperText={getFieldError(index, "description")?.message}
                    onChange={(e) => {
                      const value = e.target.value === "" ? null : e.target.value;
                      field.onChange(value);
                    }}
                  />
                )}
              />
            </Grid>

            {/* Delete Button - 1 column */}
            <Grid size={{ xs: 12, md: 1 }} sx={{ display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
              {fields.length > 1 && (
                <IconButton onClick={() => remove(index)} color="error" sx={{ mt: 0.5 }}>
                  <Delete />
                </IconButton>
              )}
            </Grid>
          </Grid>
        );
      })}
      
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Add />}
          onClick={() => append({ 
            name: "", 
            ledger_ids: [], 
            description: null
          })}
        >
          Add
        </Button>
      </Box>
    </Box>
  );
};

export default ShiftTeamTab;