import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { LoadingButton } from '@mui/lab';
import { Box, List } from '@mui/material';
import { Stack } from '@mui/system';
import { useSnackbar } from 'notistack';
import { ProsAfricansAddNewMemberQueueItem } from './ProsAfricansAddNewMemberQueueItem';
import prosAfricansServices from '../prosAfricansServices';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface Role {
  id: number;
  name: string;
  [key: string]: any;
}

interface NewProsAfrican {
  id?: string;
  name: string;
  email: string;
  roles?: Role[];
  selectedRoles?: Role[] | number[];
}

interface ProsAfricansAddNewMemberQueueProps {
  addNewProsAfrican: NewProsAfrican[];
  setAddNewProsAfrican: React.Dispatch<React.SetStateAction<NewProsAfrican[]>>;
}

export const ProsAfricansAddNewMemberQueue: React.FC<ProsAfricansAddNewMemberQueueProps> = ({
  addNewProsAfrican,
  setAddNewProsAfrican,
}) => {
  const dictionary = useDictionary();
  const { hideDialog } = useJumboDialog();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const addMemberData = addNewProsAfrican.map((newMember) => ({
    id: newMember.id,
    role_ids: newMember.selectedRoles,
  }));

  const addMember = useMutation({
    mutationFn: () => prosAfricansServices.addMember(addMemberData),
    onSuccess: () => {
      enqueueSnackbar(dictionary.forms.prosAfricans.form.messages.invitationsSent, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['prosAfricans'] });
      hideDialog();
    },
    onError: () => {
      enqueueSnackbar(dictionary.forms.prosAfricans.form.messages.invitationsErrors, { variant: 'warning' });
    },
  });

  return (
    <Stack direction="row" flexWrap="wrap" justifyContent="center">
      {addNewProsAfrican.length > 0 && (
        <>
          <List
            sx={{
              width: '100%',
              mb: 2,
              bgcolor: 'background.paper',
            }}
          >
            {addNewProsAfrican.map((newProsAfrican) => (
              <ProsAfricansAddNewMemberQueueItem
                key={newProsAfrican.email}
                setAddNewProsAfrican={setAddNewProsAfrican}
                addNewProsAfrican={addNewProsAfrican}
                newProsAfrican={newProsAfrican}
              />
            ))}
          </List>
          <Box sx={{ width: '100%' }} display="flex" justifyContent="flex-end">
            <LoadingButton
              type="button"
              variant="contained"
              size="small"
              sx={{ mb: 3 }}
              onClick={() => addMember.mutate()}
              loading={addMember.isPending}
            >
              {dictionary.forms.prosAfricans.form.buttons.addMember}
            </LoadingButton>
          </Box>
        </>
      )}
    </Stack>
  );
};
