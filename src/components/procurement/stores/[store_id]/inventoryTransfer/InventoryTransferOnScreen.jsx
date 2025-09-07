import React from 'react';
import {
  Grid,
  Typography,
  Tooltip,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';

function InventoryTransferOnScreen({ transfer, organization }) {
  const mainColor = organization.settings?.main_color || "#2113AD";
  const lightColor = organization.settings?.light_color || "#bec5da";
  const contrastText = organization.settings?.contrast_text || "#FFFFFF";

  return (
    <div>
      <Grid container spacing={2} marginBottom={2} paddingTop={2}>
        <Grid size={12} textAlign="center">
          <Typography variant="h4" color={mainColor}>INVENTORY TRANSFER</Typography>
          <Typography variant="subtitle1" fontWeight="bold">{transfer.transferNo}</Typography>
        </Grid>
      </Grid>

      <Grid container spacing={2} marginBottom={2}>
        <Grid size={{xs: 6, md: 4}}>
          <Typography variant="body2" color={mainColor}>Transfer Date:</Typography>
          <Typography variant="body2">{readableDate(transfer.transfer_date)}</Typography>
        </Grid>
        <Grid size={{xs: 6, md: 4}}>
          <Typography variant="body2" color={mainColor}>Cost Center:</Typography>
          <Typography variant="body2">{transfer.source_cost_center.name}</Typography>
        </Grid>
        <Grid size={{xs: 6, md: 4}}>
          <Typography variant="body2" color={mainColor}>From:</Typography>
          <Typography variant="body2">{transfer.source_store.name}</Typography>
        </Grid>
        <Grid size={{xs: 6, md: 4}}>
          <Typography variant="body2" color={mainColor}>To:</Typography>
          <Typography variant="body2">{transfer.destination_store.name}</Typography>
        </Grid>
      </Grid>

      {( 
        <>
          <Grid container spacing={1} paddingTop={2}>
            <Grid size={12} textAlign={'center'}>
              <Typography variant="h6" color={mainColor}>ITEMS</Typography>
            </Grid>
          </Grid>

          <TableContainer component={Paper} style={{ marginTop: 5 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{backgroundColor: mainColor, color: contrastText}}>S/N</TableCell>
                  <TableCell sx={{backgroundColor: mainColor, color: contrastText}}>Product</TableCell>
                  <TableCell sx={{backgroundColor: mainColor, color: contrastText}} align="right">Quantity</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transfer.items.map((item, index) => (
                  <TableRow key={index} sx={{ backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor }}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.product.name}</TableCell>
                    <TableCell align="right">{item.quantity} {item.measurement_unit?.symbol}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {transfer.vehicle_information && (
        <Grid container paddingTop={3}>
          <Grid size={12}>
            <Tooltip title="Information about the vehicle used for the transfer">
              <Typography variant="body2" color={mainColor}>Vehicle Information:</Typography>
            </Tooltip>
            <Typography variant="body2">{transfer.vehicle_information}</Typography>
          </Grid>
        </Grid>
      )}

      {transfer.driver_information && (
        <Grid container paddingTop={3}>
          <Grid size={12}>
            <Tooltip title="Information about the driver handling the transfer">
              <Typography variant="body2" color={mainColor}>Driver Information:</Typography>
            </Tooltip>
            <Typography variant="body2">{transfer.driver_information}</Typography>
          </Grid>
        </Grid>
      )}

      <Grid container paddingTop={3}>
        <Grid size={12}>
          <Typography variant="body2" color={mainColor}>Narration</Typography>
          <Typography variant="body2">{transfer.narration}</Typography>
        </Grid>
      </Grid>

      <Grid container paddingTop={3}>
        <Grid item xs={12}>
          <Typography variant="body2" color={mainColor}>Transfered By</Typography>
          <Typography variant="body2">{transfer.creator.name}</Typography>
        </Grid>
      </Grid>
    </div>
  );
}

export default InventoryTransferOnScreen;
