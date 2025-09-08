import React from 'react';
import { Grid, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Alert } from '@mui/material';  // Add Alert if needed
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { MeasurementUnit } from '@/components/masters/measurementUnits/MeasurementUnitType';
import { Product } from '@/components/productAndServices/products/ProductType';
import { Organization } from '@/types/auth-types';
import { BOM, BOMItem } from '../BomType';  // Import BOM from BomType (remove local interface)

interface BomOnScreenProps {
  bom?: BOM;  // <-- Make optional with ?
  organization?: Organization;  // Also optional for consistency
}

function BomOnScreen({ bom, organization }: BomOnScreenProps) {
  if (!bom) {
    return <Alert severity="error">BOM data not available</Alert>;  // Guard at top
  }

  const mainColor = organization?.settings?.main_color || '#2113AD';
  const lightColor = organization?.settings?.light_color || '#bec5da';
  const contrastText = organization?.settings?.contrast_text || '#FFFFFF';

  return (
    <div>
      <Grid container spacing={2} style={{ marginTop: 20 }}>
        <Grid size={{ xs: 12 }} style={{ textAlign: 'center' }}>
          <Typography variant="h4" style={{ color: mainColor }}>
            BILL OF MATERIALS
          </Typography>
          <Typography variant="subtitle1" fontWeight="bold">
            BOM #{bom.id}
          </Typography>
        </Grid>
      </Grid>

      <Grid container spacing={2} style={{ marginTop: 5, marginBottom: 10 }}>
        <Grid size={{ xs: 8 }}>
          <Typography variant="body2" style={{ color: mainColor }}>
            Date
          </Typography>
          <Typography variant="body2">{readableDate(new Date().toISOString())}</Typography>
        </Grid>
        <Grid size={{ xs: 4 }} textAlign="center">
          <Typography variant="body2" style={{ color: mainColor }}>
            Organization
          </Typography>
          <Typography variant="body2">{organization?.name || 'N/A'}</Typography>
        </Grid>
      </Grid>

      <Grid container spacing={2} style={{ marginTop: 10 }}>
        <Grid size={{ xs: 6 }}>
          <Typography variant="body2" style={{ color: mainColor }}>
            Product
          </Typography>
          <Typography variant="body2">{bom.product?.name || 'N/A'}</Typography>
        </Grid>
        <Grid size={{ xs: 6 }} textAlign="right">
          <Typography variant="body2" style={{ color: mainColor }}>
            Quantity
          </Typography>
          <Typography variant="body2">
            {bom.quantity || 0} {bom.symbol || bom.measurement_unit?.symbol || ''}  // Add || 0 for null safety
          </Typography>
        </Grid>
      </Grid>

      <TableContainer component={Paper} style={{ marginTop: 20 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>S/N</TableCell>
              <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>Item</TableCell>
              <TableCell sx={{ backgroundColor: mainColor, color: contrastText }} align="right">Quantity</TableCell>
              <TableCell sx={{ backgroundColor: mainColor, color: contrastText }} align="right">Unit</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bom.items.map((item, index) => (
              <TableRow key={item.id || index} sx={{ backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor }}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{item.product?.name || 'N/A'}</TableCell>
                <TableCell align="right">{item.quantity || 0}</TableCell>  {/* Add null safety */}
                <TableCell align="right">{item.measurement_unit?.symbol || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {bom.alternatives?.length > 0 && (  // Already safe from previous fix
        <>
          <Typography variant="h6" style={{ marginTop: 20, color: mainColor }}>
            Alternative Items
          </Typography>
          <TableContainer component={Paper} style={{ marginTop: 10 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>S/N</TableCell>
                  <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>Item</TableCell>
                  <TableCell sx={{ backgroundColor: mainColor, color: contrastText }} align="right">Quantity</TableCell>
                  <TableCell sx={{ backgroundColor: mainColor, color: contrastText }} align="right">Unit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bom.alternatives.map((item, index) => (
                  <TableRow key={item.id || index} sx={{ backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor }}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.product?.name || 'N/A'}</TableCell>
                    <TableCell align="right">{item.quantity || 0}</TableCell>  {/* Add null safety */}
                    <TableCell align="right">{item.measurement_unit?.symbol || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </div>
  );
}

export default BomOnScreen;