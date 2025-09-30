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
import { shiftSchema } from "./ShiftTeamTab";
import { fuelPumpSchema } from "./FuelPumpTab";

interface StationFormProps {
  station?: Station;
  setOpenDialog: (open: boolean) => void;
}

interface FormData {
  id?: number;
  name: string;
  address?: string;
  users: User[];
  shifts: yup.InferType<typeof shiftSchema>["shifts"];
  fuel_pumps: yup.InferType<typeof fuelPumpSchema>["fuel_pumps"];
}

const validationSchema = yup.object({
  name: yup.string().required("Station name is required"),
  address: yup.string().optional(),
  users: yup.array().optional(),
  shifts: yup.array().of(
    yup.object({
      name: yup.string().required("Team name is required"),
      ledger_ids: yup.array().of(yup.number()).min(1, "At least one ledger is required"),
      description: yup.string().optional(),
    })
  ),
  fuel_pumps: yup.array().of(
    yup.object({
      product_id: yup.number().required("Fuel name is required"),
      name: yup.string().required("Pump name is required"),
      tank_id: yup.number().required("Tank name is required"),
    })
  ),
});

const StationForm: React.FC<StationFormProps> = ({ station, setOpenDialog }) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { checkOrganizationPermission } = useJumboAuth();
  const canCreateOrEdit = checkOrganizationPermission([
    PERMISSIONS.FUEL_STATIONS_CREATE,
    PERMISSIONS.FUEL_STATIONS_UPDATE,
  ]);

const methods = useForm<FormData>({
  defaultValues: {
    id: station?.id,
    name: station?.name ?? "",
    address: station?.address ?? "",
    users: station?.users ?? [],
    // Start with one valid shift instead of potentially empty ones
    shifts: station?.shifts?.length ? station.shifts : [{ name: "", ledger_ids: [], description: "" }],
    // Start with one valid fuel pump instead of potentially empty ones
    fuel_pumps: station?.fuel_pumps?.length ? station.fuel_pumps.map(fp => ({
      product_id: fp.product_id === null ? undefined : fp.product_id,
      name: fp.name,
      tank_id: fp.tank_id === null ? undefined : fp.tank_id,
    })) : [{ product_id: undefined, name: "", tank_id: undefined }],
  },
  resolver: yupResolver(validationSchema) as any,
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
  // Filter out invalid shifts (empty names or no ledger_ids)
  const validShifts = formData.shifts
    ?.filter(shift => shift.name?.trim() && shift.ledger_ids?.length > 0)
    ?.map(shift => ({
      name: shift.name,
      ledger_ids: shift.ledger_ids,
    })) || [];

  // Filter out invalid fuel pumps (empty names or null IDs)
  const validFuelPumps = formData.fuel_pumps
    ?.filter(pump => pump.name?.trim() && pump.tank_id && pump.product_id)
    ?.map(pump => ({
      name: pump.name,
      tank_id: pump.tank_id,
      product_id: pump.product_id,
      // No extra fields like fuelName, unit_id, tankName
    })) || [];

  const dataToSend = {
    name: formData.name,
    user_ids: formData.users?.map((user: User) => user.id) ?? [],
    shifts: validShifts,
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
          <StationTabs station={station} /> {/* ✅ now hooked to root form */}
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
