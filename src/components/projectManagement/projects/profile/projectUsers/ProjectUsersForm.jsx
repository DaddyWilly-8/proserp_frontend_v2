"use client";

import React, { useState } from "react";
import {
  Typography,
  Button,
  DialogContent,
  DialogActions,
  DialogTitle,
  Autocomplete,
  TextField,
  Checkbox,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import axios from "@/lib/services/config";
import UsersSelector from "@/components/sharedComponents/UsersSelector";
import { Div } from "@jumbo/shared";
import { LoadingButton } from "@mui/lab";
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useProjectProfile } from "../ProjectProfileProvider";

const ProjectUsersForm = ({ setOpenDialog }) => {
  const dictionary = useDictionary();
  const t = dictionary.forms.projects.projectUsers;
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { project } = useProjectProfile();
  const costCenterId = project?.cost_center?.id;
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // GET cost center users
  const costCenterUsersQuery = useQuery({
    enabled: !!costCenterId,
    queryKey: ["cost-center-users", costCenterId],
    queryFn: async () => {
      const data = await axios.get(
        `/api/accountsAndFinance/cost-centers/${costCenterId}/costCenterUsers`
      );
      return data?.data ?? [];
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const route = `/api/accountsAndFinance/cost-centers/${costCenterId}/attach-users`

      return await axios.put(route, {
        user_ids: selectedUserIds,
      });
    },

    onSuccess: () => {
      enqueueSnackbar(
         t.messages.attached,
        { variant: "success" }
      );

      queryClient.invalidateQueries({ queryKey: ["projectUsers"] });
      queryClient.invalidateQueries({ queryKey: ["cost-center-users"] });
      setOpenDialog(false);
    },
    onError: () => enqueueSnackbar(t.messages.failed, { variant: "error" }),
  });

  return (
    <>
      <DialogTitle>
        <Typography
          variant="h4"
          component="div"
          textAlign="center"
        >
          {t.titles.attachUsers}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Div sx={{ mt: 1 }}>
          <UsersSelector
            label={t.labels.selectUsers}
            multiple
            excludeUsers={costCenterUsersQuery?.data || []}
            onChange={(newValue) =>
              setSelectedUserIds(newValue?.map((u) => u.id) || [])
            }
          />
        </Div>
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" size="small" onClick={() => setOpenDialog(false)}>
          {t.buttons.cancel}
        </Button>

        <LoadingButton
          variant="contained"
          color={"success"}
          size="small"
          loading={mutation.isPending}
          disabled={selectedUserIds.length === 0}
          onClick={() => mutation.mutate()}
        >
          {t.buttons.attach}
        </LoadingButton>
      </DialogActions>
    </>
  );
};

export default ProjectUsersForm;
