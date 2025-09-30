"use client";

import React from "react";
import { Grid, TextField, Button, IconButton, Box } from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import { useFieldArray, Controller, useFormContext } from "react-hook-form";
import * as yup from "yup";
import LedgerSelect from "@/components/accounts/ledgers/forms/LedgerSelect";
import { Station } from "./StationType";
import { useLedgerSelect } from "@/components/accounts/ledgers/forms/LedgerSelectProvider";

export const shiftSchema = yup.object({
  shifts: yup
    .array()
    .of(
      yup.object({
        name: yup.string().required("Team name is required"),
        ledger_ids: yup
          .array()
          .of(yup.number().required())
          .min(1)
          .required("At least one ledger is required"),
        description: yup.string().optional(),
      })
    )
    .min(1, "At least one shift is required"),
});

export type ShiftFormData = yup.InferType<typeof shiftSchema>;

interface ShiftTeamTabProps {
  station?: Station;
}

const ShiftTeamTab: React.FC<ShiftTeamTabProps> = ({ station }) => {
  const { control, formState: { errors } } = useFormContext<ShiftFormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "shifts",
    keyName: "id",
  });
  const { ledgerOptions, extractLedgers } = useLedgerSelect();
  const [ledgerList, setLedgerList] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (ledgerOptions) {
      extractLedgers(ledgerOptions, [], [], setLedgerList);
    }
  }, [ledgerOptions, extractLedgers]);

  const convertToLedgerObjects = (ledgerIds: number[]) => {
    if (!ledgerList || !ledgerIds.length) return [];
    return ledgerList.filter(ledger => ledgerIds.includes(ledger.id));
  };

  return (
    <Box sx={{ width: "100%" }}>
      {fields.map((field, index) => {
        const currentLedgerIds = field.ledger_ids || [];
        const ledgerObjects = convertToLedgerObjects(currentLedgerIds);

        return (
          <Grid container spacing={2} key={field.id} sx={{ mb: 2 }} alignItems="flex-start">
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
                    defaultValue={ledgerObjects}
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
                    rows={1}
                    error={!!errors.shifts?.[index]?.description}
                    helperText={errors.shifts?.[index]?.description?.message}
                  />
                )}
              />
            </Grid>
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
          onClick={() => append({ name: "", ledger_ids: [], description: "" })}
        >
          Add
        </Button>
      </Box>
    </Box>
  );
};

export default ShiftTeamTab;