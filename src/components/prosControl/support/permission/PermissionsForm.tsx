"use client";

import React, { useContext, useMemo } from "react";
import * as yup from "yup";
import { useFieldArray, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Button,
  Checkbox,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { AddOutlined, DisabledByDefault } from "@mui/icons-material";
import { useSnackbar } from "notistack";
import { LoadingButton } from "@mui/lab";
import supportServices from "../support-services";
import { SelectedTab } from "../troubleshooting/Troubleshooting";
import PermissionModulesSelector from "./PermissionModulesSelector";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Div } from "@jumbo/shared";
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

// ---- Types ----
export interface Permission {
  id: string | number;
  name: string;
  description?: string;
  is_core?: boolean;
  modules?: { id: string | number; name: string }[];
}

interface PermissionsFormProps {
  permission?: Permission;
  setOpenDialog: (open: boolean) => void;
}

interface PermissionFormItem {
  name: string;
  description: string;
  is_core?: boolean;
  module_ids?: (string | number)[] | null;
}

interface PermissionsFormData {
  id?: string | number;
  permissions: PermissionFormItem[];
}

const PermissionsForm: React.FC<PermissionsFormProps> = ({
  permission,
  setOpenDialog,
}) => {
  const dictionary = useDictionary();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { activeTab } = useContext(SelectedTab);
  const isOrganizationPermission = activeTab === 1;

  // ---- Mutations (React Query v5) ----
  const addPermission = useMutation({
    mutationFn: isOrganizationPermission
      ? supportServices.addPermission
      : supportServices.addProsPermission,
    onSuccess: (data: any) => {
      enqueueSnackbar(data.message, { variant: "success" });
      queryClient.invalidateQueries({
        queryKey: [
          isOrganizationPermission ? "organizationPermissions" : "prosPermissions",
        ],
      });
      setOpenDialog(false);
    },
    onError: (error: any) => {
      error?.response?.data?.message &&
        enqueueSnackbar(error.response.data.message, { variant: "error" });
    },
  });

  const updatePermission = useMutation({
    mutationFn: isOrganizationPermission
      ? supportServices.updatePermission
      : supportServices.updateProsPermission,
    onSuccess: (data: any) => {
      enqueueSnackbar(data.message, { variant: "success" });
      queryClient.invalidateQueries({
        queryKey: [
          isOrganizationPermission ? "organizationPermissions" : "prosPermissions",
        ],
      });
      setOpenDialog(false);
    },
    onError: (error: any) => {
      enqueueSnackbar(error.response.data.message, { variant: "error" });
    },
  });

  // ---- Validation ----
  const validationSchema = yup.object({
    permissions: yup.array().of(
      yup.object().shape({
        name: yup
          .string()
          .required(dictionary.forms.support.permissions.errors.nameRequired)
          .typeError(dictionary.forms.support.permissions.errors.nameRequired),
        is_core: yup.boolean(),
        module_ids: yup.array().when(["is_core"], {
          is: (is_core: boolean) => isOrganizationPermission && !is_core,
          then: (schema) =>
            schema
              .required(dictionary.forms.support.permissions.errors.modulesRequired)
              .min(1, dictionary.forms.support.permissions.errors.modulesRequired)
              .typeError(dictionary.forms.support.permissions.errors.modulesRequired),
          otherwise: (schema) => schema.nullable(),
        }),
      })
    ),
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<PermissionsFormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: permission?.id,
      permissions: [
        isOrganizationPermission
          ? {
              name: permission ? permission.name : "",
              description: permission ? permission.description : "",
              is_core: permission ? !!permission.is_core : false,
              module_ids: permission
                ? permission.modules?.map((module) => module.id) ?? []
                : null,
            }
          : {
              name: permission ? permission.name : "",
              description: permission ? permission.description : "",
            },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "permissions",
  });

  const saveMutation = useMemo(
    () => (permission ? updatePermission : addPermission),
    [permission, addPermission, updatePermission]
  );

  const onSubmit = handleSubmit((data) => {
    if (permission) {
      // Flatten structure for update
      const updatedPermission = {
        id: permission.id,
        ...data.permissions[0],
      };
      saveMutation.mutate(updatedPermission);
    } else {
      saveMutation.mutate(data);
    }
  });

  return (
    <>
      <DialogTitle>
        <Grid size={{ xs: 12 }} textAlign="center">
          {!permission
            ? isOrganizationPermission
              ? dictionary.forms.support.permissions.titles.newOrganization
              : dictionary.forms.support.permissions.titles.newPros
            : dictionary.forms.support.permissions.titles.edit.replace('{name}', String(permission.name))}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form id="permissions-form" autoComplete="off" onSubmit={onSubmit}>
          <Grid container columnSpacing={1}>
            <Grid size={{ xs: 12 }}>
              {fields.map((field, index) => (
                <React.Fragment key={field.id}>
                  <Grid container columnSpacing={1}>
                    {/* Name */}
                    <Grid
                      size={{
                        xs: 10,
                        md: isOrganizationPermission ? 3.5 : 5,
                        lg: isOrganizationPermission ? 3 : 5,
                      }}
                    >
                      <Div sx={{ mt: 1, mb: 1 }}>
                        <TextField
                          label={dictionary.forms.support.permissions.labels.name}
                          fullWidth
                          size="small"
                          error={!!errors?.permissions?.[index]?.name}
                          helperText={errors?.permissions?.[index]?.name?.message}
                          onChange={(e) =>
                            setValue(`permissions.${index}.name`, e.target.value, {
                              shouldValidate: true,
                              shouldDirty: true,
                            })
                          }
                          value={watch(`permissions.${index}.name`)}
                        />
                      </Div>
                    </Grid>

                    {/* Core Checkbox */}
                    {isOrganizationPermission && (
                      <Grid size={{ xs: 2, md: 1.5 }}>
                        <Stack
                          direction="row-reverse"
                          paddingLeft={1}
                          justifyContent="center"
                          alignItems="center"
                        >
                          <Typography>{dictionary.forms.support.permissions.labels.core}</Typography>
                          <Checkbox
                            size="small"
                            checked={watch(`permissions.${index}.is_core`)}
                            onChange={(e) =>
                              setValue(`permissions.${index}.is_core`, e.target.checked, {
                                shouldDirty: true,
                                shouldValidate: true,
                              })
                            }
                          />
                        </Stack>
                      </Grid>
                    )}

                    {/* Modules Selector */}
                    {isOrganizationPermission && (
                      <Grid size={{ xs: 12, md: 3, lg: 2.5 }}>
                        {!watch(`permissions.${index}.is_core`) && (
                          <Div sx={{ mt: 1, mb: 1 }}>
                            <PermissionModulesSelector
                              label={dictionary.forms.support.permissions.labels.modules}
                              multiple
                              defaultValue={watch(`permissions.${index}.module_ids`)}
                              frontError={
                                errors?.permissions?.[index]?.module_ids
                                  ? { message: errors.permissions[index].module_ids.message } as any
                                  : null
                              }
                              onChange={(newValue: any) =>
                                setValue(
                                  `permissions.${index}.module_ids`,
                                  newValue ? newValue.map((module: { id: string | number; name: string }) => module.id) : [],
                                  { shouldDirty: true, shouldValidate: true }
                                )
                              }
                            />
                          </Div>
                        )}
                      </Grid>
                    )}

                    {/* Description */}
                    <Grid
                      size={{
                        xs: fields.length > 1 ? 10 : 12,
                        md:
                          fields.length > 1 && isOrganizationPermission
                            ? 3
                            : fields.length === 1 && isOrganizationPermission
                            ? 4
                            : 6,
                        lg:
                          fields.length > 1 && isOrganizationPermission
                            ? 4
                            : fields.length === 1 && isOrganizationPermission
                            ? 5
                            : 6,
                      }}
                    >
                      <Div sx={{ mt: 1, mb: 1 }}>
                        <TextField
                          label={dictionary.forms.support.permissions.labels.description}
                          fullWidth
                          size="small"
                          {...register(`permissions.${index}.description`)}
                        />
                      </Div>
                    </Grid>

                    {/* Remove button */}
                    {fields.length > 1 && (
                      <Grid size={{ xs: 2, md: 1 }} textAlign="right">
                        <Div sx={{ mt: 1, mb: 1 }}>
                          <Tooltip title={dictionary.tooltips.removeItem}>
                            <IconButton size="small" onClick={() => remove(index)}>
                              <DisabledByDefault fontSize="small" color="error" />
                            </IconButton>
                          </Tooltip>
                        </Div>
                      </Grid>
                    )}
                  </Grid>
                  <Divider />
                </React.Fragment>
              ))}

              {/* Add button */}
              {!permission && (
                <Grid
                  size={{ xs: 12 }}
                  sx={{ display: "flex", justifyContent: "flex-end" }}
                >
                  <Div sx={{ mt: 1, mb: 1 }}>
                    <Tooltip title={dictionary.tooltips.addPermission}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() =>
                          append(
                            isOrganizationPermission
                              ? { name: "", description: "", is_core: false, module_ids: null }
                              : { name: "", description: "" }
                          )
                        }
                      >
                        <AddOutlined fontSize="small" /> {dictionary.forms.support.permissions.buttons.add}
                      </Button>
                    </Tooltip>
                  </Div>
                </Grid>
              )}
            </Grid>
          </Grid>
        </form>
      </DialogContent>

      {/* Actions */}
      <Grid size={{ xs: 12 }} textAlign="end">
        <DialogActions>
          <Button size="small" onClick={() => setOpenDialog(false)}>
            {dictionary.forms.support.permissions.buttons.cancel}
          </Button>
          <LoadingButton
            loading={addPermission.isPending || updatePermission.isPending}
            variant="contained"
            size="small"
            type="submit"
            form="permissions-form"
          >
            {dictionary.forms.support.permissions.buttons.submit}
          </LoadingButton>
        </DialogActions>
      </Grid>
    </>
  );
};

export default PermissionsForm;
