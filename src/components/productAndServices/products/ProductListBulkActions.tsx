import { DeleteOutlined } from '@mui/icons-material'
import { IconButton, Stack, Tooltip } from '@mui/material'
import React from 'react'
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const ProductListBulkActions = () => {
  const dictionary = useDictionary();
  return (
    <Stack direction={"row"} sx={{ backgroundColor: 'transparent', ml: -2}}>
        <Tooltip title={dictionary.tooltips.delete}>
            <IconButton color="error">
                <DeleteOutlined />
            </IconButton>
        </Tooltip>
    </Stack>
  )
}

export default ProductListBulkActions