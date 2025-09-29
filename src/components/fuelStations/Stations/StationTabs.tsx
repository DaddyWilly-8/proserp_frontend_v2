"use client";

import React, { useState, useEffect } from "react";
import { Divider, Grid, Tab, Tabs, useMediaQuery } from "@mui/material";
import { useJumboAuth } from "@/app/providers/JumboAuthProvider";
import { PERMISSIONS } from "@/utilities/constants/permissions";
import ShiftTeamTab, { shiftSchema, ShiftFormData } from "./ShiftTeamTab";
import FuelPumpTab, { fuelPumpSchema } from "./FuelPumpTab";
import { Station } from "./StationType";
import { useJumboTheme } from "@jumbo/components/JumboTheme/hooks";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

// Combine schemas for ShiftTeamTab and FuelPumpTab
const combinedSchema = yup.object({
  shifts: shiftSchema.fields.shifts,
  fuel_pumps: fuelPumpSchema.fields.fuel_pumps,
});

// Define the combined form data type
type FormData = yup.InferType<typeof combinedSchema>;

interface StationTabsProps {
  station?: Station;
}

const StationTabs: React.FC<StationTabsProps> = ({ station }) => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [persistedFormData, setPersistedFormData] = useState<FormData | null>(null);
  const { checkOrganizationPermission } = useJumboAuth();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down("lg"));
  const canCreateOrEdit = checkOrganizationPermission([
    PERMISSIONS.FUEL_STATIONS_CREATE,
    PERMISSIONS.FUEL_STATIONS_UPDATE,
  ]);

  // Initialize the form with combined schema and default values
  const methods = useForm<FormData>({
    resolver: yupResolver(combinedSchema as any),
    defaultValues: {
      shifts: station?.shifts || [{ name: "", ledger_ids: [], description: "" }],
      fuel_pumps: station?.fuel_pumps || [{ product_id: null, name: "", tank_id: null }],
    },
  });

  const { reset, formState: { errors } } = methods;

  // Restore persisted form data on mount
  useEffect(() => {
    if (persistedFormData) {
      reset(persistedFormData);
    }
  }, [persistedFormData, reset]);

  // Handle form submission (kept for internal use if needed)
  const onSubmit = (data: FormData) => {
    console.log("Form Data:", data);
    // Persist form data
    setPersistedFormData(data);
    // Replace with your API call or submission logic
  };

  return (
    <FormProvider {...methods}>
      <Grid size={12}>
        <Divider />
        <Tabs
          value={activeTab}
          onChange={(e, newValue: number) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          <Tab label="Shift Team" />
          <Tab label="Fuel Pump" />
        </Tabs>
      </Grid>
      <Grid container sx={{ width: "100%", mt: 2 }}>
        <Grid size={12} sx={{ display: activeTab === 0 ? "block" : "none" }}>
          <ShiftTeamTab station={station} />
        </Grid>
        <Grid size={12} sx={{ display: activeTab === 1 ? "block" : "none" }}>
          <FuelPumpTab station={station} />
        </Grid>
      </Grid>
      
      {/* Debugging: Display form errors */}
      {Object.keys(errors).length > 0 && (
        <Grid container sx={{ mt: 2 }}>
          <Grid size={12}>
            <pre>{JSON.stringify(errors, null, 2)}</pre>
          </Grid>
        </Grid>
      )}
    </FormProvider>
  );
};

export default StationTabs;