"use client";

import React, { useMemo } from "react";
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import UsersSelector from "@/components/sharedComponents/UsersSelector";
import StationTabs from "./StationTabs";
import stationServices from "./station-services";
import type { AddStationResponse, Station, UpdateStationResponse } from "./StationType";
import { useJumboAuth } from "@/app/providers/JumboAuthProvider";
import { PERMISSIONS } from "@/utilities/constants/permissions";
import { User } from "@/components/prosControl/userManagement/UserManagementType";

interface StationFormProps {
  station?: Station;
  setOpenDialog: (open: boolean) => void;
}
// Define proper interfaces for form data
interface ShiftTeamFormData {
  name: string;
  ledger_ids: number[];
  description?: string | null;
}

interface FuelPumpFormData {
  product_id: number | null;
  name: string;
  tank_id: number | null;
}

interface FormData {
  id?: number;
  name: string;
  address?: string;
  users: User[];
  shift_teams: ShiftTeamFormData[];
  fuel_pumps: FuelPumpFormData[];
}

// Unified validation schema
const validationSchema = yup.object({
  name: yup.string().required("Station name is required"),
  address: yup.string().nullable().optional(),
  users: yup.array().of(
    yup.object({
      id: yup.number().required(),
      name: yup.string().required(),
    })
  ).optional(),
  shift_teams: yup.array().of(
    yup.object({
      name: yup.string().required("Team name is required"),
      ledger_ids: yup.array()
        .of(yup.number().required())
        .min(1, "At least one ledger is required")
        .required("Ledger accounts are required"),
      description: yup.string().nullable().optional(),
    })
  ).min(1, "At least one shift team is required"),
  fuel_pumps: yup.array().of(
    yup.object({
      product_id: yup.number()
        .nullable()
        .required("Fuel name is required")
        .typeError("Fuel name is required"),
      name: yup.string().required("Pump name is required"),
      tank_id: yup.number()
        .nullable()
        .required("Tank name is required")
        .typeError("Tank name is required"),
    })
  ).min(1, "At least one fuel pump is required"),
});

const StationForm: React.FC<StationFormProps> = ({ station, setOpenDialog }) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { checkOrganizationPermission } = useJumboAuth();
  const canCreateOrEdit = checkOrganizationPermission([
    PERMISSIONS.FUEL_STATIONS_CREATE,
    PERMISSIONS.FUEL_STATIONS_UPDATE,
  ]);

  // Proper default values with fallbacks
  const defaultValues = useMemo(() => {
    return {
      id: station?.id,
      name: station?.name ?? "",
      address: station?.address ?? "",
      users: station?.users ?? [],
      // Ensure at least one valid shift team
      shift_teams: station?.shift_teams?.length ? station.shift_teams.map(team => ({
        name: team.name || "",
        ledger_ids: team.ledger_ids || [],
        description: team.description || null,
      })) : [{ name: "", ledger_ids: [], description: null }],
      // Ensure at least one valid fuel pump
      fuel_pumps: station?.fuel_pumps?.length ? station.fuel_pumps.map(pump => ({
        product_id: pump.product_id ?? null,
        name: pump.name || "",
        tank_id: pump.tank_id ?? null,
      })) : [{ product_id: null, name: "", tank_id: null }],
    };
  }, [station]);

  const methods = useForm<FormData>({
    defaultValues,
    resolver: yupResolver(validationSchema)as any,
  });

  const { register, handleSubmit, control, formState: { errors } } = methods;

  const { mutate: addStation, isPending: addLoading } = useMutation<
    AddStationResponse,
    unknown,
    Station
  >({
    mutationFn: stationServices.add,
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["Station"] });
      setOpenDialog(false);
    },
    onError: (error: unknown) => {
      let message = "Something went wrong";
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as any).response?.data?.message === "string"
      ) {
        message = (error as any).response.data.message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      enqueueSnackbar(message, { variant: "error" });
    },
  });

  const { mutate: updateStation, isPending: updateLoading } = useMutation<
    UpdateStationResponse,
    unknown,
    Station & { id: number }
  >({
    mutationFn: stationServices.update,
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["Station"] });
      setOpenDialog(false);
    },
    onError: (error: unknown) => {
      let message = "Something went wrong";
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as any).response?.data?.message === "string"
      ) {
        message = (error as any).response.data.message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      enqueueSnackbar(message, { variant: "error" });
    },
  });

  const saveMutation = useMemo(
    () => (station?.id ? updateStation : addStation),
    [station, updateStation, addStation]
  );

  const onSubmit = (formData: FormData) => {
    // Filter out completely empty shift teams
    const validShifts = formData.shift_teams
      ?.filter(team => team.name?.trim() && team.ledger_ids?.length > 0)
      ?.map(team => ({
        name: team.name.trim(),
        ledger_ids: team.ledger_ids,
        description: team.description?.trim() || null,
      })) || [];

    // Filter out completely empty fuel pumps  
    const validFuelPumps = formData.fuel_pumps
      ?.filter(pump => pump.name?.trim() && pump.tank_id && pump.product_id)
      ?.map(pump => ({
        name: pump.name.trim(),
        tank_id: pump.tank_id,
        product_id: pump.product_id,
      })) || [];

    // Validate that we have at least one valid entry
    if (validShifts.length === 0) {
      enqueueSnackbar("At least one valid shift team is required", { variant: "error" });
      return;
    }

    if (validFuelPumps.length === 0) {
      enqueueSnackbar("At least one valid fuel pump is required", { variant: "error" });
      return;
    }

    const dataToSend = {
      name: formData.name.trim(),
      address: formData.address?.trim() || null,
      user_ids: formData.users?.map((user: User) => user.id) ?? [],
      shift_teams: validShifts,
      fuel_pumps: validFuelPumps,
      ...(station?.id ? { id: station.id } : {}),
    };

    console.log('Cleaned payload:', JSON.stringify(dataToSend, null, 2));
    
    saveMutation(dataToSend as any);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogTitle>
          <Grid container spacing={1}>
            <Grid size={12}>
              <Typography variant="h5" sx={{ textAlign: "center", mb: 2 }}>
                {station ? `Edit ${station.name}` : "New Fuel Station"}
              </Typography>
            </Grid>

            <Grid size={{xs:12, md:4}}>
              <TextField
                fullWidth
                label="Station Name"
                size="small"
                {...register("name")}
                error={!!errors.name}
                helperText={errors.name?.message}
                required
              />
            </Grid>

            <Grid size={{xs:12, md:4}}>
              <TextField
                fullWidth
                label="Address"
                size="small"
                {...register("address")}
                error={!!errors.address}
                helperText={errors.address?.message}
              />
            </Grid>

            <Grid size={{xs:12, md:4}}>
              <Controller
                name="users"
                control={control}
                render={({ field }) => (
                  <UsersSelector
                    multiple
                    defaultValue={field.value || []}
                    onChange={(users) => field.onChange(users || [])}
                    frontError={errors.users}
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogTitle>

        <DialogContent>
          <StationTabs station={station} />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} size="small">
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            variant="contained"
            size="small"
            loading={addLoading || updateLoading}
            disabled={!canCreateOrEdit}
          >
            Submit
          </LoadingButton>
        </DialogActions>
      </form>
    </FormProvider>
  );
};

export default StationForm;