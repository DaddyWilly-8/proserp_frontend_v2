import { DisabledByDefault, EditOutlined } from '@mui/icons-material';
import { Divider, Grid, IconButton, Tooltip, Typography } from '@mui/material';
import React, { useState } from 'react';
import CertificateItemForm from './CertificateItemForm';

const CertificateItemRow = ({
  setClearFormKey,
  submitMainForm,
  setSubmitItemForm,
  submitItemForm,
  setIsDirty,
  item,
  index,
  items = [],
  CertificateDate,
  setItems
}) => {
  const [showForm, setShowForm] = useState(false);

    const handleRemoveItem = () => {
        setItems(prevItems => {
            const newItems = [...prevItems];
            newItems.splice(index, 1);
            return newItems;
        });
    };

  return (
    <React.Fragment>
      <Divider />
      {!showForm ? (
        <Grid container
          sx={{
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'action.hover',
            }
          }}
        >
            <Grid size={{xs: 1, md: 0.5}}>
                {index + 1}.
            </Grid>

            <Grid size={{xs: 11, md: 5.5}}>
                {item.task?.name}
            </Grid>


            <Grid size={{xs: 6, md: 2}} paddingLeft={{xs: 3, md: 0}}>
                {item.certified_quantity} {item.task?.measurement_unit?.symbol}
            </Grid>

            <Grid size={{xs: 6, md: 3}}>
                {item.remarks}
            </Grid>

            <Grid textAlign={'end'} size={{xs: 12, md: 1}}>
                <Tooltip title='Edit Item'>
                    <IconButton size='small' onClick={() => setShowForm(true)}>
                        <EditOutlined fontSize='small' />
                    </IconButton>
                </Tooltip>
                <Tooltip title='Remove Item'>
                    <IconButton size='small' onClick={handleRemoveItem}>
                        <DisabledByDefault fontSize='small' color='error' />
                    </IconButton>
                </Tooltip>
            </Grid>
        </Grid>
      ) : (
        <CertificateItemForm
          setClearFormKey={setClearFormKey}
          submitMainForm={submitMainForm}
          setSubmitItemForm={setSubmitItemForm}
          submitItemForm={submitItemForm}
          setIsDirty={setIsDirty}
          item={item}
          setShowForm={setShowForm}
          index={index}
          items={items}
          CertificateDate={CertificateDate}
          setItems={setItems}
        />
      )}
    </React.Fragment>
  );
};

export default CertificateItemRow;