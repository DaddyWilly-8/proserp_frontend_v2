import { DisabledByDefault, EditOutlined } from '@mui/icons-material'
import { Divider, Grid, IconButton, Tooltip, Typography } from '@mui/material'
import React, { useState } from 'react'
import AlternativesForm from './AlternativesForm';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

function AlternativesRow({ index, setClearFormKey, setIsDirty, alternative, alternatives=[], setAlternatives}) {
    const dictionary = useDictionary();
    const product = alternative.product;
    const [showForm, setShowForm] = useState(false);

  return (
         <React.Fragment>
            <Divider/>
            {!showForm ? (
                    <Grid container 
                        marginLeft={3}
                        paddingRight={3}
                        sx={{
                            cursor: 'pointer',
                            '&:hover': {
                                bgcolor: 'action.hover',
                            }
                        }}
                    >
                        <Grid size={{xs: 1, md: 0.5}}>
                            {index+1}.
                        </Grid>
                        <Grid size={{xs: 11, md: 7}}>
                            <Tooltip title={dictionary.tooltips.alternativeInputProduct}>
                                <Typography>{product?.name}</Typography>
                            </Tooltip>
                        </Grid>
                        <Grid size={{xs: 6, md: 3}}>
                            <Tooltip title={dictionary.tooltips.quantity}>
                                <Typography>{alternative.quantity} {alternative?.unit_symbol ? alternative.unit_symbol : (alternative.measurement_unit?.symbol ? alternative.measurement_unit?.symbol : alternative.product.unit_symbol)}</Typography>
                            </Tooltip>
                        </Grid>
                        <Grid textAlign={'end'} size={{xs: 6, md: 1.5}}>
                            <Tooltip title={dictionary.tooltips.editAlternativeInputProduct}>
                                <IconButton size='small' onClick={() => {setShowForm(true)}}>
                                    <EditOutlined fontSize='small'/>
                                </IconButton>
                            </Tooltip>
                            <Tooltip title={dictionary.tooltips.removeAlternativeInputProduct}>
                                <IconButton size='small' 
                                    onClick={() => setAlternatives(alternatives => {
                                        const newItems = [...alternatives];
                                        newItems.splice(index,1);
                                        return newItems;
                                    })}
                                >
                                    <DisabledByDefault fontSize='small' color='error'/>
                                </IconButton>
                            </Tooltip>
                        </Grid>
                    </Grid>
                ) : (
                    <AlternativesForm setClearFormKey={setClearFormKey} setIsDirty={setIsDirty} alternative={alternative} setShowForm={setShowForm} index={index} alternatives={alternatives} setAlternatives={setAlternatives}/>
                )
            }
        </React.Fragment>
  )
}

export default AlternativesRow