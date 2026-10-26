import { faChartGantt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ButtonGroup, Dialog, IconButton, Tooltip } from "@mui/material";
import React, { useState } from "react";
import GanttChart from "./GanttChart";
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const GanttChartActionTail = () => {
    const dictionary = useDictionary();
    const [openGanttChart, setOpenGanttChart] = useState(false);
  
    return (
        <React.Fragment>
            <Dialog maxWidth="xl" fullWidth fullScreen={true} open={openGanttChart}>
                <GanttChart setOpenGanttChart={setOpenGanttChart}/>
            </Dialog>
    
            <ButtonGroup variant="outlined" size="small" disableElevation sx={{ '& .MuiButton-root': { px: 1 } }}>
                <Tooltip title={dictionary.tooltips.ganttChart}>
                    <IconButton onClick={() => setOpenGanttChart(true)}>
                        <FontAwesomeIcon size='xs' icon={faChartGantt}/>
                    </IconButton>
                </Tooltip>
            </ButtonGroup>
        </React.Fragment>
    );
  };

  export default GanttChartActionTail;