import { DeleteOutlineOutlined } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import { Stack } from "@mui/system";
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

export default function BulkActions(){
    const dictionary = useDictionary();
    return (
        <Stack direction={"row"} sx={{ backgroundColor: 'transparent', ml: -2}}>
            <Tooltip title={dictionary.tooltips.delete}>
                <IconButton color="error">
                    <DeleteOutlineOutlined />
                </IconButton>
            </Tooltip>
        </Stack>
    );
}