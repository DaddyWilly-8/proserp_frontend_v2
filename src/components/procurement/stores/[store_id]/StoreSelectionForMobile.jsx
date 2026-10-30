import { AddOutlined } from '@mui/icons-material';
import { Autocomplete,Button, Dialog, Grid,TextField, Tooltip } from '@mui/material';
import React, { useState } from 'react'
import StoreForm from '../StoreForm';
import { useStoreProfile } from './StoreProfileProvider'
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

function StoreSelectionForMobile() {
    const dictionary = useDictionary();
    const {activeStore,setActiveStore,storeArrays:{selectOptions}} = useStoreProfile();
    const { checkOrganizationPermission } = useJumboAuth();
    const [openDialog, setOpenDialog] = useState(false);

  return (
    <Grid container m={2} spacing={2}>
        <Grid size={12}>
            <Autocomplete
                options={selectOptions}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={activeStore}
                renderInput={(params) => (
                    <TextField 
                        {...params}
                        size="small"
                        label={dictionary.forms.stores.selectionMobile.labels.subStoreSelect}
                    />
                )}
                onChange={(e, newValue) => {
                    setActiveStore(newValue ? newValue : activeStore);
                }}
            />
        </Grid>
        <Grid size={10}>
            <React.Fragment>
                <Dialog maxWidth="xs" open={openDialog}>
                    <StoreForm setOpenDialog={setOpenDialog} parentOptions={selectOptions}/>
                </Dialog>
                    {(
                    <Tooltip title={dictionary.tooltips.addSubStore}>
                        <Button variant="outlined" size="small" disableElevation sx={{ '& .MuiButton-root': { px: 1 } }} onClick={() => setOpenDialog(true)}>
                            <AddOutlined /> {dictionary.forms.stores.selectionMobile.buttons.subStore}
                        </Button>
                    </Tooltip>
                    )}
            </React.Fragment>
        </Grid>
    </Grid>
  )
}

export default StoreSelectionForMobile