import { PostAdd } from "@mui/icons-material";
import { ButtonGroup, Dialog, IconButton, Tooltip, useMediaQuery } from "@mui/material";
import React, { useState } from "react";
import SubContractMaterialIssuedForm from "./form/SubContractMaterialIssuedForm";
import { useJumboTheme } from "@jumbo/components/JumboTheme/hooks";

const SubContractMaterialIssuedActionTail = ({subContract}) => {
  const { theme } = useJumboTheme();
  const [openDialog, setOpenDialog] = useState(false)
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  return (
    <React.Fragment>
      <Dialog maxWidth="lg" fullWidth fullScreen={belowLargeScreen} open={openDialog}>
        <SubContractMaterialIssuedForm toggleOpen={setOpenDialog} subContract={subContract}/>
      </Dialog>

      <ButtonGroup variant="outlined" size="small" disableElevation sx={{ '& .MuiButton-root': { px: 1 } }}>
        <Tooltip title={"Add Material Issued"}>
          <IconButton onClick={() => setOpenDialog(true)}>
            <PostAdd/>
          </IconButton>
        </Tooltip>
      </ButtonGroup>
    </React.Fragment>
  );
};

export default SubContractMaterialIssuedActionTail;